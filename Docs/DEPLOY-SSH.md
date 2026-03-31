# Deploy Cybersecurity to production (10.10.10.64)

- **Dev PC:** Only for editing code and running **`npm run deploy`** (build + rsync + install on server). Use your normal clone path on that machine.
- **Production server (SSH):** **`root@10.10.10.64` (cod-node).** All inspection, `npm audit`, `npm install` after a manual change, and **PM2** commands use the **server** path below — not `~/Documents/...` on your laptop. On cod-node, **`npm run deploy` uses system `pm2` when `command -v pm2` succeeds** so it does not spawn a second daemon; install with `npm install -g pm2` if needed.
- **Production root on cod-node:** `/local/bin/projects/Cybersecurity` (spelling: **Cybersecurity**).

```bash
# Example: open a shell on production, then:
cd /local/bin/projects/Cybersecurity
```

- **Ports:** Frontend **3010**, Backend **5010** (two-process PM2). For production build, backend serves app on 5010 only; NPM can proxy to 5010.

## One-command deploy

From **your dev PC**, in the **git clone** of this repo (not on cod-node):

```bash
chmod +x deploy.sh
npm run deploy
```

Requires SSH access to root@10.10.10.64. The script builds the frontend, pushes code, and starts production mode.

After deploy: **https://cod-data.com** (NPM proxies to 10.10.10.64:5010, or to :3010 for frontend + :5010 for /api if using two-process).

## First-time on server (SSH)

Run these **on cod-node** after `ssh root@10.10.10.64`:

1. `mkdir -p /local/bin/projects`
2. After first deploy, create `Backend/db.json` under `/local/bin/projects/Cybersecurity` (copy from another env or run seed after creating minimal db)
3. `cd /local/bin/projects/Cybersecurity/Backend && node scripts/migrate-projects.js && npm run seed`
4. From **dev PC** (project clone): `npm run deploy`

## NPM configuration

**NPM:** If using single-port production (backend serves built frontend), set Forward Port to **5010**. If using two-process (Vite on 3010 + backend on 5010), configure NPM to proxy `/` to `10.10.10.64:3010` and `/api` to `10.10.10.64:5010`, or use a single proxy to 5010 when the backend serves the built app.

**Firewall (cod-node):** Allow both **3010** and **5010** from NPM (10.10.10.61). See `scripts/setup-ufw-cod-node.sh`.

## PM2 (run on cod-node via SSH)

From **`/local/bin/projects/Cybersecurity`** on the server (not your dev PC):

```bash
cd /local/bin/projects/Cybersecurity
pm2 list
pm2 logs cybersecurity-backend
```

Use **`pm2`** (global) on hosts that run several apps. Mixing **`npx pm2`** from an older `node_modules` with a global PM2 **6.x** daemon can start a **new** daemon and drop every other app from the active list. If you see only COD-DATA after a restart, see **Recover PM2 app list** below.

- `cybersecurity-frontend` (port 3010) — Vite dev server
- `cybersecurity-backend` (port 5010) — API (and serves built app in production mode)

### Recover PM2 app list (other sites disappeared)

1. List projects: `ls /local/bin/projects/`
2. For each app that had an ecosystem file, start it again from its directory, for example:
   ```bash
   cd /local/bin/projects/<OtherApp>
   pm2 start ecosystem.production.config.js   # or ecosystem.config.js
   ```
3. `pm2 list` — confirm all apps, then **`pm2 save`**.

### npm shows `Killed` on the server

Usually the container/VM ran out of memory during `npm install` / `npm audit`. Run **one** `npm` command at a time, or run **`npm run deploy`** from your **dev PC** so installs happen after `rsync` with fresh lockfiles (less work on the server).

### Audit leftovers

- **Backend `tar`:** resolved when **`bcrypt` is v6** and **`npm install`** has been run in `Backend` (see repo `Backend/package.json` + lockfile).
- **Frontend `esbuild`:** often needs a **Vite** major bump; treat as **dev-server** risk if you do not expose Vite to the internet.
- **`pm2` ReDoS:** npm may still report **no fix**; low practical risk for a local process manager.

## npm audit (run on cod-node via SSH)

```bash
ssh root@10.10.10.64
cd /local/bin/projects/Cybersecurity/Backend  && npm audit --audit-level=moderate
cd /local/bin/projects/Cybersecurity/Frontend && npm audit --audit-level=moderate
cd /local/bin/projects/Cybersecurity         && npm audit --audit-level=moderate
```

Running `npm audit` in `~` on the server fails with **ENOLOCK** — there is no `package-lock.json` there. Always `cd` into the paths above first.
