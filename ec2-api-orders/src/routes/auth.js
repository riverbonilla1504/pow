// Importa Express para crear el router de autenticación
const express = require('express');
// Importa bcryptjs para hashear y comparar contraseñas de forma segura
const bcrypt = require('bcryptjs');
// Importa jsonwebtoken para firmar tokens JWT con clave RSA
const jwt = require('jsonwebtoken');
// Importa speakeasy para generar y verificar códigos TOTP (2FA)
const speakeasy = require('speakeasy');
// Importa qrcode para generar códigos QR como Data URL para apps de autenticación
const QRCode = require('qrcode');
// Importa crypto para generar códigos de respaldo aleatorios
const crypto = require('crypto');
// Importa fs para leer las claves RSA desde el sistema de archivos
const fs = require('fs');
// Importa path para resolver rutas absolutas
const path = require('path');
// Importa express-rate-limit para limitar intentos de login
const rateLimit = require('express-rate-limit');
// Importa el pool de conexiones a PostgreSQL
const { pool } = require('../config/database');
// Importa el middleware de autenticación JWT
const { authenticate } = require('../middleware/auth');

// Crea una instancia de router de Express
const router = express.Router();

// Lee la clave privada RSA usada para firmar los tokens JWT
const privateKey = fs.readFileSync(
    // Usa la ruta de la variable de entorno o la ruta por defecto ./keys/private.pem
    path.resolve(process.env.JWT_PRIVATE_KEY_PATH || './keys/private.pem')
);

// Configura rate limiter específico para login: máximo 5 intentos cada 15 minutos
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,      // Ventana de tiempo: 15 minutos en milisegundos
    max: 5,                          // Máximo 5 intentos por IP en la ventana
    message: { error: 'Too many login attempts, try again in 15 minutes' } // Mensaje de error
});

// Define los permisos asociados a cada rol del sistema
const ROLE_PERMISSIONS = {
    // El cliente solo puede ver sus propias órdenes y crear nuevas
    cliente: ['read:own_orders', 'write:orders'],
    // El operador puede ver todas las órdenes y actualizar estados
    operador: ['read:own_orders', 'read:all_orders', 'write:orders', 'update:order_status'],
    // El admin tiene todos los permisos incluyendo panel admin, usuarios y DLQ
    admin: ['read:own_orders', 'read:all_orders', 'write:orders', 'update:order_status', 'access:admin_panel', 'manage:users', 'view:dlq']
};

// Firma un JWT con la clave privada RSA256 y un tiempo de expiración
function signToken(payload, expiresIn) {
    // Usa el algoritmo RS256 (RSA + SHA-256) para firmar el token
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn });
}

// POST /auth/register — Registra un nuevo usuario en el sistema
router.post('/register', async (req, res) => {
    try {
        // Extrae email, password y teléfono opcional del body
        const { email, password, phone } = req.body;

        // Valida que se proporcionaron email y password
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Verifica si ya existe un usuario con ese email en la base de datos
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        // Si ya existe, retorna error 409 Conflict
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hashea la contraseña con bcrypt usando 12 rondas de salt
        const passwordHash = await bcrypt.hash(password, 12);

        // Inserta el nuevo usuario en la BD y retorna sus datos (rol por defecto: cliente)
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, phone) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, passwordHash, phone || null]
        );

        // Extrae el usuario creado del resultado
        const user = result.rows[0];
        // Genera un JWT con los datos del usuario y sus permisos según su rol
        const token = signToken({
            sub: user.id,                                // Subject: ID del usuario
            email: user.email,                           // Email del usuario
            role: user.role,                             // Rol asignado (cliente por defecto)
            permissions: ROLE_PERMISSIONS[user.role]      // Permisos según el rol
        }, process.env.JWT_EXPIRES_IN || '1h');           // Expira en 1 hora por defecto

        // Responde con el token y los datos públicos del usuario
        res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Register error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /auth/login — Autentica un usuario existente
router.post('/login', loginLimiter, async (req, res) => {
    try {
        // Extrae email y password del body de la petición
        const { email, password } = req.body;

        // Valida que se proporcionaron ambos campos
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Busca el usuario en la BD incluyendo el hash y si tiene TOTP habilitado
        const result = await pool.query(
            'SELECT id, email, password_hash, role, totp_enabled FROM users WHERE email = $1',
            [email]
        );

        // Si no se encontró el usuario, retorna error genérico (no revela si el email existe)
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Extrae los datos del usuario encontrado
        const user = result.rows[0];
        // Compara la contraseña proporcionada con el hash almacenado
        const valid = await bcrypt.compare(password, user.password_hash);

        // Si la contraseña no coincide, retorna el mismo error genérico
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Si el usuario tiene 2FA habilitado, genera un token temporal
        if (user.totp_enabled) {
            // Genera un token con scope limitado a '2fa_pending' que expira en 5 minutos
            const tempToken = signToken({
                sub: user.id,                            // Subject: ID del usuario
                scope: '2fa_pending'                      // Scope restringido: solo para verificar 2FA
            }, process.env.JWT_2FA_EXPIRES_IN || '5m');   // Expira en 5 minutos por defecto

            // Indica al frontend que necesita mostrar el formulario de 2FA
            return res.json({ requires2FA: true, tempToken });
        }

        // Si no tiene 2FA, genera un JWT completo con todos los permisos
        const token = signToken({
            sub: user.id,                                // Subject: ID del usuario
            email: user.email,                           // Email del usuario
            role: user.role,                             // Rol del usuario
            permissions: ROLE_PERMISSIONS[user.role],     // Permisos según el rol
            twoFactorVerified: false                      // No tiene 2FA, así que no aplica verificación
        }, process.env.JWT_EXPIRES_IN || '1h');           // Expira en 1 hora por defecto

        // Responde con el token y datos públicos del usuario
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Login error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /auth/me — Retorna los datos del usuario autenticado
router.get('/me', authenticate, async (req, res) => {
    try {
        // Consulta los datos del usuario usando el ID del token JWT
        const result = await pool.query(
            'SELECT id, email, role, totp_enabled FROM users WHERE id = $1',
            [req.user.sub]
        );
        // Si el usuario no existe (token válido pero usuario eliminado), retorna 404
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Extrae los datos del usuario
        const user = result.rows[0];
        // Responde con los datos públicos del usuario
        res.json({ id: user.id, email: user.email, role: user.role, totp_enabled: user.totp_enabled });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Auth me error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

// POST /auth/2fa/verify — Verifica el código TOTP durante el login con 2FA
router.post('/2fa/verify', async (req, res) => {
    try {
        // Extrae el token temporal y el código TOTP del body
        const { tempToken, code } = req.body;

        // Valida que se proporcionaron ambos campos
        if (!tempToken || !code) {
            return res.status(400).json({ error: 'Token and code required' });
        }

        // Lee la clave pública para verificar el token temporal
        const publicKey = fs.readFileSync(
            path.resolve(process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem')
        );
        // Verifica y decodifica el token temporal
        const decoded = jwt.verify(tempToken, publicKey, { algorithms: ['RS256'] });

        // Verifica que el token tenga el scope correcto (2fa_pending)
        if (decoded.scope !== '2fa_pending') {
            return res.status(401).json({ error: 'Invalid token scope' });
        }

        // Busca el usuario en la BD para obtener su secreto TOTP
        const result = await pool.query(
            'SELECT id, email, role, totp_secret FROM users WHERE id = $1',
            [decoded.sub]
        );

        // Si no se encontró el usuario, rechaza
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Extrae los datos del usuario
        const user = result.rows[0];

        // Verifica el código TOTP contra el secreto almacenado
        const valid = speakeasy.totp.verify({
            secret: user.totp_secret,     // Secreto TOTP en base32 del usuario
            encoding: 'base32',            // Formato del secreto
            token: code,                   // Código de 6 dígitos proporcionado por el usuario
            window: 1                      // Acepta códigos del periodo anterior y siguiente (±30s)
        });

        // Si el código no es válido, rechaza con 401
        if (!valid) {
            return res.status(401).json({ error: 'Invalid 2FA code' });
        }

        // Genera un JWT completo con twoFactorVerified: true (da acceso al panel admin)
        const token = signToken({
            sub: user.id,                                // Subject: ID del usuario
            email: user.email,                           // Email del usuario
            role: user.role,                             // Rol del usuario
            permissions: ROLE_PERMISSIONS[user.role],     // Permisos según el rol
            twoFactorVerified: true                       // Marca que completó la verificación 2FA
        }, process.env.JWT_EXPIRES_IN || '1h');           // Expira en 1 hora por defecto

        // Responde con el token completo y datos del usuario
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('2FA verify error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: '2FA verification failed' });
    }
});

// POST /auth/2fa/enroll — Genera un secreto TOTP y QR para que el usuario configure su app 2FA
router.post('/2fa/enroll', authenticate, async (req, res) => {
    try {
        // Genera un nuevo secreto TOTP con nombre e issuer para la app de autenticación
        const secret = speakeasy.generateSecret({
            name: `ECommerce (${req.user.email})`,        // Nombre que aparece en la app del usuario
            issuer: 'ECommerce-Grupo2'                     // Identificador del emisor
        });

        // Guarda el secreto en base32 en la BD (aún no activa 2FA, solo guarda el secreto)
        await pool.query(
            'UPDATE users SET totp_secret = $1 WHERE id = $2',
            [secret.base32, req.user.sub]
        );

        // Genera un QR code como Data URL para escanear con Google Authenticator/Authy
        const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Responde con el secreto en texto y el QR como imagen base64
        res.json({ secret: secret.base32, qrCode: qrDataUrl });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('2FA enroll error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: '2FA enrollment failed' });
    }
});

// POST /auth/2fa/confirm — Confirma la activación de 2FA verificando un código TOTP
router.post('/2fa/confirm', authenticate, async (req, res) => {
    try {
        // Extrae el código TOTP que el usuario ingresó desde su app de autenticación
        const { code } = req.body;

        // Busca el secreto TOTP del usuario (debió haberse guardado en /2fa/enroll)
        const result = await pool.query(
            'SELECT totp_secret FROM users WHERE id = $1',
            [req.user.sub]
        );

        // Verifica que el usuario existe y tiene un secreto TOTP registrado
        if (result.rows.length === 0 || !result.rows[0].totp_secret) {
            return res.status(400).json({ error: 'Must enroll first' });
        }

        // Verifica el código TOTP contra el secreto almacenado
        const valid = speakeasy.totp.verify({
            secret: result.rows[0].totp_secret, // Secreto TOTP del usuario
            encoding: 'base32',                  // Formato del secreto
            token: code,                         // Código de 6 dígitos proporcionado
            window: 1                            // Acepta códigos del periodo anterior y siguiente
        });

        // Si el código no es válido, el usuario no configuró bien su app
        if (!valid) {
            return res.status(401).json({ error: 'Invalid code, try again' });
        }

        // Genera 8 códigos de respaldo aleatorios de 8 caracteres hex cada uno
        const backupCodes = Array.from({ length: 8 }, () =>
            crypto.randomBytes(4).toString('hex')         // 4 bytes = 8 caracteres hex
        );
        // Hashea cada código de respaldo con bcrypt para almacenarlos de forma segura
        const hashedCodes = await Promise.all(
            backupCodes.map(c => bcrypt.hash(c, 10))      // 10 rondas de salt
        );

        // Activa 2FA en la BD y guarda los códigos de respaldo hasheados
        await pool.query(
            'UPDATE users SET totp_enabled = true, backup_codes = $1 WHERE id = $2',
            [hashedCodes, req.user.sub]
        );

        // Responde con los códigos de respaldo en texto plano (solo se muestran una vez)
        res.json({
            message: '2FA activated',                      // Confirma que 2FA se activó
            backupCodes,                                   // Códigos en texto plano para que el usuario los guarde
            warning: 'Save these codes securely. They will not be shown again.' // Advertencia importante
        });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('2FA confirm error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: '2FA confirmation failed' });
    }
});

// POST /auth/2fa/recover — Permite login usando un código de respaldo cuando se pierde el TOTP
router.post('/2fa/recover', async (req, res) => {
    try {
        // Extrae email, password y código de respaldo del body
        const { email, password, backupCode } = req.body;

        // Valida que se proporcionaron los tres campos obligatorios
        if (!email || !password || !backupCode) {
            return res.status(400).json({ error: 'Email, password, and backup code required' });
        }

        // Busca el usuario en la BD incluyendo sus códigos de respaldo
        const result = await pool.query(
            'SELECT id, email, password_hash, role, backup_codes FROM users WHERE email = $1',
            [email]
        );

        // Si no se encontró el usuario, retorna error genérico
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Extrae los datos del usuario
        const user = result.rows[0];
        // Verifica la contraseña contra el hash almacenado
        const validPassword = await bcrypt.compare(password, user.password_hash);
        // Si la contraseña no coincide, rechaza
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Busca el código de respaldo proporcionado entre los códigos hasheados
        let matchedIndex = -1;
        // Itera sobre cada código de respaldo hasheado
        for (let i = 0; i < (user.backup_codes || []).length; i++) {
            // Compara el código proporcionado con cada hash usando bcrypt
            const match = await bcrypt.compare(backupCode, user.backup_codes[i]);
            // Si coincide, guarda el índice y termina la búsqueda
            if (match) {
                matchedIndex = i;
                break;
            }
        }

        // Si ningún código coincidió, rechaza con 401
        if (matchedIndex === -1) {
            return res.status(401).json({ error: 'Invalid backup code' });
        }

        // Elimina el código usado del array (cada código solo se puede usar una vez)
        const updatedCodes = user.backup_codes.filter((_, i) => i !== matchedIndex);
        // Actualiza los códigos de respaldo en la BD sin el código usado
        await pool.query(
            'UPDATE users SET backup_codes = $1 WHERE id = $2',
            [updatedCodes, user.id]
        );

        // Genera un JWT completo con twoFactorVerified: true (bypass del TOTP)
        const token = signToken({
            sub: user.id,                                // Subject: ID del usuario
            email: user.email,                           // Email del usuario
            role: user.role,                             // Rol del usuario
            permissions: ROLE_PERMISSIONS[user.role],     // Permisos según el rol
            twoFactorVerified: true                       // Marca como verificado (usó código de respaldo)
        }, process.env.JWT_EXPIRES_IN || '1h');           // Expira en 1 hora por defecto

        // Responde con el token, datos del usuario e indica cuántos códigos quedan
        res.json({
            token,                                        // JWT completo
            user: { id: user.id, email: user.email, role: user.role }, // Datos públicos
            remainingBackupCodes: updatedCodes.length      // Cantidad de códigos de respaldo restantes
        });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Recovery error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Recovery failed' });
    }
});

// Exporta el router de autenticación
module.exports = router;
