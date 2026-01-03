#!/bin/bash

# setup_vps.sh - Foundation setup for OzuPlanner VPS

set -e

echo "🚀 Starting VPS Setup for OzuPlanner..."

# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (LTS)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 3. Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
fi

# 4. Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt install -y nginx
fi

# 5. Install Python dependencies
echo "Installing Python and Pip..."
sudo apt install -y python3 python3-pip python3-venv libpq-dev

# 6. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

echo "✅ Foundation setup complete!"
echo "Next step: Run ./scripts/init_db.sh"
