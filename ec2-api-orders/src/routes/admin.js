// Importa Express para crear el router de administración
const express = require('express');
// Importa el pool de conexiones a PostgreSQL
const { pool } = require('../config/database');
// Importa los tres middlewares: autenticación JWT, autorización por rol, y verificación 2FA
const { authenticate, authorize, require2FA } = require('../middleware/auth');
// Importa la función para obtener el canal de RabbitMQ (usado para leer la DLQ)
const { getChannel } = require('../services/rabbitmq');

// Crea una instancia de router de Express
const router = express.Router();

// GET /admin/dashboard — Retorna estadísticas generales del sistema para el panel admin
router.get('/dashboard', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        // Ejecuta 5 queries en paralelo para obtener todas las estadísticas del dashboard
        const [ordersCount, usersCount, recentOrders, notifStats, revenueRow] = await Promise.all([
            // Cuenta órdenes agrupadas por estado (pending, paid, shipped, etc.)
            pool.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status'),
            // Cuenta usuarios agrupados por rol (cliente, operador, admin)
            pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
            // Obtiene las 10 órdenes más recientes con el email del usuario (JOIN)
            pool.query(`SELECT o.*, u.email as user_email FROM orders o
                        JOIN users u ON o.user_id = u.id
                        ORDER BY o.created_at DESC LIMIT 10`),
            // Obtiene estadísticas de notificaciones agrupadas por tipo y estado
            pool.query(`SELECT type, status, COUNT(*) as count FROM notification_logs
                        GROUP BY type, status`),
            // Calcula el revenue total sumando el total de todas las órdenes
            pool.query('SELECT COALESCE(SUM(total), 0) as total FROM orders')
        ]);

        // Responde con todas las estadísticas del dashboard en un solo objeto
        res.json({
            ordersByStatus: ordersCount.rows,             // Array de {status, count}
            usersByRole: usersCount.rows,                 // Array de {role, count}
            recentOrders: recentOrders.rows,              // Array de las 10 órdenes más recientes
            notificationStats: notifStats.rows,           // Array de {type, status, count}
            totalRevenue: parseFloat(revenueRow.rows[0].total) // Revenue total como número
        });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Dashboard error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

// GET /admin/orders — Lista todas las órdenes con paginación y filtro opcional por estado
router.get('/orders', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        // Extrae y parsea los parámetros de paginación de la query string
        const page = parseInt(req.query.page) || 1;       // Página actual, 1 por defecto
        const limit = parseInt(req.query.limit) || 20;    // Registros por página, 20 por defecto
        const offset = (page - 1) * limit;                 // Calcula el offset para SQL
        const status = req.query.status;                   // Filtro opcional por estado

        // Variables para las queries dinámicas
        let listQuery;      // Query para obtener las órdenes
        let listParams;     // Parámetros de la query de órdenes
        let countQuery;     // Query para contar el total de órdenes
        let countParams;    // Parámetros de la query de conteo

        // Si se proporcionó un filtro de estado, agrega WHERE clause
        if (status) {
            // Query con JOIN a users y filtro por estado, con paginación
            listQuery = `SELECT o.*, u.email as user_email, u.phone as user_phone
                 FROM orders o JOIN users u ON o.user_id = u.id
                 WHERE o.status = $3 ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`;
            listParams = [limit, offset, status];          // Parámetros: limit, offset, status
            // Query de conteo con el mismo filtro de estado
            countQuery = 'SELECT COUNT(*) as count FROM orders o WHERE o.status = $1';
            countParams = [status];                        // Solo necesita el status
        } else {
            // Query sin filtro, todas las órdenes con paginación
            listQuery = `SELECT o.*, u.email as user_email, u.phone as user_phone
                 FROM orders o JOIN users u ON o.user_id = u.id
                 ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`;
            listParams = [limit, offset];                  // Solo limit y offset
            // Conteo total sin filtro
            countQuery = 'SELECT COUNT(*) as count FROM orders o';
            countParams = [];                              // Sin parámetros
        }

        // Ejecuta ambas queries en paralelo (órdenes + conteo total)
        const [orders, total] = await Promise.all([
            pool.query(listQuery, listParams),             // Obtiene las órdenes de la página
            pool.query(countQuery, countParams)             // Obtiene el conteo total
        ]);

        // Responde con las órdenes, metadatos de paginación
        res.json({
            orders: orders.rows,                           // Array de órdenes
            total: parseInt(total.rows[0].count),          // Total de órdenes (para calcular páginas)
            page,                                          // Página actual
            pages: Math.ceil(parseInt(total.rows[0].count) / limit) // Total de páginas
        });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Orders list error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to list orders' });
    }
});

// GET /admin/notifications — Lista los logs de notificaciones con filtros y paginación
router.get('/notifications', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        // Extrae y parsea los parámetros de paginación
        const page = parseInt(req.query.page) || 1;       // Página actual
        const limit = parseInt(req.query.limit) || 20;    // Registros por página
        const offset = (page - 1) * limit;                 // Offset para SQL
        const type = req.query.type;                       // Filtro opcional: 'email' o 'sms'
        const status = req.query.status;                   // Filtro opcional: 'sent' o 'failed'

        // Construye dinámicamente las condiciones WHERE según los filtros activos
        const conditions = [];                             // Array de condiciones SQL
        const countParams = [];                            // Parámetros para las condiciones
        let paramIdx = 1;                                  // Índice del parámetro SQL ($1, $2, etc.)
        // Si se filtró por tipo, agrega la condición
        if (type) { conditions.push(`type = $${paramIdx++}`); countParams.push(type); }
        // Si se filtró por estado, agrega la condición
        if (status) { conditions.push(`status = $${paramIdx++}`); countParams.push(status); }
        // Construye la cláusula WHERE o string vacío si no hay filtros
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // Agrega los parámetros de paginación después de los de filtro
        const queryParams = [...countParams, limit, offset];

        // Ejecuta queries de lista y conteo en paralelo
        const [logs, total] = await Promise.all([
            // Query de notificaciones con filtros, ordenada por fecha descendente
            pool.query(
                `SELECT id, order_id, type, status, recipient, template,
                        error_msg AS error_message, created_at
                 FROM notification_logs ${where} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
                queryParams
            ),
            // Query de conteo con los mismos filtros
            pool.query(`SELECT COUNT(*) as count FROM notification_logs ${where}`, countParams)
        ]);

        // Responde con las notificaciones y metadatos de paginación
        res.json({
            notifications: logs.rows,                      // Array de logs de notificaciones
            total: parseInt(total.rows[0].count),          // Total de registros
            page,                                          // Página actual
            pages: Math.ceil(parseInt(total.rows[0].count) / limit) // Total de páginas
        });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Notifications error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to list notifications' });
    }
});

// GET /admin/dlq — Lee mensajes de la Dead Letter Queue de RabbitMQ sin consumirlos
router.get('/dlq', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        // Obtiene el canal de RabbitMQ
        const channel = getChannel();
        // Si no hay canal activo, RabbitMQ no está conectado
        if (!channel) {
            return res.status(503).json({ error: 'RabbitMQ not connected' });
        }

        // Verifica el estado de la cola dead-letter para saber cuántos mensajes hay
        const queueInfo = await channel.checkQueue('q.dead.letter');
        // Array para almacenar los mensajes leídos
        const messages = [];

        // Lee hasta 10 mensajes de la DLQ (peek, no consume)
        for (let i = 0; i < Math.min(queueInfo.messageCount, 10); i++) {
            // Obtiene un mensaje de la cola sin auto-ack (noAck: false)
            const msg = await channel.get('q.dead.letter', { noAck: false });
            // Si se obtuvo un mensaje
            if (msg) {
                // Parsea el contenido del mensaje y almacena con sus propiedades
                messages.push({
                    content: JSON.parse(msg.content.toString()), // Payload del mensaje como objeto
                    properties: msg.properties,                   // Propiedades AMQP (headers, timestamp)
                    fields: msg.fields                            // Campos AMQP (routingKey, exchange)
                });
                // Rechaza el mensaje y lo reencola (nack con requeue=true) para no perderlo
                channel.nack(msg, false, true);
            }
        }

        // Responde con el tamaño de la cola y los mensajes leídos
        res.json({ queueSize: queueInfo.messageCount, messages });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('DLQ error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to read DLQ' });
    }
});

// GET /admin/users — Lista todos los usuarios con paginación
router.get('/users', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        // Extrae y parsea los parámetros de paginación
        const page = parseInt(req.query.page) || 1;       // Página actual
        const limit = parseInt(req.query.limit) || 20;    // Registros por página
        const offset = (page - 1) * limit;                 // Offset para SQL

        // Ejecuta queries de usuarios y conteo en paralelo
        const [users, total] = await Promise.all([
            // Obtiene usuarios con campos seleccionados, ordenados por fecha de creación
            pool.query(
                `SELECT id, email, role, totp_enabled as two_factor_enabled, phone, created_at
                 FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
                [limit, offset]
            ),
            // Cuenta el total de usuarios
            pool.query('SELECT COUNT(*) as count FROM users')
        ]);

        // Responde con los usuarios y metadatos de paginación
        res.json({
            users: users.rows,                             // Array de usuarios
            total: parseInt(total.rows[0].count),          // Total de usuarios
            page,                                          // Página actual
            pages: Math.ceil(parseInt(total.rows[0].count) / limit) // Total de páginas
        });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Users list error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to list users' });
    }
});

// PATCH /admin/users/:id/role — Actualiza el rol de un usuario
router.patch('/users/:id/role', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        // Extrae el nuevo rol del body de la petición
        const { role } = req.body;
        // Define los roles válidos del sistema
        const validRoles = ['cliente', 'operador', 'admin'];

        // Valida que el rol proporcionado sea uno de los permitidos
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
        }

        // Actualiza el rol del usuario en la BD y retorna los datos actualizados
        const result = await pool.query(
            'UPDATE users SET role = $1, updated_at = now() WHERE id = $2 RETURNING id, email, role',
            [role, req.params.id]
        );

        // Si no se encontró el usuario, retorna 404
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Responde con los datos actualizados del usuario
        res.json({ user: result.rows[0] });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Update role error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// Exporta el router de administración
module.exports = router;
