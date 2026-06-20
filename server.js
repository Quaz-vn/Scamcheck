const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

if (!globalThis.fetch)
{
    try
    {
        const fetch = require('node-fetch');
        globalThis.fetch = fetch;
    } catch (e)
    {
        console.warn("Cảnh báo: Bạn đang dùng Node cũ, hãy chạy lệnh: npm install node-fetch@2");
    }
}

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const PORT = process.env.PORT || 3000;

function parseKeyList(raw)
{
    return String(raw || '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
}

async function callGeminiOnce(url, apiKey, body)
{
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-goog-api-key'] = apiKey;

    const fetchFn = globalThis.fetch;
    const upstreamRes = await fetchFn(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    if (!upstreamRes.ok)
    {
        const text = await upstreamRes.text().catch(() => '');
        return { ok: false, status: upstreamRes.status, text };
    }

    const data = await upstreamRes.json().catch(() => null);
    return { ok: true, data };
}

function buildPrompt(message)
{
    return `Bạn là một chuyên gia phân tích cấu trúc tin nhắn lừa đảo. Hãy phân tích tin nhắn được cung cấp và TRẢ VỀ DUY NHẤT một đối tượng JSON, tuyệt đối không kèm theo lời giải thích nào ở ngoài cấu trúc này.

Cấu trúc JSON bắt buộc phải theo định dạng sau:
{
  "risk": "An toàn" hoặc "Nghi ngờ" hoặc "Nguy hiểm",
  "signs": [
    {
      "quote": "trích dẫn nguyên văn từ ngữ/đoạn chữ là bằng chứng lừa đảo từ tin nhắn gốc",
      "reason": "lý do vì sao đoạn chữ này đáng ngờ"
    }
  ],
  "actions": [
    "Hành động khuyên dùng cụ thể 1",
    "Hành động khuyên dùng cụ thể 2"
  ]
}

Tin nhắn cần kiểm tra:
${message}`;
}

app.post('/api/analyze', async (req, res) =>
{
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'missing message' });

    const prompt = buildPrompt(message);

    const rawUrl = process.env.GEMINI_API_URL;
    const keys = parseKeyList(process.env.GEMINI_API_KEY);
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    let url;
    if (rawUrl)
    {
        url = rawUrl;
    } else if (keys.length > 0 && model)
    {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    } else
    {
        return res.status(500).json({ error: 'Thiếu cấu hình GEMINI_API_KEY trong file .env' });
    }

    const body = {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
        }
    };

    try
    {
        const keysToTry = keys.length > 0 ? keys : [undefined];
        let lastErrorResult = null;

        for (let i = 0; i < keysToTry.length; i++)
        {
            const currentKey = keysToTry[i];
            const result = await callGeminiOnce(url, currentKey, body);

            if (result.ok)
            {
                const data = result.data;
                const candidate = data?.candidates?.[0];
                const finishReason = candidate?.finishReason;

                if (!candidate || !candidate.content?.parts?.length)
                {
                    const reasonMap = {
                        SAFETY: 'AI từ chối phân tích nội dung này vì lý do an toàn.',
                        RECITATION: 'AI từ chối phân tích vì nội dung trùng lặp nguồn có bản quyền.',
                        OTHER: 'AI từ chối phân tích nội dung này.'
                    };
                    return res.status(422).json({
                        error: 'refused',
                        reason: finishReason || 'UNKNOWN',
                        message: reasonMap[finishReason] || 'AI từ chối phân tích nội dung này.'
                    });
                }

                const text = candidate.content.parts.map((p) => p.text || '').join('');
                return res.json({ text, rawText: text, finishReason, keyIndexUsed: i });
            }

            const isKeySpecificError = result.status === 429 || result.status === 401;
            lastErrorResult = result;

            if (isKeySpecificError && i < keysToTry.length - 1)
            {
                console.warn(`Key #${i + 1} lỗi ${result.status}, thử key tiếp theo...`);
                continue;
            }

            break;
        }

        const text = lastErrorResult?.text || '';
        const status = lastErrorResult?.status;

        if (status === 429)
        {
            let retryDelay = null;
            try
            {
                const parsed = JSON.parse(text);
                const retryInfo = parsed?.error?.details?.find(
                    (d) => d['@type']?.includes('RetryInfo')
                );
                retryDelay = retryInfo?.retryDelay || null;
            } catch { /* body không phải JSON hợp lệ, bỏ qua */ }

            return res.status(429).json({
                error: 'quota_exceeded',
                message: keys.length > 1
                    ? `Đã hết lượt gọi Gemini miễn phí trên cả ${keys.length} key đang dùng. Hãy đợi quota reset hoặc thêm key khác.`
                    : 'Đã hết lượt gọi Gemini miễn phí trong ngày. Hãy đợi quota reset hoặc dùng model khác (đổi GEMINI_MODEL trong .env).',
                retryDelay,
                details: text
            });
        }

        return res.status(502).json({ error: `upstream ${status}`, details: text });
    } catch (err)
    {
        console.error('analyze error', err);
        return res.status(500).json({ error: String(err?.message || err) });
    }
});

app.listen(PORT, () =>
{
    console.log(`ScamCheck backend đang chạy tại: http://localhost:${PORT}`);
});