// Importa Express para crear el router de órdenes
const express = require('express');
// Importa el pool de conexiones a PostgreSQL
const { pool } = require('../config/database');
// Importa los middlewares de autenticación y autorización por rol
const { authenticate, authorize } = require('../middleware/auth');
// Importa la función para publicar eventos a RabbitMQ
const { publishEvent } = require('../services/rabbitmq');

// Crea una instancia de router de Express
const router = express.Router();

// GET /orders — Lista las órdenes (propias para cliente, todas para operador/admin)
router.get('/', authenticate, async (req, res) => {
    try {
        // Declara variables para la query SQL y sus parámetros
        let query, params;

        // Si el usuario es cliente, solo puede ver sus propias órdenes
        if (req.user.role === 'cliente') {
            // Filtra órdenes por el ID del usuario autenticado
            query = 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
            // Usa el sub del JWT como parámetro (user_id)
            params = [req.user.sub];
        } else {
            // Operadores y admins ven todas las órdenes, limitado a 100
            query = 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 100';
            // No necesita parámetros
            params = [];
        }

        // Ejecuta la query y obtiene las órdenes
        const result = await pool.query(query, params);
        // Responde con el array de órdenes
        res.json({ orders: result.rows });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('List orders error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to list orders' });
    }
});

// GET /orders/:id — Obtiene una orden específica por su UUID
router.get('/:id', authenticate, async (req, res) => {
    try {
        // Busca la orden por ID en la base de datos
        const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);

        // Si no se encontró la orden, retorna 404
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Extrae la orden del resultado
        const order = result.rows[0];

        // Si es cliente, verifica que la orden le pertenezca
        if (req.user.role === 'cliente' && order.user_id !== req.user.sub) {
            // Rechaza acceso si la orden no es del usuario autenticado
            return res.status(403).json({ error: 'Access denied' });
        }

        // Responde con los datos de la orden
        res.json({ order });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Get order error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to get order' });
    }
});

// POST /orders — Crea una nueva orden y publica eventos de notificación
router.post('/', authenticate, async (req, res) => {
    try {
        // Extrae los items y total del body de la petición
        const { items, total } = req.body;

        // Valida que se proporcionaron items y total
        if (!items || !total) {
            return res.status(400).json({ error: 'Items and total required' });
        }

        // Inserta la orden en la BD con el user_id del token, items como JSON y el total
        const result = await pool.query(
            'INSERT INTO orders (user_id, items, total) VALUES ($1, $2, $3) RETURNING *',
            [req.user.sub, JSON.stringify(items), total]
        );

        // Extrae la orden creada del resultado
        const order = result.rows[0];

        // Consulta el email y teléfono del usuario para enviar notificaciones
        const userResult = await pool.query(
            'SELECT email, phone FROM users WHERE id = $1',
            [req.user.sub]
        );
        // Extrae los datos del usuario
        const user = userResult.rows[0];

        // Publica evento de email para notificar al usuario que su orden fue creada
        publishEvent('order.created.email', {
            orderId: order.id,                            // ID de la orden
            userId: req.user.sub,                         // ID del usuario
            email: user.email,                            // Email del destinatario
            total: order.total,                           // Total de la orden
            status: 'pending',                            // Estado inicial de la orden
            type: 'order_created'                         // Tipo de evento para seleccionar template
        });

        // Si la orden supera $500 y el usuario tiene teléfono, envía SMS también
        if (parseFloat(total) > 500 && user.phone) {
            // Publica evento de SMS para órdenes de alto valor
            publishEvent('order.created.sms', {
                orderId: order.id,                        // ID de la orden
                userId: req.user.sub,                     // ID del usuario
                phone: user.phone,                        // Número de teléfono del usuario
                total: order.total,                       // Total de la orden
                type: 'high_value_order'                  // Tipo de evento para template SMS
            });
        }

        // Responde con la orden creada y status 201 Created
        res.status(201).json({ order });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Create order error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// PATCH /orders/:id/status — Actualiza el estado de una orden (solo operador y admin)
router.patch('/:id/status', authenticate, authorize('operador', 'admin'), async (req, res) => {
    try {
        // Extrae el nuevo status del body
        const { status } = req.body;
        // Define los estados válidos del flujo de una orden
        const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'returned'];

        // Valida que el status proporcionado sea uno de los permitidos
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        // Actualiza el estado de la orden y la fecha de actualización en la BD
        const result = await pool.query(
            'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );

        // Si no se encontró la orden, retorna 404
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Extrae la orden actualizada
        const order = result.rows[0];

        // Consulta los datos de contacto del dueño de la orden para notificar
        const userResult = await pool.query(
            'SELECT email, phone FROM users WHERE id = $1',
            [order.user_id]
        );
        // Extrae los datos del usuario
        const user = userResult.rows[0];

        // Si la orden fue marcada como enviada, notifica por email
        if (status === 'shipped') {
            // Publica evento de email de envío
            publishEvent('order.shipped.email', {
                orderId: order.id,                        // ID de la orden
                userId: order.user_id,                    // ID del usuario dueño de la orden
                email: user.email,                        // Email del destinatario
                status: 'shipped',                        // Estado actual
                type: 'order_shipped'                     // Tipo de evento para template de email
            });
        // Si la orden fue marcada como devuelta, notifica por email
        } else if (status === 'returned') {
            // Publica evento de email de devolución
            publishEvent('order.returned.email', {
                orderId: order.id,                        // ID de la orden
                userId: order.user_id,                    // ID del usuario dueño de la orden
                email: user.email,                        // Email del destinatario
                status: 'returned',                       // Estado actual
                type: 'order_returned'                    // Tipo de evento para template de email
            });
        }

        // Responde con la orden actualizada
        res.json({ order });
    } catch (err) {
        // Imprime el error en consola para debugging
        console.error('Update status error:', err.message);
        // Responde con error genérico 500
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Exporta el router de órdenes
module.exports = router;
