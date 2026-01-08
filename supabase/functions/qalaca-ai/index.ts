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
      console.error('QALACA: Missing or invalid authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized - please log in to use QALACA' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the JWT and get user claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('QALACA: Invalid token:', claimsError);
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    console.log(`QALACA: Authenticated user ${userId}`);

    // Check user's AI usage quota
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_usage_count, ai_usage_limit')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('QALACA: Error fetching profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to check usage quota' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const usageCount = profile?.ai_usage_count || 0;
    const usageLimit = profile?.ai_usage_limit || 50;

    if (usageCount >= usageLimit) {
      console.log(`QALACA: User ${userId} exceeded usage limit (${usageCount}/${usageLimit})`);
      return new Response(JSON.stringify({ 
        error: 'AI usage limit exceeded',
        usage: { count: usageCount, limit: usageLimit }
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, title, content, language, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageName = language === 'om' ? 'Oromo' : 'English';
    
    let systemPrompt = `You are QALACA, an AI news intelligence assistant for Oromo Times, a trusted news platform. 
You assist readers by providing transparent, fact-based analysis.
Always respond in ${languageName}.
Be concise, clear, and professional.
Never make up facts - if uncertain, say so.
Always cite your reasoning and be transparent about limitations.`;

    let userPrompt = '';

    switch (action) {
      case 'verify':
        systemPrompt += `
You are performing fact-checking and credibility analysis.
Analyze the claims made in the article.
Provide a credibility assessment with:
1. Key claims identified
2. Assessment of each claim (verified/unverified/needs context)
3. Overall credibility score (High/Medium/Low)
4. Sources that could verify this information
5. Any red flags or concerns`;
        userPrompt = `Analyze the credibility of this ${category} article:

Title: ${title}

Content: ${content}`;
        break;

      case 'summarize':
        systemPrompt += `
You are providing article summaries.
Create a clear, accurate summary that:
1. Highlights the main points (3-5 bullet points)
2. Captures the key facts
3. Maintains neutrality
4. Is easy to understand`;
        userPrompt = `Summarize this ${category} article:

Title: ${title}

Content: ${content}`;
        break;

      case 'explain':
        systemPrompt += `
You are explaining context and background.
Help readers understand:
1. Historical context
2. Key terms and concepts
3. Why this topic matters
4. Related background information
5. Different perspectives on the issue`;
        userPrompt = `Explain the context and background of this ${category} article:

Title: ${title}

Content: ${content}`;
        break;

      default:
        throw new Error('Invalid action');
    }

    console.log(`QALACA: Processing ${action} request for user ${userId} in ${languageName} (usage: ${usageCount + 1}/${usageLimit})`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';

    // Increment usage count after successful AI call
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ai_usage_count: usageCount + 1 })
      .eq('user_id', userId);

    if (updateError) {
      console.error('QALACA: Failed to update usage count:', updateError);
    }

    console.log(`QALACA: Successfully processed ${action} request for user ${userId}`);

    return new Response(JSON.stringify({ 
      result,
      action,
      language,
      usage: { count: usageCount + 1, limit: usageLimit }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("QALACA error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
