// Importa jsonwebtoken para verificar tokens JWT
const jwt = require('jsonwebtoken');
// Importa fs para leer la clave pública desde el sistema de archivos
const fs = require('fs');
// Importa path para resolver rutas absolutas de archivos
const path = require('path');

// Lee la clave pública RSA usada para verificar la firma de los JWT
const publicKey = fs.readFileSync(
    // Usa la ruta de la variable de entorno o la ruta por defecto ./keys/public.pem
    path.resolve(process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem')
);

// Middleware que verifica que la petición incluya un JWT válido
function authenticate(req, res, next) {
    // Extrae la cabecera Authorization del request
    const header = req.headers.authorization;
    // Si no hay cabecera o no empieza con "Bearer ", rechaza con 401
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token required' });
    }

    try {
        // Extrae el token quitando el prefijo "Bearer " (7 caracteres)
        const token = header.slice(7);
        // Verifica y decodifica el token usando la clave pública RSA256
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

        // Si el token tiene scope 2fa_pending, el usuario no completó la verificación 2FA
        if (decoded.scope === '2fa_pending') {
            return res.status(401).json({ error: '2FA verification required' });
        }

        // Adjunta los datos del usuario decodificados al objeto request
        req.user = decoded;
        // Pasa al siguiente middleware o controlador
        next();
    } catch (err) {
        // Si el token es inválido, expirado o corrupto, rechaza con 401
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Factory de middleware que verifica que el usuario tenga uno de los roles especificados
function authorize(...roles) {
    // Retorna un middleware que verifica el rol del usuario
    return (req, res, next) => {
        // Si el rol del usuario no está en la lista de roles permitidos, rechaza con 403
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        // El usuario tiene un rol permitido, continúa
        next();
    };
}

// Middleware que exige que el JWT tenga twoFactorVerified: true (para rutas admin)
function require2FA(req, res, next) {
    // Si el token no tiene la verificación 2FA confirmada, rechaza con 403
    if (!req.user.twoFactorVerified) {
        return res.status(403).json({ error: '2FA verification required for this action' });
    }
    // El usuario pasó la verificación 2FA, continúa
    next();
}

// Exporta los tres middlewares de autenticación y autorización
module.exports = { authenticate, authorize, require2FA };
