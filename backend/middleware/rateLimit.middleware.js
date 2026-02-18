const buckets = new Map();

const now = () => Date.now();

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || 'unknown';
}





function rateLimit({ windowMs, max, keyPrefix }) {
  const window = Number(windowMs) || 60_000;
  const limit = Number(max) || 60;
  const prefix = keyPrefix || 'rl';

  return (req, res, next) => {
    const ip = getClientIp(req);
    const key = `${prefix}:${ip}`;

    const entry = buckets.get(key) || { count: 0, resetAt: now() + window };

    if (now() > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now() + window;
    }

    entry.count += 1;
    buckets.set(key, entry);

    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    next();
  };
}

module.exports = { rateLimit };
