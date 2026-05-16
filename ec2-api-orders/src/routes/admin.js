const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize, require2FA } = require('../middleware/auth');
const { getChannel } = require('../services/rabbitmq');

const router = express.Router();

// GET /admin/dashboard - Admin panel data
router.get('/dashboard', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        const [ordersCount, usersCount, recentOrders] = await Promise.all([
            pool.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status'),
            pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
            pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10')
        ]);

        res.json({
            ordersByStatus: ordersCount.rows,
            usersByRole: usersCount.rows,
            recentOrders: recentOrders.rows
        });
    } catch (err) {
        console.error('Dashboard error:', err.message);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

// GET /admin/dlq - View dead letter queue
router.get('/dlq', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        const channel = getChannel();
        if (!channel) {
            return res.status(503).json({ error: 'RabbitMQ not connected' });
        }

        const queueInfo = await channel.checkQueue('q.dead.letter');

        const messages = [];
        const maxMessages = 10;

        for (let i = 0; i < Math.min(queueInfo.messageCount, maxMessages); i++) {
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

        res.json({
            queueSize: queueInfo.messageCount,
            messages
        });
    } catch (err) {
        console.error('DLQ error:', err.message);
        res.status(500).json({ error: 'Failed to read DLQ' });
    }
});

// GET /admin/users - Manage users
router.get('/users', authenticate, authorize('admin'), require2FA, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, role, totp_enabled, phone, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ users: result.rows });
    } catch (err) {
        console.error('Users list error:', err.message);
        res.status(500).json({ error: 'Failed to list users' });
    }
});

// PATCH /admin/users/:id/role - Change user role
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
