/**
 * GET /api/health
 * Lightweight check that the function runs and the DB is reachable.
 */
import { getDb } from './_db.js';
import { handlePreflight } from './_cors.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;

  const hasUri = !!process.env.MONGODB_URI;
  let db = 'unknown';
  if (hasUri) {
    try {
      const database = await getDb();
      await database.command({ ping: 1 });
      db = 'connected';
    } catch (e) {
      db = 'error: ' + (e?.message || 'unknown');
    }
  } else {
    db = 'no MONGODB_URI';
  }

  return res.status(200).json({ ok: true, db, time: new Date().toISOString() });
}
