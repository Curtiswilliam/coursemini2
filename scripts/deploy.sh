#!/bin/bash
# =============================================================================
# CourseMini — Deploy script
# Runs on the server after GitHub Actions SSHs in, or manually:
#   bash scripts/deploy.sh
# =============================================================================
set -euo pipefail

APP_DIR="/var/www/coursemini"
cd "$APP_DIR"

echo "==> Pulling latest code..."
git pull origin main

echo "==> Installing dependencies..."
npm ci --omit=dev --ignore-scripts
# Install devDeps needed for build only
npm install --save-dev tsx esbuild vite @vitejs/plugin-react tailwindcss autoprefixer postcss drizzle-kit 2>/dev/null || true

echo "==> Building..."
npm run build

echo "==> Running database migrations..."
npm run db:push

echo "==> Restarting app..."
if pm2 list | grep -q "coursemini"; then
  pm2 reload ecosystem.config.cjs --env production
else
  pm2 start ecosystem.config.cjs --env production
fi

pm2 save

echo "==> Deploy complete! ✓"
pm2 status coursemini
