#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────────────
# deploy.sh — Pull latest code, build, and restart services
# Called by GitHub Actions (or manually via SSH)
# ─────────────────────────────────────────────────────────

APP_DIR="${APP_DIR:-/var/www/fullstack-template}"

echo "──────────────────────────────────────"
echo "  Deploying fullstack-template"
echo "  Directory: $APP_DIR"
echo "──────────────────────────────────────"

# 1. Pull latest code
echo "→ Fetching latest code..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

# 2. Install root dependencies
echo "→ Installing root dependencies..."
npm install --production

# 3. Build frontend
echo "→ Building frontend..."
cd "$APP_DIR/apps/web"
npm install
npm run build

# 4. Install backend dependencies
echo "→ Installing backend dependencies..."
cd "$APP_DIR/apps/api-node"
npm install --production

# 5. Restart API with PM2
echo "→ Restarting API via PM2..."
pm2 restart api 2>/dev/null || pm2 start src/index.js --name api
pm2 save

echo ""
echo "✅ Deployment complete!"
echo "──────────────────────────────────────"
