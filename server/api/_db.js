/**
 * Cached MongoClient for serverless (Vercel) functions.
 *
 * Each warm lambda reuses a single connection pool across invocations.
 * We stash the client promise on globalThis so that hot-reloads during
 * `vercel dev` and concurrent invocations share one client instead of
 * opening a new connection (and pool) every request.
 */
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'mongolingo';

if (!uri) {
  // Surface a clear error at import time rather than a cryptic driver error.
  console.warn('[mongolingo] MONGODB_URI is not set. Set it in your environment / Vercel project.');
}

/** @type {Promise<MongoClient> | undefined} */
let clientPromise = globalThis.__mongolingoClientPromise;

function createClientPromise() {
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000
  });
  return client.connect();
}

export async function getDb() {
  if (!uri) throw new Error('MONGODB_URI is not configured');
  if (!clientPromise) {
    clientPromise = createClientPromise();
    globalThis.__mongolingoClientPromise = clientPromise;
  }
  const client = await clientPromise;
  return client.db(dbName);
}

let indexesEnsured = globalThis.__mongolingoIndexesEnsured || false;

/** Ensure indexes once per warm lambda. Safe to call on every request. */
export async function getPlayers() {
  const db = await getDb();
  const players = db.collection('players');
  if (!indexesEnsured) {
    try {
      await players.createIndex({ userId: 1 }, { unique: true });
      await players.createIndex({ pack: 1, xp: -1 });
      indexesEnsured = true;
      globalThis.__mongolingoIndexesEnsured = true;
    } catch (e) {
      // Index creation is best-effort; don't fail the request over it.
      console.warn('[mongolingo] index ensure failed:', e?.message);
    }
  }
  return players;
}
