import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

const clientId = process.env.GIGACHAT_CLIENT_ID!;
const authKey = process.env.GIGACHAT_AUTH_KEY!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};
const withCORS = (res: VercelResponse) => {
    return res
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    withCORS(res);

    if (req.method === 'OPTIONS') {
        return res.writeHead(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Нет поля content' });

    const plainText = content.replace(/<[^>]*>?/gm, '').trim();

    const prompt = `
Ты — ассистент, который анализирует краткие истории (хроники) и определяет их общее настроение.

Прочитай текст ниже и верни результат в следующем формате:
[эмоджи] [название настроения]

Никаких пояснений. Только один вариант.

Вот текст хроники:
"${plainText}"
`.trim();

    try {
        const tokenRes = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
                RqUID: uuidv4(),
                Authorization: `Basic ${authKey}`,
            },
            body: 'scope=GIGACHAT_API_PERS',
        });

        const tokenData = await tokenRes.json();
        const token = tokenData.access_token;

        if (!token) return res.status(500).json({ error: 'Не удалось получить токен' });

        const chatRes = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                model: 'GigaChat',
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        const chatData = await chatRes.json();
        const mood = chatData.choices?.[0]?.message?.content?.trim() || '📖 Неопределённое';

        return res.status(200).json({ mood });
    } catch (err) {
        console.error('Ошибка GigaChat API:', err);
        return res.status(500).json({ error: 'Ошибка GigaChat API', detail: (err as Error).message });
    }
}
