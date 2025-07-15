import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    try {
        const { text } = await req.json();
        const apiKey = Deno.env.get("OPENAI_KEY");

        if (!apiKey) {
            return new Response("API key is not set", { status: 500, headers: corsHeaders });
        }

        const prompt = `Ты — ассистент фэнтезийного календаря. Ответь только списком названий без нумерации, без дополнительных пояснений. ${text}`;

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
            }),
        });

        const result = await openaiRes.json();

        const content = result.choices?.[0]?.message?.content || '';
        return new Response(JSON.stringify({ result: content }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: corsHeaders,
        });
    }
});
