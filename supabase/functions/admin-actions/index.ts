import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify admin role
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

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'get_stats': {
        // Get system statistics
        const [usersResult, articlesResult, journalistRequestsResult, aiLogsResult] = await Promise.all([
          adminClient.from('profiles').select('id', { count: 'exact', head: true }),
          adminClient.from('articles').select('id, status', { count: 'exact' }),
          adminClient.from('journalist_requests').select('id, status'),
          adminClient.from('ai_logs').select('id', { count: 'exact', head: true })
        ]);

        const { data: rolesCounts } = await adminClient
          .from('user_roles')
          .select('role');

        const roleCounts = {
          admin: 0,
          editor: 0,
          journalist: 0,
          reader: 0
        };

        rolesCounts?.forEach(r => {
          if (r.role in roleCounts) {
            roleCounts[r.role as keyof typeof roleCounts]++;
          }
        });

        const pendingRequests = journalistRequestsResult.data?.filter(r => r.status === 'pending').length || 0;

        const { data: aiSettings } = await adminClient
          .from('admin_settings')
          .select('key, value')
          .in('key', ['ai_enabled', 'ai_verification_threshold']);

        return new Response(
          JSON.stringify({
            totalUsers: usersResult.count || 0,
            totalArticles: articlesResult.count || 0,
            pendingJournalistRequests: pendingRequests,
            totalAiLogs: aiLogsResult.count || 0,
            roleCounts,
            aiSettings: Object.fromEntries(aiSettings?.map(s => [s.key, s.value]) || [])
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list_users': {
        const { page = 1, limit = 20, roleFilter } = body;
        const offset = (page - 1) * limit;

        // Get users from auth
        const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers({
          page,
          perPage: limit
        });

        if (authError) throw authError;

        // Get profiles and roles for these users
        const userIds = authUsers.users.map(u => u.id);
        
        const [profilesResult, rolesResult] = await Promise.all([
          adminClient.from('profiles').select('*').in('user_id', userIds),
          adminClient.from('user_roles').select('*').in('user_id', userIds)
        ]);

        const users = authUsers.users.map(authUser => {
          const profile = profilesResult.data?.find(p => p.user_id === authUser.id);
          const role = rolesResult.data?.find(r => r.user_id === authUser.id);
          return {
            id: authUser.id,
            email: authUser.email,
            fullName: profile?.full_name,
            role: role?.role || 'reader',
            isSystemOwner: role?.is_system_owner || false,
            createdAt: authUser.created_at,
            lastSignIn: authUser.last_sign_in_at
          };
        });

        // Filter by role if specified
        const filteredUsers = roleFilter 
          ? users.filter(u => u.role === roleFilter)
          : users;

        return new Response(
          JSON.stringify({ users: filteredUsers, total: authUsers.users.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_user_role': {
        const { targetUserId, newRole } = body;

        if (!targetUserId || !newRole) {
          return new Response(
            JSON.stringify({ error: 'Target user ID and new role are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if target is system owner (cannot change their role)
        const { data: targetRole } = await adminClient
          .from('user_roles')
          .select('is_system_owner, role')
          .eq('user_id', targetUserId)
          .single();

        if (targetRole?.is_system_owner && newRole !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Cannot change role of system owner' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await adminClient
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', targetUserId);

        if (updateError) throw updateError;

        // Log the action
        await adminClient.from('audit_logs').insert({
          admin_id: adminUserId,
          action_type: 'USER_ROLE_CHANGED',
          target_user_id: targetUserId,
          metadata: { 
            previous_role: targetRole?.role,
            new_role: newRole 
          },
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return new Response(
          JSON.stringify({ success: true, message: 'Role updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_ai_settings': {
        const { key, value } = body;

        if (!key || value === undefined) {
          return new Response(
            JSON.stringify({ error: 'Key and value are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await adminClient
          .from('admin_settings')
          .update({ 
            value, 
            updated_by: adminUserId,
            updated_at: new Date().toISOString()
          })
          .eq('key', key);

        if (updateError) throw updateError;

        // Log the action
        await adminClient.from('audit_logs').insert({
          admin_id: adminUserId,
          action_type: 'AI_SETTINGS_UPDATED',
          metadata: { key, value },
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return new Response(
          JSON.stringify({ success: true, message: 'Settings updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_audit_logs': {
        const { page = 1, limit = 50, actionType, startDate, endDate } = body;
        const offset = (page - 1) * limit;

        let query = adminClient
          .from('audit_logs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (actionType) {
          query = query.eq('action_type', actionType);
        }
        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data: logs, count, error } = await query;

        if (error) throw error;

        // Get admin emails for the logs
        const adminIds = [...new Set(logs?.map(l => l.admin_id) || [])];
        const { data: authUsers } = await adminClient.auth.admin.listUsers();
        
        const adminEmails = Object.fromEntries(
          authUsers?.users
            ?.filter(u => adminIds.includes(u.id))
            ?.map(u => [u.id, u.email]) || []
        );

        const enrichedLogs = logs?.map(log => ({
          ...log,
          admin_email: adminEmails[log.admin_id] || 'Unknown'
        }));

        return new Response(
          JSON.stringify({ logs: enrichedLogs, total: count }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list_admins': {
        const { data: adminRoles } = await adminClient
          .from('user_roles')
          .select('user_id, is_system_owner')
          .eq('role', 'admin');

        if (!adminRoles?.length) {
          return new Response(
            JSON.stringify({ admins: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const adminUserIds = adminRoles.map(r => r.user_id);
        
        const [profilesResult, authResult] = await Promise.all([
          adminClient.from('profiles').select('*').in('user_id', adminUserIds),
          adminClient.auth.admin.listUsers()
        ]);

        const admins = adminRoles.map(role => {
          const profile = profilesResult.data?.find(p => p.user_id === role.user_id);
          const authUser = authResult.data?.users?.find(u => u.id === role.user_id);
          return {
            id: role.user_id,
            email: authUser?.email,
            fullName: profile?.full_name,
            isSystemOwner: role.is_system_owner,
            createdAt: authUser?.created_at,
            lastSignIn: authUser?.last_sign_in_at
          };
        });

        return new Response(
          JSON.stringify({ admins }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: unknown) {
    console.error('Admin action error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
