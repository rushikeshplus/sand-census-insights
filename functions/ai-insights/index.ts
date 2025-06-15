
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { summary, preview } = await req.json();

    const prompt = `
You are a helpful data analyst. 
Given this dataset summary and some sample rows, write 3-5 interesting insights about the data — e.g., trends, anomalies, column relationships, unique values, or anything remarkable.
Write the insights as a short bullet-point list.
Dataset summary: ${summary}
Sample rows: ${JSON.stringify(preview)}
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a friendly data analyst bot." },
          { role: "user", content: prompt }
        ]
      }),
    });

    const data = await openaiRes.json();
    const insights = data.choices?.[0]?.message?.content ?? "Could not generate insights.";

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("AI Insights error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
