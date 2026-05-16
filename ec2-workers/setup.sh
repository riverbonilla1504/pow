#!/bin/bash
set -e

echo "=== Setting up Workers on ec2-workers ==="

sudo apt update && sudo apt install nodejs npm -y
sudo npm install -g pm2

cd /home/ubuntu/workers

npm install --production

cp .env.example .env
echo ">>> Edit .env with your actual credentials <<<"

# Start workers with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd

echo "=== Workers setup complete ==="
