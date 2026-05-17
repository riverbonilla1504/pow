#!/bin/bash
# Deploy script - run from each EC2 instance
# Usage: ./deploy.sh <component>
# Example: ./deploy.sh ec2-api-orders

set -e

COMPONENT=${1:-$(basename $(pwd))}
REPO_URL="git@github.com:riverbonilla1504/pow.git"

echo "=== Deploying $COMPONENT ==="

if [ ! -d "/home/ubuntu/$COMPONENT/.git" ]; then
    git clone $REPO_URL /home/ubuntu/repo-temp
    cp -r /home/ubuntu/repo-temp/$COMPONENT/* /home/ubuntu/$COMPONENT/ 2>/dev/null || true
    cp -r /home/ubuntu/repo-temp/$COMPONENT/.* /home/ubuntu/$COMPONENT/ 2>/dev/null || true
    rm -rf /home/ubuntu/repo-temp
else
    cd /home/ubuntu/$COMPONENT
    git pull origin main
fi

cd /home/ubuntu/$COMPONENT

if [ -f "package.json" ]; then
    npm install --production
fi

# Restart PM2 processes if applicable
if command -v pm2 &> /dev/null; then
    pm2 restart all 2>/dev/null || true
fi

echo "=== Deploy complete for $COMPONENT ==="
