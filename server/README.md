# MongoLingo Server

A tiny [Vercel](https://vercel.com) serverless backend that registers learners and
orchestrates the MongoLingo leaderboard, backed by **MongoDB Atlas**.

The MongoLingo frontend is a static site hosted on GitHub Pages. This backend is a
**separate origin**, so all endpoints emit CORS headers and answer preflight requests.
The frontend calls it only if you point it at this server's URL — otherwise the app
works exactly as before with its built-in stub leaderboard.

## Endpoints

| Method | Path                | Body / Query                                  | Description |
|--------|---------------------|-----------------------------------------------|-------------|
| GET    | `/api/health`       | —                                             | Health + DB ping |
| POST   | `/api/register`     | `{ userId, name, company?, pack? }`           | Upsert a player |
| POST   | `/api/leaderboard`  | `{ userId, xp, leaves?, streak?, pack? }`     | Update score, returns rank |
| GET    | `/api/leaderboard`  | `?pack=general&limit=10`                      | Top players (latest XP wins) |

### Data model — collection `players`

```js
{ userId, name, company, pack, xp, leaves, streak, createdAt, updatedAt }
```

Indexes: unique `{ userId: 1 }`, and `{ pack: 1, xp: -1 }` for leaderboard reads.

## Local development

```bash
cd server
npm install

# create .env from the template and fill in your Atlas URI
cp .env.example .env
# edit .env -> MONGODB_URI=...

# one-time: authenticate and link the folder to a Vercel project
npx vercel login
npx vercel link --yes

# run the Vercel dev server (serves /api/* on http://localhost:3000)
npm start            # == vercel dev
```

Then test:

```bash
curl http://localhost:3000/api/health

curl -X POST http://localhost:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"userId":"u1","name":"Ada Lovelace","company":"Acme","pack":"general"}'

curl -X POST http://localhost:3000/api/leaderboard \
  -H 'Content-Type: application/json' \
  -d '{"userId":"u1","xp":1240,"leaves":8,"streak":5}'

curl "http://localhost:3000/api/leaderboard?pack=general&limit=10"
```

> `vercel dev` reads `.env` automatically and serves the functions on port 3000,
> closely matching the production runtime (including the CORS preflight handling).
> Linking the folder to a Vercel project (`vercel link`) is required before `vercel dev`
> will start.

## Deploy

```bash
cd server
vercel            # first deploy / preview
vercel --prod     # production
```

Set environment variables in the Vercel dashboard (Project → Settings → Environment Variables):

- `MONGODB_URI` — your Atlas SRV connection string
- `MONGODB_DB` — `mongolingo` (optional)
- `ALLOWED_ORIGIN` — `https://mongodb-developer.github.io` (lock CORS in production)

## Deployed instance

Production: **https://mongolingo-backend.vercel.app** (env vars set in the Vercel
dashboard, `ALLOWED_ORIGIN` locked to `https://mongodb-developer.github.io`).

## Wiring the frontend

The frontend points at this server via `window.MONGOLINGO_API_BASE` in `index.html`:

```html
<script>window.MONGOLINGO_API_BASE = 'https://mongolingo-backend.vercel.app/api';</script>
```

The leaderboard screen falls back to its stub data if the API is unset or unreachable,
so GitHub Pages keeps working regardless.
