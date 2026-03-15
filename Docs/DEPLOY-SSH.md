# Deploy Cybersecurity to production (10.10.10.64)

- **Dev:** Your machine — develop locally, then push with `npm run deploy`.
- **Production:** **root@10.10.10.64** at `/local/bin/projects/Cybersecurity`.
- **Port:** Backend **5010** (serves frontend + API in production).

## One-command deploy

From project root:

```bash
chmod +x deploy.sh
npm run deploy
```

Requires SSH access to root@10.10.10.64. The script builds the frontend, pushes code, and starts production mode.

After deploy: **https://cod-data.com** (NPM proxies to 10.10.10.64:5010)

## First-time on server

1. `mkdir -p /local/bin/projects`
2. Create `Backend/db.json` (copy from another env or run seed after creating minimal db)
3. `cd Backend && node scripts/migrate-projects.js && npm run seed`
4. From dev machine: `npm run deploy`

## NPM configuration

Edit the cod-data.com proxy host: **Forward Port** must be **5010** (not 3010).

## PM2

- `cybersecurity-backend` (port 5010) — serves app + API
- `npx pm2 logs cybersecurity-backend` for logs
