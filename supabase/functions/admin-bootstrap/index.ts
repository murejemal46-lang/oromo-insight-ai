import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const initialAdminEmail = Deno.env.get('INITIAL_ADMIN_EMAIL');
    const initialAdminPassword = Deno.env.get('INITIAL_ADMIN_PASSWORD');

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if bootstrap was already completed
    const { data: bootstrapSetting } = await adminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'bootstrap_completed')
      .single();

    if (bootstrapSetting?.value?.completed === true) {
      console.log('Bootstrap already completed, skipping');
      return new Response(
        JSON.stringify({ success: true, message: 'Bootstrap already completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if any admin already exists
    const { data: existingAdmins, error: adminCheckError } = await adminClient
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminCheckError) {
      console.error('Error checking existing admins:', adminCheckError);
      throw new Error('Failed to check existing admins');
    }

    if (existingAdmins && existingAdmins.length > 0) {
      // Mark bootstrap as completed since admin exists
      await adminClient
        .from('admin_settings')
        .update({ value: { completed: true }, updated_at: new Date().toISOString() })
        .eq('key', 'bootstrap_completed');

      console.log('Admin already exists, marking bootstrap as complete');
      return new Response(
        JSON.stringify({ success: true, message: 'Admin already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate environment variables
    if (!initialAdminEmail || !initialAdminPassword) {
      console.error('Missing INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing admin credentials in environment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    if (initialAdminPassword.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating initial admin user:', initialAdminEmail);

    // Create the admin user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: initialAdminEmail,
      password: initialAdminPassword,
      email_confirm: true,
      user_metadata: { full_name: 'System Administrator' }
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create admin user');
    }

    const adminUserId = authData.user.id;
    console.log('Admin user created with ID:', adminUserId);

    // Update the user's role to admin with system_owner flag
    const { error: roleError } = await adminClient
      .from('user_roles')
      .update({ role: 'admin', is_system_owner: true })
      .eq('user_id', adminUserId);

    if (roleError) {
      console.error('Error updating role:', roleError);
      // If role update fails, try inserting
      const { error: insertRoleError } = await adminClient
        .from('user_roles')
        .insert({ user_id: adminUserId, role: 'admin', is_system_owner: true });
      
      if (insertRoleError) {
        console.error('Error inserting role:', insertRoleError);
        throw insertRoleError;
      }
    }

    // Mark bootstrap as completed
    await adminClient
      .from('admin_settings')
      .update({ value: { completed: true }, updated_at: new Date().toISOString() })
      .eq('key', 'bootstrap_completed');

    // Log the admin creation in audit logs
    await adminClient
      .from('audit_logs')
      .insert({
        admin_id: adminUserId,
        action_type: 'ADMIN_BOOTSTRAP',
        target_user_id: adminUserId,
        metadata: { 
          email: initialAdminEmail,
          is_system_owner: true,
          created_via: 'environment_variables'
        },
        ip_address: req.headers.get('x-forwarded-for') || 'system'
      });

    console.log('Admin bootstrap completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Initial admin created successfully',
        adminId: adminUserId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Bootstrap error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
