const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize, require2FA } = require('../middleware/auth');
const { getChannel } = require('../services/rabbitmq');

const router = express.Router();

// GET /admin/dashboard
router.get('/dashboard', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        const [ordersCount, usersCount, recentOrders, notifStats, revenueRow] = await Promise.all([
            pool.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status'),
            pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
            pool.query(`SELECT o.*, u.email as user_email FROM orders o
                        JOIN users u ON o.user_id = u.id
                        ORDER BY o.created_at DESC LIMIT 10`),
            pool.query(`SELECT type, status, COUNT(*) as count FROM notification_logs
                        GROUP BY type, status`),
            pool.query('SELECT COALESCE(SUM(total), 0) as total FROM orders')
        ]);

        res.json({
            ordersByStatus: ordersCount.rows,
            usersByRole: usersCount.rows,
            recentOrders: recentOrders.rows,
            notificationStats: notifStats.rows,
            totalRevenue: parseFloat(revenueRow.rows[0].total)
        });
    } catch (err) {
        console.error('Dashboard error:', err.message);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

// GET /admin/orders
router.get('/orders', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;

        const where = status ? 'WHERE o.status = $3' : '';
        const params = status ? [limit, offset, status] : [limit, offset];

        const [orders, total] = await Promise.all([
            pool.query(
                `SELECT o.*, u.email as user_email, u.phone as user_phone
                 FROM orders o JOIN users u ON o.user_id = u.id
                 ${where} ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
                params
            ),
            pool.query(
                `SELECT COUNT(*) as count FROM orders o ${where}`,
                status ? [status] : []
            )
        ]);

        res.json({
            orders: orders.rows,
            total: parseInt(total.rows[0].count),
            page,
            pages: Math.ceil(parseInt(total.rows[0].count) / limit)
        });
    } catch (err) {
        console.error('Orders list error:', err.message);
        res.status(500).json({ error: 'Failed to list orders' });
    }
});

// GET /admin/notifications
router.get('/notifications', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const type = req.query.type;
        const status = req.query.status;

        const conditions = [];
        const countParams = [];
        let paramIdx = 1;
        if (type) { conditions.push(`type = $${paramIdx++}`); countParams.push(type); }
        if (status) { conditions.push(`status = $${paramIdx++}`); countParams.push(status); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const queryParams = [...countParams, limit, offset];

        const [logs, total] = await Promise.all([
            pool.query(
                `SELECT * FROM notification_logs ${where} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
                queryParams
            ),
            pool.query(`SELECT COUNT(*) as count FROM notification_logs ${where}`, countParams)
        ]);

        res.json({
            notifications: logs.rows,
            total: parseInt(total.rows[0].count),
            page,
            pages: Math.ceil(parseInt(total.rows[0].count) / limit)
        });
    } catch (err) {
        console.error('Notifications error:', err.message);
        res.status(500).json({ error: 'Failed to list notifications' });
    }
});

// GET /admin/dlq
router.get('/dlq', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        const channel = getChannel();
        if (!channel) {
            return res.status(503).json({ error: 'RabbitMQ not connected' });
        }

        const queueInfo = await channel.checkQueue('q.dead.letter');
        const messages = [];

        for (let i = 0; i < Math.min(queueInfo.messageCount, 10); i++) {
            const msg = await channel.get('q.dead.letter', { noAck: false });
            if (msg) {
                messages.push({
                    content: JSON.parse(msg.content.toString()),
                    properties: msg.properties,
                    fields: msg.fields
                });
                channel.nack(msg, false, true);
            }
        }

        res.json({ queueSize: queueInfo.messageCount, messages });
    } catch (err) {
        console.error('DLQ error:', err.message);
        res.status(500).json({ error: 'Failed to read DLQ' });
    }
});

// GET /admin/users
router.get('/users', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [users, total] = await Promise.all([
            pool.query(
                `SELECT id, email, role, totp_enabled as two_factor_enabled, phone, created_at
                 FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
                [limit, offset]
            ),
            pool.query('SELECT COUNT(*) as count FROM users')
        ]);

        res.json({
            users: users.rows,
            total: parseInt(total.rows[0].count),
            page,
            pages: Math.ceil(parseInt(total.rows[0].count) / limit)
        });
    } catch (err) {
        console.error('Users list error:', err.message);
        res.status(500).json({ error: 'Failed to list users' });
    }
});

// PATCH /admin/users/:id/role
router.patch('/users/:id/role', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['cliente', 'operador', 'admin'];

        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
        }

        const result = await pool.query(
            'UPDATE users SET role = $1, updated_at = now() WHERE id = $2 RETURNING id, email, role',
            [role, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Update role error:', err.message);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

module.exports = router;
