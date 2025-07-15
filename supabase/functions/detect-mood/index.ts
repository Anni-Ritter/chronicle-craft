import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    try {
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        const { text } = await req.json();

        const apiKey = Deno.env.get("OPENAI_KEY");
        if (!apiKey) {
            return new Response("❌ OPENAI_API_KEY не задан в переменных окружения", {
                status: 500,
                headers: corsHeaders,
            });
        }


        if (!text) {
            return new Response("⛔ Поле 'content' не передано", {
                status: 400,
                headers: corsHeaders,
            });
        }

        const plainText = text.replace(/<[^>]*>?/gm, '').trim();
        const prompt = `
                Ты — ассистент, который анализирует краткие истории (хроники) и определяет их общее настроение.

                Прочитай текст ниже и верни результат в следующем формате:
                [эмоджи] [название настроения]

                Никаких пояснений. Только один вариант.

                Вот текст хроники:
                "${plainText}"
                `;

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
            }),
        });

        const data = await openaiRes.json();
        if (!openaiRes.ok) {
            console.error("❌ Ошибка OpenAI:", data);
            return new Response(JSON.stringify({ error: "OpenAI error", detail: data }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        let mood = data.choices?.[0]?.message?.content?.trim() || "📖 Неопределённое";

        return new Response(JSON.stringify({ mood }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });

    } catch (err) {
        console.error("💥 Global error:", err);
        return new Response(JSON.stringify({ error: "Internal error", detail: `${err}` }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
            },
        });
    }
})
