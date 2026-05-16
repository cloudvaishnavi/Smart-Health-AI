require('dotenv').config();
const fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
/* ─────────────────────────────────────────────────────────────────────────
   Netlify Serverless Function: ai-insights
───────────────────────────────────────────────────────────────────────────*/

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key not configured on server.' })
        };
    }

    let body;

    try {
        body = JSON.parse(event.body);
    } catch {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid request body.' })
        };
    }

    const { medicalText } = body;

    if (!medicalText || typeof medicalText !== 'string') {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'medicalText is required.' })
        };
    }

    const safeText = medicalText.trim().substring(0, 2000);

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text:
                                        `Explain this medical diagnosis in simple English:

${safeText}

Keep it under 3 short sentences and include a suggested next step.`
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            console.error(data);
            throw new Error(`Gemini responded with ${res.status}`);
        }

        const summary =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Unable to generate summary.";

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ summary })
        };

    } catch (err) {
        console.error('Gemini proxy error:', err);

        return {
            statusCode: 502,
            body: JSON.stringify({
                error: 'AI service unavailable. Please try again.'
            })
        };
    }
};