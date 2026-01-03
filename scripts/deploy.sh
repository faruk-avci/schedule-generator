#!/bin/bash

# deploy.sh - Production deployment and update script

set -e

echo "🚀 Deploying latest version..."

# 1. Pull latest code
echo "Pulling from GitHub..."
git pull origin main

# 2. Update Backend
echo "Updating Backend..."
cd backend
npm install --production
# Restart or Reload with PM2
if pm2 show ozu-backend > /dev/null; then
    echo "Reloading PM2 service..."
    pm2 reload ozu-backend
else
    echo "Starting PM2 service..."
    pm2 start app.js --name ozu-backend
fi
cd ..

# 3. Update Frontend
echo "Updating Frontend..."
cd frontend
npm install
npm run build
# Copy built files to public folder (Legacy skip - Nginx serves frontend/dist directly)
# cp -r dist/* ../backend/public/
cd ..

echo "✅ Deployment successful!"
pm2 status
