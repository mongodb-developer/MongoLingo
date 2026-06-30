/**
 * POST /api/register
 * Body: { userId, name, company?, pack? }
 *
 * Upserts a player record. Called when a learner starts an assignment.
 * Returns the stored player document (without _id).
 */
import { getPlayers } from './_db.js';
import { handlePreflight, readJsonBody } from './_cors.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, name, company, pack } = readJsonBody(req);

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }

  const now = new Date();
  const cleanName = String(name).trim().slice(0, 80);
  const cleanCompany = String(company || '').trim().slice(0, 120);
  const cleanPack = String(pack || 'general').trim().slice(0, 60);

  try {
    const players = await getPlayers();
    await players.updateOne(
      { userId },
      {
        $set: { name: cleanName, company: cleanCompany, pack: cleanPack, updatedAt: now },
        $setOnInsert: { userId, xp: 0, leaves: 0, streak: 0, createdAt: now }
      },
      { upsert: true }
    );

    const player = await players.findOne(
      { userId },
      { projection: { _id: 0 } }
    );

    return res.status(200).json({ ok: true, player });
  } catch (err) {
    console.error('[mongolingo] register error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
