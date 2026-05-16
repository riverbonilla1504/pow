const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { publishEvent } = require('../services/rabbitmq');

const router = express.Router();

// GET /orders - List orders (own for cliente, all for operador/admin)
router.get('/', authenticate, async (req, res) => {
    try {
        let query, params;

        if (req.user.role === 'cliente') {
            query = 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
            params = [req.user.sub];
        } else {
            query = 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 100';
            params = [];
        }

        const result = await pool.query(query, params);
        res.json({ orders: result.rows });
    } catch (err) {
        console.error('List orders error:', err.message);
        res.status(500).json({ error: 'Failed to list orders' });
    }
});

// GET /orders/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = result.rows[0];

        if (req.user.role === 'cliente' && order.user_id !== req.user.sub) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ order });
    } catch (err) {
        console.error('Get order error:', err.message);
        res.status(500).json({ error: 'Failed to get order' });
    }
});

// POST /orders - Create order
router.post('/', authenticate, async (req, res) => {
    try {
        const { items, total } = req.body;

        if (!items || !total) {
            return res.status(400).json({ error: 'Items and total required' });
        }

        const result = await pool.query(
            'INSERT INTO orders (user_id, items, total) VALUES ($1, $2, $3) RETURNING *',
            [req.user.sub, JSON.stringify(items), total]
        );

        const order = result.rows[0];

        const userResult = await pool.query(
            'SELECT email, phone FROM users WHERE id = $1',
            [req.user.sub]
        );
        const user = userResult.rows[0];

        publishEvent('order.created.email', {
            orderId: order.id,
            userId: req.user.sub,
            email: user.email,
            total: order.total,
            status: 'pending',
            type: 'order_created'
        });

        if (parseFloat(total) > 500 && user.phone) {
            publishEvent('order.created.sms', {
                orderId: order.id,
                userId: req.user.sub,
                phone: user.phone,
                total: order.total,
                type: 'high_value_order'
            });
        }

        res.status(201).json({ order });
    } catch (err) {
        console.error('Create order error:', err.message);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// PATCH /orders/:id/status - Update order status (operador+)
router.patch('/:id/status', authenticate, authorize('operador', 'admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'returned'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const result = await pool.query(
            'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = result.rows[0];

        const userResult = await pool.query(
            'SELECT email, phone FROM users WHERE id = $1',
            [order.user_id]
        );
        const user = userResult.rows[0];

        if (status === 'shipped') {
            publishEvent('order.shipped.email', {
                orderId: order.id,
                userId: order.user_id,
                email: user.email,
                status: 'shipped',
                type: 'order_shipped'
            });
        } else if (status === 'returned') {
            publishEvent('order.returned.email', {
                orderId: order.id,
                userId: order.user_id,
                email: user.email,
                status: 'returned',
                type: 'order_returned'
            });
        }

        res.json({ order });
    } catch (err) {
        console.error('Update status error:', err.message);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;
