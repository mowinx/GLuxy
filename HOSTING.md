# Host Luxy yourself

Luxy is a Node 22 web app (React + TanStack Start). Accounts, cars, and bookings are stored in each browser (`localStorage`, key `luxy-v1`), not in a shared database. Hosting the site gives every visitor the same demo. Their bookings stay on that device and do not sync to anyone else. A real multi-user fleet needs a database rewrite.

Demo logins (password `luxy2026` for all):

| Role | Email |
| --- | --- |
| Customer | ada@luxy.demo |
| Owner | chidi@luxy.demo |
| Company owner | ngozi@luxy.demo |
| Driver | tunde@luxy.demo |
| Admin | victor@luxy.demo |

You need Node.js 22 or newer. Do not set `DATABASE_URL`. Do not set `VITE_AUTH_ENABLED=true`. Sign-in is the demo login above. `.grok/app-env.json` already keeps platform auth off.

## Run it on your computer

```bash
npm install
npm run dev
```

Open http://localhost:8080

## Option A — your own Vercel account (no code change)

The production build is already set to Vercel (`preset: "vercel"` in `vite.config.ts`).

1. Push this folder to a GitHub repo (do not commit `node_modules`).
2. Import the repo at https://vercel.com/new
3. Framework preset can stay Other. Build command: `npm run build`. Install command is already in `vercel.json`.
4. Do not add `DATABASE_URL`. Leave `VITE_AUTH_ENABLED` unset, or set it to `false`.
5. Deploy. Vercel gives you an HTTPS URL.

## Option B — a VPS, Docker host, or any Node server

1. In `vite.config.ts`, change `preset: "vercel"` to `preset: "node_server"`. Leave `serverDir: "./server"` as it is.
2. Build and start:

```bash
npm install
npm run build
PORT=3000 HOST=0.0.0.0 node .output/server/index.mjs
```

3. Put Caddy or nginx in front for HTTPS and point your domain at this process. The app listens on port 3000 unless you change `PORT`.

Useful knobs: `PORT` / `NITRO_PORT`, `HOST` / `NITRO_HOST`.

## What not to expect

- Refreshing on a new phone or another browser starts from the seeded demo again.
- Clearing site data wipes that browser's bookings.
- Payments, KYC, and payouts in the UI are simulated. Nothing charges a card.
