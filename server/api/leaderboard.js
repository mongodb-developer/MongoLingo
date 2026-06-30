/**
 * /api/leaderboard
 *
 * GET  ?pack=general&limit=10
 *   -> { ok, leaders: [{ name, company, pack, xp, leaves, streak, rank }] }
 *
 * POST { userId, xp, leaves?, streak? }
 *   -> updates a player's score (latest wins) and returns their rank.
 *
 * The player must already exist (via /api/register). If not, POST upserts
 * a minimal record so a score is never lost.
 */
import { getPlayers } from './_db.js';
import { handlePreflight, readJsonBody } from './_cors.js';

function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

async function handleGet(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pack = url.searchParams.get('pack');
  const limit = Math.min(toInt(url.searchParams.get('limit'), 10) || 10, 100);

  const filter = pack ? { pack } : {};

  const players = await getPlayers();
  const leaders = await players
    .find(filter, { projection: { _id: 0, company: 0 } })
    .sort({ xp: -1, updatedAt: 1 })
    .limit(limit)
    .toArray();

  const ranked = leaders.map((p, i) => ({ ...p, rank: i + 1 }));
  return res.status(200).json({ ok: true, leaders: ranked });
}

async function handlePost(req, res) {
  const { userId, xp, leaves, streak, name, company, pack } = readJsonBody(req);

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }

  const now = new Date();
  const set = { xp: toInt(xp), leaves: toInt(leaves), streak: toInt(streak), updatedAt: now };
  if (typeof name === 'string') set.name = name.trim().slice(0, 80);
  if (typeof company === 'string') set.company = company.trim().slice(0, 120);
  if (typeof pack === 'string') set.pack = pack.trim().slice(0, 60);

  // Build $setOnInsert without any path that already appears in $set,
  // otherwise MongoDB throws a path-conflict error on upsert.
  const setOnInsert = { userId, createdAt: now };
  if (!('name' in set)) setOnInsert.name = 'Anonymous';

  const players = await getPlayers();
  await players.updateOne(
    { userId },
    { $set: set, $setOnInsert: setOnInsert },
    { upsert: true }
  );

  const me = await players.findOne({ userId }, { projection: { _id: 0 } });
  // Rank = number of players with strictly higher xp, +1.
  const ahead = await players.countDocuments({
    ...(me?.pack ? { pack: me.pack } : {}),
    xp: { $gt: me?.xp ?? 0 }
  });

  return res.status(200).json({ ok: true, player: me, rank: ahead + 1 });
}

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;

  try {
    if (req.method === 'GET') return await handleGet(req, res);
    if (req.method === 'POST') return await handlePost(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[mongolingo] leaderboard error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
