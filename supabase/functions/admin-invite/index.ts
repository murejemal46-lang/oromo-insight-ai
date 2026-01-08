import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function for token (in production, use a proper crypto library)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate secure random token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user client to verify JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminUserId = claims.claims.sub;

    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify user is an admin
    const { data: adminRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, email, inviteToken } = await req.json();

    if (action === 'create') {
      // Create new invitation
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user already exists with admin role
      const { data: existingUser } = await adminClient.auth.admin.listUsers();
      const userWithEmail = existingUser?.users?.find(u => u.email === email);
      
      if (userWithEmail) {
        const { data: existingRole } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', userWithEmail.id)
          .eq('role', 'admin')
          .single();

        if (existingRole) {
          return new Response(
            JSON.stringify({ error: 'User is already an admin' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check for pending invitation
      const { data: existingInvite } = await adminClient
        .from('admin_invitations')
        .select('id, expires_at')
        .eq('email', email)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existingInvite) {
        return new Response(
          JSON.stringify({ error: 'Pending invitation already exists for this email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate secure token
      const rawToken = generateSecureToken();
      const tokenHash = await hashToken(rawToken);
      
      // Set expiration to 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create invitation
      const { data: invitation, error: inviteError } = await adminClient
        .from('admin_invitations')
        .insert({
          email,
          token_hash: tokenHash,
          invited_by: adminUserId,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        throw inviteError;
      }

      // Log the action
      await adminClient.from('audit_logs').insert({
        admin_id: adminUserId,
        action_type: 'ADMIN_INVITE_CREATED',
        metadata: { email, invitation_id: invitation.id, expires_at: expiresAt.toISOString() },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });

      console.log('Admin invitation created for:', email);

      return new Response(
        JSON.stringify({ 
          success: true, 
          token: rawToken,
          expiresAt: expiresAt.toISOString(),
          message: 'Invitation created successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'accept') {
      // Accept invitation and create/upgrade admin
      if (!inviteToken || !email) {
        return new Response(
          JSON.stringify({ error: 'Token and email are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenHash = await hashToken(inviteToken);

      // Find valid invitation
      const { data: invitation, error: inviteCheckError } = await adminClient
        .from('admin_invitations')
        .select('*')
        .eq('email', email)
        .eq('token_hash', tokenHash)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteCheckError || !invitation) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired invitation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user exists
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      let targetUserId: string;

      if (existingUser) {
        targetUserId = existingUser.id;
        
        // Update existing user's role to admin
        const { error: updateError } = await adminClient
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', targetUserId);

        if (updateError) {
          // Try insert if update fails
          await adminClient.from('user_roles').insert({ user_id: targetUserId, role: 'admin' });
        }
      } else {
        // This case shouldn't happen in normal flow - user should sign up first
        return new Response(
          JSON.stringify({ error: 'Please sign up first, then use the invitation link' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark invitation as used
      await adminClient
        .from('admin_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invitation.id);

      // Log the action
      await adminClient.from('audit_logs').insert({
        admin_id: invitation.invited_by,
        action_type: 'ADMIN_INVITE_ACCEPTED',
        target_user_id: targetUserId,
        metadata: { email, invitation_id: invitation.id },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });

      console.log('Admin invitation accepted for:', email);

      return new Response(
        JSON.stringify({ success: true, message: 'Admin access granted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'list') {
      // List all invitations
      const { data: invitations, error: listError } = await adminClient
        .from('admin_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (listError) throw listError;

      return new Response(
        JSON.stringify({ invitations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'revoke') {
      // Revoke admin access (not for system_owner)
      const { targetUserId } = await req.json();

      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: 'Target user ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if target is system owner
      const { data: targetRole } = await adminClient
        .from('user_roles')
        .select('is_system_owner')
        .eq('user_id', targetUserId)
        .eq('role', 'admin')
        .single();

      if (targetRole?.is_system_owner) {
        return new Response(
          JSON.stringify({ error: 'Cannot revoke system owner admin access' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Downgrade to reader
      await adminClient
        .from('user_roles')
        .update({ role: 'reader' })
        .eq('user_id', targetUserId);

      // Log the action
      await adminClient.from('audit_logs').insert({
        admin_id: adminUserId,
        action_type: 'ADMIN_ACCESS_REVOKED',
        target_user_id: targetUserId,
        metadata: {},
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Admin access revoked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Admin invite error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
