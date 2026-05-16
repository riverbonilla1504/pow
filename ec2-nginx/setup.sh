#!/bin/bash
set -e

echo "=== Setting up Nginx on ec2-nginx ==="

sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y

# Copy site config
sudo cp sites-available/ecommerce /etc/nginx/sites-available/ecommerce
sudo ln -sf /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "=== Nginx setup complete ==="
echo "Run: sudo certbot --nginx -d ecommerce-grupo2.duckdns.org"
