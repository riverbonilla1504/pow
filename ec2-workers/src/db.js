const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function logNotification(orderId, type, status, recipient, template, errorMsg = null) {
    try {
        await pool.query(
            `INSERT INTO notification_logs (order_id, type, status, recipient, template, error_msg)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orderId || null, type, status, recipient, template, errorMsg]
        );
    } catch (err) {
        console.error('Failed to log notification:', err.message);
    }
}

module.exports = { logNotification };
