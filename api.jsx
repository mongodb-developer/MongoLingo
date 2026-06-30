/* MongoLingo — frontend API client for the optional Vercel backend.
 *
 * The app is a static site (GitHub Pages). This module talks to the
 * separate Vercel backend ONLY when API_BASE is set. If it's empty or any
 * request fails, every helper degrades gracefully (returns null / []), so
 * the app keeps working with its built-in stub leaderboard.
 *
 * To enable: set API_BASE to your deployed backend, e.g.
 *   const API_BASE = 'https://mongolingo-api.vercel.app/api';
 * For local testing against `vercel dev`, use 'http://localhost:3000/api'.
 */
const API_BASE = (window.MONGOLINGO_API_BASE || '').replace(/\/$/, '');

const USER_ID_KEY = 'mongolingo.userId.v1';

function getUserId() {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return 'u_anon';
  }
}

function apiEnabled() {
  return !!API_BASE;
}

async function apiFetch(path, options) {
  if (!API_BASE) return null;
  try {
    const res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function registerUser({ name, company, pack }) {
  if (!apiEnabled()) return null;
  return apiFetch('/register', {
    method: 'POST',
    body: JSON.stringify({ userId: getUserId(), name, company, pack })
  });
}

async function submitScore({ xp, leaves, streak, pack, name, company }) {
  if (!apiEnabled()) return null;
  return apiFetch('/leaderboard', {
    method: 'POST',
    body: JSON.stringify({ userId: getUserId(), xp, leaves, streak, pack, name, company })
  });
}

async function fetchLeaderboard({ pack, limit = 10 } = {}) {
  if (!apiEnabled()) return null;
  const qs = new URLSearchParams();
  if (pack) qs.set('pack', pack);
  if (limit) qs.set('limit', String(limit));
  const data = await apiFetch('/leaderboard?' + qs.toString(), { method: 'GET' });
  return data && Array.isArray(data.leaders) ? data.leaders : null;
}

window.MongoLingoAPI = {
  apiEnabled,
  getUserId,
  registerUser,
  submitScore,
  fetchLeaderboard
};
