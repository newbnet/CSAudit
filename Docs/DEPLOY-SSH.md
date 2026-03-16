# Deploy Cybersecurity to production (10.10.10.64)

- **Dev:** Your machine — develop locally, then push with `npm run deploy`.
- **Production:** **root@10.10.10.64** at `/local/bin/projects/Cybersecurity`.
- **Ports:** Frontend **3010**, Backend **5010** (two-process PM2). For production build, backend serves app on 5010 only; NPM can proxy to 5010.

## One-command deploy

From project root:

```bash
chmod +x deploy.sh
npm run deploy
```

Requires SSH access to root@10.10.10.64. The script builds the frontend, pushes code, and starts production mode.

After deploy: **https://cod-data.com** (NPM proxies to 10.10.10.64:5010, or to :3010 for frontend + :5010 for /api if using two-process).

## First-time on server

1. `mkdir -p /local/bin/projects`
2. Create `Backend/db.json` (copy from another env or run seed after creating minimal db)
3. `cd Backend && node scripts/migrate-projects.js && npm run seed`
4. From dev machine: `npm run deploy`

## NPM configuration

**NPM:** If using single-port production (backend serves built frontend), set Forward Port to **5010**. If using two-process (Vite on 3010 + backend on 5010), configure NPM to proxy `/` to `10.10.10.64:3010` and `/api` to `10.10.10.64:5010`, or use a single proxy to 5010 when the backend serves the built app.

**Firewall (cod-node):** Allow both **3010** and **5010** from NPM (10.10.10.61). See `scripts/setup-ufw-cod-node.sh`.

## PM2

- `cybersecurity-frontend` (port 3010) — Vite dev server
- `cybersecurity-backend` (port 5010) — API (and serves built app in production mode)
- `npx pm2 logs cybersecurity-backend` for logs
