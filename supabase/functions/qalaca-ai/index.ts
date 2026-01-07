import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log(`QALACA: Processing ${action} request in ${languageName}`);

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

    console.log(`QALACA: Successfully processed ${action} request`);

    return new Response(JSON.stringify({ 
      result,
      action,
      language,
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
