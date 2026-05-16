/* ─── ai-handler.js ──────────────────────────────────────────────────────
   Note: Gemini API key added for local workaround.
   XSS FIX: AI response rendered with textContent, never innerHTML.
────────────────────────────────────────────────────────────────────────── */
const GEMINI_API_KEY = "AIzaSyDcyt0VKPr8JTfuaI4b1vbkyhfwqg-AmbY";

async function generateHealthSummary(medicalText) {
    const loader         = document.getElementById('ai-loader');
    const summaryContent = document.getElementById('summary-content');

    if (loader) loader.classList.remove('hidden');

    try {
        const safeText = medicalText.trim().substring(0, 2000);
        
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Explain this medical diagnosis in simple English:\n\n${safeText}\n\nKeep it under 3 short sentences and include a suggested next step.`
                        }]
                    }]
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
             throw new Error(data.error?.message || 'AI service error');
        }

        const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (summaryContent && summary) {
            // XSS-SAFE: textContent never executes scripts
            const p = document.createElement('p');
            p.textContent = summary;
            summaryContent.innerHTML = '';
            summaryContent.appendChild(p);
        } else {
             throw new Error("Unable to generate summary.");
        }
    } catch (err) {
        console.error('AI Summary Error:', err);
        if (summaryContent) {
            const p = document.createElement('p');
            p.textContent = 'Unable to generate summary. Please try again later.';
            p.style.color = 'var(--danger)';
            summaryContent.innerHTML = '';
            summaryContent.appendChild(p);
        }
    } finally {
        if (loader) loader.classList.add('hidden');
    }
}