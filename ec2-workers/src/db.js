// Importa la clase Pool de pg para manejar un pool de conexiones a PostgreSQL
const { Pool } = require('pg');

// Crea un pool de conexiones usando las variables de entorno
const pool = new Pool({
    host: process.env.DB_HOST,              // Host del servidor PostgreSQL (10.0.2.152)
    port: process.env.DB_PORT || 5432,      // Puerto de PostgreSQL, 5432 por defecto
    database: process.env.DB_NAME,          // Nombre de la base de datos (ecommerce)
    user: process.env.DB_USER,              // Usuario de la base de datos (appuser)
    password: process.env.DB_PASSWORD,      // Contraseña del usuario de la BD
});

// Registra el resultado de una notificación (enviada o fallida) en la tabla notification_logs
async function logNotification(orderId, type, status, recipient, template, errorMsg = null) {
    try {
        // Inserta un registro en notification_logs con los datos de la notificación
        await pool.query(
            `INSERT INTO notification_logs (order_id, type, status, recipient, template, error_msg)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orderId || null, type, status, recipient, template, errorMsg]
            // orderId puede ser null en caso de notificaciones no asociadas a órdenes
            // type: 'email' o 'sms'
            // status: 'sent' o 'failed'
            // recipient: email o teléfono del destinatario
            // template: tipo de template usado (order_created, order_shipped, etc.)
            // errorMsg: mensaje de error si falló, null si fue exitosa
        );
    } catch (err) {
        // Si falla el log, solo imprime en consola (no debe detener el flujo principal)
        console.error('Failed to log notification:', err.message);
    }
}

// Exporta la función de logging para ser usada por los workers de email y SMS
module.exports = { logNotification };
