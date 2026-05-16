/* ─────────────────────────────────────────────────────────────────────────
   Netlify Function: verify-token
   Called by emergency-access.html (doctor's view).
   Verifies the HMAC signature and expiry, then returns only the safe
   emergency fields — no full profile dump.
   Env vars needed: QR_TOKEN_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
───────────────────────────────────────────────────────────────────────────*/
const crypto = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { token } = event.queryStringParameters || {};
    if (!token) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Token is required' }) };
    }

    const SECRET              = process.env.QR_TOKEN_SECRET;
    const SUPABASE_URL        = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured' }) };
    }

    // 1. Decode the token
    let decoded;
    try { decoded = Buffer.from(token, 'base64url').toString('utf-8'); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: 'Malformed token' }) }; }

    const parts = decoded.split('|');
    if (parts.length !== 3) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid token structure' }) };
    }

    const [userId, expiry, receivedSig] = parts;

    // 2. Verify HMAC signature (timing-safe)
    const expectedSig = crypto.createHmac('sha256', SECRET).update(`${userId}|${expiry}`).digest('hex');
    try {
        if (!crypto.timingSafeEqual(Buffer.from(receivedSig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
        }
    } catch {
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    // 3. Check expiry
    if (Date.now() > parseInt(expiry, 10)) {
        return { statusCode: 401, body: JSON.stringify({ error: 'QR code has expired. Ask the patient to regenerate it.' }) };
    }

    // 4. Fetch ONLY the emergency-safe fields using the service role key (bypasses RLS intentionally)
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=full_name,blood_group,allergies,critical_conditions&limit=1`,
        {
            headers: {
                'apikey':        SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        }
    );

    if (!res.ok) {
        return { statusCode: 502, body: JSON.stringify({ error: 'Could not fetch profile' }) };
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Profile not found' }) };
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: rows[0] })
    };
};
