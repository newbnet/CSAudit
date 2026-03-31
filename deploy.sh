#!/usr/bin/env bash
# Deploy to production (10.10.10.64). Builds frontend, runs production config.
# Ports: frontend 3010, backend 5010.
# Usage: ./deploy.sh   or   npm run deploy
#
# On the server, uses `pm2` from PATH when installed (recommended on multi-app
# hosts). Falls back to `npx pm2` so a mixed PM2 version does not spawn a second daemon.

set -e

DEPLOY_HOST="${DEPLOY_HOST:-10.10.10.64}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PATH="${DEPLOY_PATH:-/local/bin/projects/Cybersecurity}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Deploying to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'Frontend/node_modules' \
  --exclude 'Backend/node_modules' \
  --exclude 'Backend/__pycache__' \
  --exclude 'logs' \
  --exclude '.git' \
  --exclude 'Frontend/dist' \
  --exclude 'deploy.env' \
  "$ROOT/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s -- "${DEPLOY_PATH}" <<'REMOTE'
set -e
D="$1"
cd "$D"

run_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    pm2 "$@"
  else
    npx pm2 "$@"
  fi
}

(test -f deploy.env || (echo "JWT_SECRET=$(openssl rand -base64 32)" > deploy.env && echo 'Created deploy.env with JWT_SECRET'))
(cd Backend && npm install)
(cd Frontend && npm install)
(test -d node_modules || npm install)
cd Frontend && npm run build && cd ..
mkdir -p logs
run_pm2 delete cybersecurity-frontend 2>/dev/null || true
if run_pm2 describe cybersecurity-backend >/dev/null 2>&1; then
  run_pm2 restart ecosystem.production.config.js --update-env
else
  run_pm2 start ecosystem.production.config.js
fi
run_pm2 save
echo 'Done. Production: https://cod-data.com (backend :5010 serves app)'
REMOTE
