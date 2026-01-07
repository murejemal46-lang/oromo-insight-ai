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
    
    let systemPrompt = `You are QALACA, an AI writing assistant for journalists at Oromo Times.
You help journalists write better, more accurate, and more engaging articles.
Always respond in ${languageName}.
Be concise, helpful, and constructive.
Focus on journalism best practices: accuracy, clarity, objectivity, and engagement.`;

    let userPrompt = '';

    switch (action) {
      case 'check':
        systemPrompt += `
You are fact-checking an article draft.
Analyze the claims and provide:
1. List of factual claims made in the article
2. Potential issues or claims that need verification
3. Suggestions for sources to verify information
4. Any inconsistencies or logical problems
Be specific and actionable in your feedback.`;
        userPrompt = `Fact-check this ${category} article draft:

Title: ${title}

Content: ${content}`;
        break;

      case 'improve':
        systemPrompt += `
You are providing editorial suggestions.
Analyze the writing and provide:
1. Suggestions for improving clarity and readability
2. Ways to make the lead/opening stronger
3. Structure improvements
4. Headline suggestions if needed
5. Ways to make it more engaging
Be specific with examples from the text.`;
        userPrompt = `Suggest improvements for this ${category} article:

Title: ${title}

Content: ${content}`;
        break;

      case 'translate':
        systemPrompt += `
You are helping with translation between Oromo and English.
The journalist is writing in ${languageName}.
Provide:
1. Key phrases or sentences that might be challenging to translate
2. Cultural context that should be preserved
3. Suggested translations for technical terms
4. Tips for maintaining the article's tone across languages`;
        userPrompt = `Help translate/localize this ${category} article:

Title: ${title}

Content: ${content}

The article is currently in ${languageName}. Provide translation guidance.`;
        break;

      default:
        throw new Error('Invalid action');
    }

    console.log(`QALACA Journalist: Processing ${action} request in ${languageName}`);

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

    console.log(`QALACA Journalist: Successfully processed ${action} request`);

    return new Response(JSON.stringify({ 
      result,
      action,
      language,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("QALACA Journalist error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
