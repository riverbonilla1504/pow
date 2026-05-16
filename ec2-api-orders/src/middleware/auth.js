const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const publicKey = fs.readFileSync(
    path.resolve(process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem')
);

function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token required' });
    }

    try {
        const token = header.slice(7);
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

        if (decoded.scope === '2fa_pending') {
            return res.status(401).json({ error: '2FA verification required' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function authorize(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

function require2FA(req, res, next) {
    if (!req.user.twoFactorVerified) {
        return res.status(403).json({ error: '2FA verification required for this action' });
    }
    next();
}

module.exports = { authenticate, authorize, require2FA };
