# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

E-Commerce notification system deployed across 5 AWS EC2 instances. The workflow is: edit code locally → push to GitHub (`https://github.com/riverbonilla1504/pow`) → SSH into each instance and `git pull` to deploy.

## Infrastructure

| Instance | Private IP | Role |
|----------|-----------|------|
| ec2-nginx | 10.0.1.192 (public: 52.21.124.113) | Nginx bastion + TLS termination |
| ec2-api-orders | 10.0.2.160 | Node.js REST API + RabbitMQ publisher |
| ec2-rabbitmq | 10.0.2.234 | RabbitMQ broker |
| ec2-workers | 10.0.2.250 | SES email + SNS SMS consumers |
| ec2-database | 10.0.2.152 | PostgreSQL 16 |

All private instances (10.0.2.x) are in a private subnet with no direct internet access. SSH into them via bastion:

```bash
ssh -i pow.pem -o ProxyCommand="ssh -i pow.pem ubuntu@52.21.124.113 -W %h:%p" ubuntu@10.0.2.160
```

## Running Services

**API (ec2-api-orders):**
```bash
npm start          # production
npm run dev        # watch mode (node --watch)
```
PM2 process name: `orders-api`. Managed via `pm2 restart orders-api`.

**Workers (ec2-workers):**
```bash
npm run start:email   # email-worker only
npm run start:sms     # sms-worker only
npm start             # both via PM2 ecosystem.config.js
```
PM2 process names: `email-worker`, `sms-worker`.

**Deploy after git push:**
```bash
# On each relevant instance:
cd /home/ubuntu/pow && git pull origin main
pm2 restart <process-name>
```

## Architecture

```
Internet → Nginx (freck.lat, api.freck.lat, admin.freck.lat)
               ↓ TLS 1.3, proxy_pass
         ec2-api-orders :3000
               ↓ publishes
         RabbitMQ topic exchange: order.events
               ↓ routes by key
    q.notify.email          q.notify.sms
    (order.*.email)         (order.*.sms)
         ↓                       ↓
    email-worker            sms-worker
    (AWS SES)               (AWS SNS)
               ↓ on failure (3 retries)
         q.dead.letter (DLQ)
```

RabbitMQ routing keys: `order.created.email`, `order.shipped.email`, `order.returned.email`, `order.created.sms`, `order.shipped.sms`.

High-value orders (total > $500 with phone number) also publish an SMS event.

## Auth Flow

- JWT RS256 with keys at `ec2-api-orders/keys/private.pem` and `keys/public.pem` (not in repo, live on server)
- Roles: `cliente`, `operador`, `admin`
- 2FA (TOTP via speakeasy) is optional per user; login returns `tempToken` (scope: `2fa_pending`) when 2FA is enabled, requiring a second call to `/auth/2fa/verify` before a full JWT is issued
- Admin routes additionally require `require2FA` middleware — even if the user has 2FA enabled, the JWT must carry `twoFactorVerified: true`
- Backup codes: 8 random hex codes, bcrypt-hashed, stored in `users.backup_codes[]`

## nftables Firewall

Each instance has a deny-by-default firewall. The configs are in `<component>/nftables.conf` and deployed to `/etc/nftables.conf`. After editing, apply with:

```bash
sudo cp /home/ubuntu/pow/<component>/nftables.conf /etc/nftables.conf
sudo systemctl restart nftables
sudo nft list ruleset
```

Key rules: all private instances only accept SSH from `10.0.1.192` (nginx bastion). Never allow SSH from `0.0.0.0/0` on private instances — this will lock you out and require SSM recovery.

## SSM Recovery

If nftables locks SSH, use AWS SSM to recover:

```bash
python -m awscli ssm send-command \
  --instance-ids <instance-id> \
  --document-name AWS-RunShellScript \
  --parameters file://fix-<component>.json
```

Instances must have the `EC2-SSM-Role` IAM profile attached (has `AmazonSSMManagedInstanceCore`).

## AWS SES / SNS

- SES domain `freck.lat` is verified with DKIM in `us-east-1`
- SES is in **sandbox mode** — only verified recipient addresses can receive email
- Workers use hardcoded AWS credentials in `/home/ubuntu/pow/ec2-workers/.env` (not in repo)
- `SES_FROM_EMAIL=noreply@freck.lat`

## Environment Files

Not committed. Live on each server at `/home/ubuntu/pow/<component>/.env`. See `.env.example` files for required variables. The API additionally needs RS256 key files at `ec2-api-orders/keys/`.

## Database

PostgreSQL 16 on `10.0.2.152:5432`, database `ecommerce`, user `appuser`. Schema is in `ec2-database/migrations/001_initial_schema.sql`. Run migrations manually:

```bash
sudo -u postgres psql ecommerce < /home/ubuntu/pow/ec2-database/migrations/001_initial_schema.sql
```
