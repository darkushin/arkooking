// Supabase Edge Function using GPT-4o to extract recipe data from a given URL
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      console.error("Method not allowed: ", req.method);
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders
      });
    }

    let link;
    try {
      const body = await req.json();
      link = body.link;
      if (!link) throw new Error("Missing link");
    } catch (e) {
      console.error("Error parsing request body or missing link:", e);
      return new Response(JSON.stringify({ error: "Missing link or invalid JSON", details: String(e) }), {
        status: 400,
        headers: corsHeaders
      });
    }
    console.log("Processing link:", link);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("Missing OpenAI API key");
      return new Response(JSON.stringify({ error: "Missing OpenAI API key" }), {
        status: 500,
        headers: corsHeaders
      });
    }

    // Fetch and extract visible text content from the recipe page
    let pageText = "";
    try {
      const html = await fetch(link).then(res => res.text());
      const doc = new DOMParser().parseFromString(html, "text/html");
      pageText = doc?.body?.textContent || "";
      console.log(`Fetched page text for link (${link}), length:`, pageText.length);
    } catch (e) {
      console.error("Failed to fetch or parse the recipe page:", link, e);
      return new Response(JSON.stringify({
        error: "Failed to fetch or parse the recipe page",
        details: String(e)
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const prompt = `You are a helpful assistant designed to extract structured data from unstructured recipe webpages.

Given the following recipe text, return a JSON object with the following fields:
- title (string)
- description (string)
- ingredients (array of strings)
- instructions (array of strings)
- cookTime (number, in minutes)
- prepTime (number, in minutes)
- servings (number)

If any value is missing, return null. Output only valid JSON.

### Recipe:
${pageText}`;

    let openaiRes, data;
    try {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a data extraction assistant that outputs only JSON." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2
        })
      });
      data = await openaiRes.json();
      if (!openaiRes.ok) {
        console.error("OpenAI API error:", data);
        return new Response(JSON.stringify({ error: "OpenAI API error", details: data }), {
          status: 500,
          headers: corsHeaders
        });
      }
    } catch (e) {
      console.error("Error calling OpenAI API:", e);
      return new Response(JSON.stringify({ error: "Error calling OpenAI API", details: String(e) }), {
        status: 500,
        headers: corsHeaders
      });
    }

    let recipe;
    try {
      const content = data.choices[0].message.content.trim();
      const jsonStart = content.indexOf("{");
      const jsonEnd = content.lastIndexOf("}") + 1;
      recipe = JSON.parse(content.substring(jsonStart, jsonEnd));
    } catch (e) {
      console.error("Failed to parse recipe JSON:", {
        link,
        openai_response: data,
        error: e
      });
      return new Response(JSON.stringify({
        error: "Failed to parse recipe JSON",
        details: String(e),
        data
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify(recipe), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({
      error: "Unexpected error",
      details: String(e)
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
