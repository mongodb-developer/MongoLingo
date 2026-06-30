/**
 * Shared CORS helper.
 *
 * The frontend is hosted on GitHub Pages (a different origin than this
 * Vercel backend), so every response must carry CORS headers and we must
 * answer the preflight OPTIONS request.
 *
 * Set ALLOWED_ORIGIN in the environment to lock this down in production
 * (e.g. "https://mongodb-developer.github.io"). Defaults to "*".
 */
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

export function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Handles CORS + preflight. Returns true if the request was a preflight
 * and has been fully handled (caller should return immediately).
 */
export function handlePreflight(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

/** Parse a JSON body whether Vercel pre-parsed it or handed us a string. */
export function readJsonBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
}
