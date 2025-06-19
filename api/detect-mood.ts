import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage } from 'http';

function withCORS(
    handler: (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>
) {
    return async (req: VercelRequest, res: VercelResponse) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }

        return handler(req, res);
    };
}

export const config = {
    api: {
        bodyParser: false,
    },
};

// async function coreHandler(req: VercelRequest, res: VercelResponse) {
//     const authKey = process.env.GIGACHAT_AUTH_KEY;
//     const clientId = process.env.GIGACHAT_CLIENT_ID;

//     if (!authKey || !clientId) {
//         return res.status(500).json({ error: 'Missing env vars' });
//     }

//     if (req.method !== 'POST') {
//         return res.status(405).end('Method Not Allowed');
//     }

//     let content = '';

//     try {
//         const buffers: Uint8Array[] = [];
//         for await (const chunk of req as IncomingMessage) {
//             buffers.push(chunk);
//         }

//         const rawBody = Buffer.concat(buffers).toString();
//         const parsed = JSON.parse(rawBody);
//         content = parsed.content;
//     } catch (err) {
//         return res.status(400).json({ error: 'Invalid JSON' });
//     }

//     if (!content) {
//         return res.status(400).json({ error: 'Нет поля content' });
//     }

//     const plainText = content.replace(/<[^>]*>?/gm, '').trim();

//     const prompt = `
// Ты — ассистент, который анализирует краткие истории (хроники) и определяет их общее настроение.

// Прочитай текст ниже и верни результат в следующем формате:
// [эмоджи] [название настроения]

// Никаких пояснений. Только один вариант.

// Вот текст хроники:
// "${plainText}"
// `.trim();

//     try {
//         const tokenRes = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 Accept: 'application/json',
//                 RqUID: uuidv4(),
//                 Authorization: `Basic ${authKey}`,
//             },
//             body: 'scope=GIGACHAT_API_PERS',
//         });

//         const tokenData = await tokenRes.json();
//         const token = tokenData.access_token;

//         if (!token) {
//             return res.status(500).json({ error: 'Не удалось получить токен' });
//         }

//         const chatRes = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
//             method: 'POST',
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 'Content-Type': 'application/json',
//                 Accept: 'application/json',
//             },
//             body: JSON.stringify({
//                 model: 'GigaChat',
//                 messages: [{ role: 'user', content: prompt }],
//             }),
//         });

//         const chatData = await chatRes.json();
//         const mood = chatData.choices?.[0]?.message?.content?.trim() || '📖 Неопределённое';

//         return res.status(200).json({ mood });
//     } catch (err) {
//         console.error('Ошибка GigaChat API:', err);
//         return res.status(500).json({ error: 'Ошибка GigaChat API', detail: (err as Error).message });
//     }
// }

async function coreHandler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }

    return res.status(200).json({ mood: '🧪 Тест' });
}

export default withCORS(coreHandler);