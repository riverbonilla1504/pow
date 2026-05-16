#!/bin/bash
set -e

echo "=== Setting up Orders API on ec2-api-orders ==="

sudo apt update && sudo apt install nodejs npm -y
sudo npm install -g pm2

cd /home/ubuntu/orders-api

# Install dependencies
npm install --production

# Generate JWT keys
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Copy .env.example and edit
cp .env.example .env
echo ">>> Edit .env with your actual passwords <<<"

# Start with PM2
pm2 start src/index.js --name orders-api
pm2 save
pm2 startup systemd

echo "=== Orders API setup complete ==="
