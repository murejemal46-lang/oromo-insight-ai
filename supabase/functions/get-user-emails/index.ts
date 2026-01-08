import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('get-user-emails: Missing authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's token to verify their identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the JWT and get user claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('get-user-emails: Invalid token:', claimsError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestingUserId = claimsData.claims.sub;
    console.log(`get-user-emails: Request from user ${requestingUserId}`);

    // Verify the requesting user has admin role using their client
    const { data: roleData, error: roleError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('get-user-emails: User is not admin:', roleError);
      return new Response(JSON.stringify({ error: 'Forbidden - admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`get-user-emails: Admin access confirmed for user ${requestingUserId}`);

    // Get the user IDs from the request body
    const { user_ids } = await req.json();

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'user_ids array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit the number of users to fetch to prevent abuse
    if (user_ids.length > 50) {
      return new Response(JSON.stringify({ error: 'Maximum 50 user IDs per request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create admin client with service role key (server-side only)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch user emails using admin API
    const userEmails: Record<string, string | null> = {};
    
    for (const userId of user_ids) {
      try {
        const { data, error } = await adminClient.auth.admin.getUserById(userId);
        if (!error && data?.user?.email) {
          userEmails[userId] = data.user.email;
        } else {
          userEmails[userId] = null;
        }
      } catch (e) {
        console.error(`get-user-emails: Error fetching user ${userId}:`, e);
        userEmails[userId] = null;
      }
    }

    console.log(`get-user-emails: Successfully fetched ${Object.keys(userEmails).length} emails`);

    return new Response(JSON.stringify({ emails: userEmails }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('get-user-emails error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
