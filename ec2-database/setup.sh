#!/bin/bash
set -e

echo "=== Setting up PostgreSQL on ec2-database ==="

sudo apt update && sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE ecommerce;
CREATE USER appuser WITH ENCRYPTED PASSWORD '${DB_PASSWORD:-changeme}';
GRANT ALL PRIVILEGES ON DATABASE ecommerce TO appuser;
\c ecommerce
GRANT ALL ON SCHEMA public TO appuser;
EOF

# Allow remote connections from API only (10.0.2.160)
echo "listen_addresses = '*'" | sudo tee -a /etc/postgresql/16/main/postgresql.conf
echo "host  ecommerce  appuser  10.0.2.160/32  scram-sha-256" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf

sudo systemctl restart postgresql

# Run migrations
PGPASSWORD="${DB_PASSWORD:-changeme}" psql -h localhost -U appuser -d ecommerce -f migrations/001_initial_schema.sql

echo "=== PostgreSQL setup complete ==="
