#!/bin/bash
# =============================================================================
# CourseMini — Manual deploy script
# Run on the server directly: bash scripts/deploy.sh
# =============================================================================
set -euo pipefail

APP_DIR="/var/www/coursemini"
cd "$APP_DIR"

echo "==> Pulling latest code..."
PREV_SCHEMA_HASH=$(git show HEAD:shared/schema.ts 2>/dev/null | md5sum | cut -d' ' -f1 || echo "none")
git pull origin main
NEW_SCHEMA_HASH=$(md5sum shared/schema.ts | cut -d' ' -f1)

echo "==> Installing production dependencies..."
npm ci --omit=dev

echo "==> Building..."
# Install build-only devDeps into a temp location, then clean up
npm install --no-save \
  tsx esbuild vite @vitejs/plugin-react \
  tailwindcss autoprefixer postcss \
  "@tailwindcss/vite" drizzle-kit \
  "@types/node" typescript
npm run build
# Remove devDeps after build
npm ci --omit=dev

echo "==> Running database migrations..."
if [ "$PREV_SCHEMA_HASH" != "$NEW_SCHEMA_HASH" ]; then
  echo "Schema changed — running db:push..."
  npm run db:push
else
  echo "No schema changes — skipping db:push"
fi

echo "==> Reloading app (zero-downtime)..."
if pm2 list | grep -q "coursemini"; then
  pm2 reload ecosystem.config.cjs --env production
else
  pm2 start ecosystem.config.cjs --env production
fi
pm2 save

echo "==> Verifying app health..."
sleep 3
pm2 status coursemini

echo "==> Deploy complete! ✓"
