const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const privateKey = fs.readFileSync(
    path.resolve(process.env.JWT_PRIVATE_KEY_PATH || './keys/private.pem')
);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts, try again in 15 minutes' }
});

const ROLE_PERMISSIONS = {
    cliente: ['read:own_orders', 'write:orders'],
    operador: ['read:own_orders', 'read:all_orders', 'write:orders', 'update:order_status'],
    admin: ['read:own_orders', 'read:all_orders', 'write:orders', 'update:order_status', 'access:admin_panel', 'manage:users', 'view:dlq']
};

function signToken(payload, expiresIn) {
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn });
}

// POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, phone) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, passwordHash, phone || null]
        );

        const user = result.rows[0];
        const token = signToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            permissions: ROLE_PERMISSIONS[user.role]
        }, process.env.JWT_EXPIRES_IN || '1h');

        res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /auth/login
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const result = await pool.query(
            'SELECT id, email, password_hash, role, totp_enabled FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.totp_enabled) {
            const tempToken = signToken({
                sub: user.id,
                scope: '2fa_pending'
            }, process.env.JWT_2FA_EXPIRES_IN || '5m');

            return res.json({ requires2FA: true, tempToken });
        }

        const token = signToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            permissions: ROLE_PERMISSIONS[user.role],
            twoFactorVerified: false
        }, process.env.JWT_EXPIRES_IN || '1h');

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /auth/2fa/verify
router.post('/2fa/verify', async (req, res) => {
    try {
        const { tempToken, code } = req.body;

        if (!tempToken || !code) {
            return res.status(400).json({ error: 'Token and code required' });
        }

        const publicKey = fs.readFileSync(
            path.resolve(process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem')
        );
        const decoded = jwt.verify(tempToken, publicKey, { algorithms: ['RS256'] });

        if (decoded.scope !== '2fa_pending') {
            return res.status(401).json({ error: 'Invalid token scope' });
        }

        const result = await pool.query(
            'SELECT id, email, role, totp_secret FROM users WHERE id = $1',
            [decoded.sub]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        const valid = speakeasy.totp.verify({
            secret: user.totp_secret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!valid) {
            return res.status(401).json({ error: 'Invalid 2FA code' });
        }

        const token = signToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            permissions: ROLE_PERMISSIONS[user.role],
            twoFactorVerified: true
        }, process.env.JWT_EXPIRES_IN || '1h');

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error('2FA verify error:', err.message);
        res.status(500).json({ error: '2FA verification failed' });
    }
});

// POST /auth/2fa/enroll
router.post('/2fa/enroll', authenticate, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `ECommerce (${req.user.email})`,
            issuer: 'ECommerce-Grupo2'
        });

        await pool.query(
            'UPDATE users SET totp_secret = $1 WHERE id = $2',
            [secret.base32, req.user.sub]
        );

        const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({ secret: secret.base32, qrCode: qrDataUrl });
    } catch (err) {
        console.error('2FA enroll error:', err.message);
        res.status(500).json({ error: '2FA enrollment failed' });
    }
});

// POST /auth/2fa/confirm
router.post('/2fa/confirm', authenticate, async (req, res) => {
    try {
        const { code } = req.body;

        const result = await pool.query(
            'SELECT totp_secret FROM users WHERE id = $1',
            [req.user.sub]
        );

        if (result.rows.length === 0 || !result.rows[0].totp_secret) {
            return res.status(400).json({ error: 'Must enroll first' });
        }

        const valid = speakeasy.totp.verify({
            secret: result.rows[0].totp_secret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!valid) {
            return res.status(401).json({ error: 'Invalid code, try again' });
        }

        const backupCodes = Array.from({ length: 8 }, () =>
            crypto.randomBytes(4).toString('hex')
        );
        const hashedCodes = await Promise.all(
            backupCodes.map(c => bcrypt.hash(c, 10))
        );

        await pool.query(
            'UPDATE users SET totp_enabled = true, backup_codes = $1 WHERE id = $2',
            [hashedCodes, req.user.sub]
        );

        res.json({
            message: '2FA activated',
            backupCodes,
            warning: 'Save these codes securely. They will not be shown again.'
        });
    } catch (err) {
        console.error('2FA confirm error:', err.message);
        res.status(500).json({ error: '2FA confirmation failed' });
    }
});

// POST /auth/2fa/recover
router.post('/2fa/recover', async (req, res) => {
    try {
        const { email, password, backupCode } = req.body;

        if (!email || !password || !backupCode) {
            return res.status(400).json({ error: 'Email, password, and backup code required' });
        }

        const result = await pool.query(
            'SELECT id, email, password_hash, role, backup_codes FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        let matchedIndex = -1;
        for (let i = 0; i < (user.backup_codes || []).length; i++) {
            const match = await bcrypt.compare(backupCode, user.backup_codes[i]);
            if (match) {
                matchedIndex = i;
                break;
            }
        }

        if (matchedIndex === -1) {
            return res.status(401).json({ error: 'Invalid backup code' });
        }

        const updatedCodes = user.backup_codes.filter((_, i) => i !== matchedIndex);
        await pool.query(
            'UPDATE users SET backup_codes = $1 WHERE id = $2',
            [updatedCodes, user.id]
        );

        const token = signToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            permissions: ROLE_PERMISSIONS[user.role],
            twoFactorVerified: true
        }, process.env.JWT_EXPIRES_IN || '1h');

        res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role },
            remainingBackupCodes: updatedCodes.length
        });
    } catch (err) {
        console.error('Recovery error:', err.message);
        res.status(500).json({ error: 'Recovery failed' });
    }
});

module.exports = router;
