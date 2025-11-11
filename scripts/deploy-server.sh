#!/bin/bash

# Deployment script for Ubuntu server
# Usage: ./scripts/deploy-server.sh

set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="tenga-web"
APP_DIR="/var/www/tenga-web"
BACKUP_DIR="/var/www/backups"
LOG_DIR="$APP_DIR/logs"
NODE_ENV="production"

# Create directories if they don't exist
echo -e "${YELLOW}📁 Creating directories...${NC}"
sudo mkdir -p $APP_DIR
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p $LOG_DIR

# Backup existing deployment
if [ -d "$APP_DIR/dist" ]; then
    echo -e "${YELLOW}💾 Creating backup...${NC}"
    sudo tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C $APP_DIR dist
fi

# Copy new build
echo -e "${YELLOW}📦 Copying new build...${NC}"
sudo cp -r dist $APP_DIR/

# Set permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
sudo chown -R $USER:$USER $APP_DIR
sudo chmod -R 755 $APP_DIR

# Install dependencies for serve (if needed)
echo -e "${YELLOW}📥 Installing dependencies...${NC}"
cd $APP_DIR
npm install -g serve

# Restart PM2
echo -e "${YELLOW}🔄 Restarting PM2...${NC}"
pm2 restart $APP_NAME || pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Reload Nginx
echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
sudo nginx -t && sudo systemctl reload nginx

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your app should be live at your domain${NC}"

