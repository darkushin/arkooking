import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
    }

    const { link } = await req.json();

    if (!link) {
      return new Response(JSON.stringify({ error: "Missing link" }), { status: 400, headers: corsHeaders });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OpenAI API key" }), { status: 500, headers: corsHeaders });
    }

    // Fetch the HTML content of the recipe page
    let html = "";
    try {
      const res = await fetch(link);
      html = await res.text();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to fetch the recipe page" }), { status: 400, headers: corsHeaders });
    }

    // Prompt for OpenAI
    const prompt = `
You are a recipe extraction assistant. Given the following HTML content of a recipe page, extract the following fields as JSON:
- title
- description
- ingredients (as a string array)
- instructions (as a string array)
- cookTime (in minutes, number)
- prepTime (in minutes, number)
- servings (number)
- tags (as a string array)
If a field is missing, use an empty value.

HTML:
${html}

Return only the JSON object.
`;

    // Call OpenAI API
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!openaiRes.ok) {
      const error = await openaiRes.text();
      return new Response(JSON.stringify({ error: "OpenAI API error", details: error }), { status: 500, headers: corsHeaders });
    }

    const data = await openaiRes.json();
    let recipe = {};
    try {
      // Try to parse the JSON from the model's response
      const text = data.choices[0].message.content.trim();
      recipe = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to parse recipe JSON" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify(recipe), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});