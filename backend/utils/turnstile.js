const axios = require('axios');

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
async function verifyTurnstileToken(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token) {
    return { ok: false, error: 'Missing CAPTCHA token' };
  }

  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    if (remoteIp) body.set('remoteip', remoteIp);

    const res = await axios.post(TURNSTILE_VERIFY_URL, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 5000
    });

    if (res?.data?.success) {
      return { ok: true, data: res.data };
    }

    return {
      ok: false,
      error: 'CAPTCHA verification failed',
      data: res?.data
    };
  } catch (err) {
    return { ok: false, error: 'CAPTCHA verification error' };
  }
}

module.exports = { verifyTurnstileToken };
