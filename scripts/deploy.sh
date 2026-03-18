#!/bin/bash
set -euo pipefail

cd /var/www/coursemini

echo "==> Pulling latest code..."
PREV_SCHEMA=$(git rev-parse HEAD:shared/schema.ts 2>/dev/null || echo "none")
git pull origin main
NEW_SCHEMA=$(git rev-parse HEAD:shared/schema.ts)

echo "==> Installing dependencies..."
npm ci

echo "==> Building..."
npm run build

echo "==> Database migrations..."
if [ "$PREV_SCHEMA" != "$NEW_SCHEMA" ]; then
  echo "Schema changed — running db:push..."
  npm run db:push
fi

echo "==> Reloading app..."
if pm2 list | grep -q "coursemini"; then
  pm2 reload ecosystem.config.cjs --env production
else
  pm2 start ecosystem.config.cjs --env production
fi
pm2 save

echo "==> Done ✓"
