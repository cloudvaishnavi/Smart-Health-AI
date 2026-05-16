/* ─────────────────────────────────────────────────────────────────────────
   Netlify Function: generate-token
   Verifies the caller's Supabase session then returns a signed, 24-hour
   HMAC token that encodes their userId. The QR code embeds this token
   instead of a raw UUID.
   Env vars needed: QR_TOKEN_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY
───────────────────────────────────────────────────────────────────────────*/
const crypto = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // 1. Verify the caller's Supabase JWT
    const authHeader = event.headers['authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Missing auth token' }) };
    }

    const SUPABASE_URL     = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const SECRET           = process.env.QR_TOKEN_SECRET;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SECRET) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured' }) };
    }

    // Ask Supabase who this JWT belongs to
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'Authorization': authHeader, 'apikey': SUPABASE_ANON_KEY }
    });

    if (!userRes.ok) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired session' }) };
    }

    const { id: userId } = await userRes.json();

    // 2. Build a signed token: base64url( userId | expiry | hmac )
    const expiry  = Date.now() + 24 * 60 * 60 * 1000; // 24 h
    const payload = `${userId}|${expiry}`;
    const sig     = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    const token   = Buffer.from(`${payload}|${sig}`).toString('base64url');

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, expiry })
    };
};
