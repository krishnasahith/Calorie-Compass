# Deployment (Free Hosting)

This app is a Node.js + SQLite single-server app. Below are free hosting options with tradeoffs.

## Option A: Local access via tunnel (fastest, free)
This keeps SQLite on your machine and exposes your local server.

1. Start the server:
   ```bash
   npm run dev
   ```
2. Use a tunnel (pick one):
   - Cloudflare Tunnel (recommended)
   - ngrok

Benefits: No DB changes needed.
Downside: Your machine must stay on.

## Option B: Render Free (public URL)
Render is easy for Node apps, but free disk is ephemeral. SQLite will reset on deploy/restart.

### Steps
1. Create a new Web Service.
2. Build command: `npm install`
3. Start command: `node server.js`
4. Set env vars (see `.env` section below).

### Important
If you need persistent data, use a hosted database.
SQLite is not ideal for free hosting persistence.

## Option C: Fly.io (persistent volume)
Fly.io supports persistent volumes, so SQLite can live on a volume.

### Steps
1. Install flyctl and run `fly launch`.
2. Create volume (example 1GB):
   ```bash
   fly volumes create data --size 1
   ```
3. Configure the app to use a DB path on the mounted volume:
   - Set `DB_PATH=/data/calorie.db` as an env var.

This repo already supports `DB_PATH` env var.

## Option D: Railway (free-tier variability)
Railway sometimes offers a free tier. Similar to Render, but storage persistence depends on plan.

## Env Vars
Required if you use email or SMS OTP or AI:
- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`
- `OPENAI_API_KEY` / `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `XAI_API_KEY`

Optional:
- `DB_PATH` (use when deploying to a persistent disk/volume)
- `PUBLIC_BASE_URL` (if behind proxy; otherwise auto-detected)
