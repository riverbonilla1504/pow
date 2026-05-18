// Importa la clase Pool de pg para manejar un pool de conexiones a PostgreSQL
const { Pool } = require('pg');

// Crea un nuevo pool de conexiones con la configuración desde variables de entorno
const pool = new Pool({
    host: process.env.DB_HOST,                          // Host del servidor PostgreSQL (10.0.2.152)
    port: parseInt(process.env.DB_PORT) || 5432,        // Puerto de PostgreSQL, 5432 por defecto
    database: process.env.DB_NAME,                      // Nombre de la base de datos (ecommerce)
    user: process.env.DB_USER,                          // Usuario de la base de datos (appuser)
    password: process.env.DB_PASSWORD,                  // Contraseña del usuario de la BD
    max: 20,                                            // Máximo de conexiones simultáneas en el pool
    idleTimeoutMillis: 30000,                           // Cierra conexiones inactivas después de 30 segundos
    connectionTimeoutMillis: 2000                       // Timeout de 2 segundos al intentar conectar
});

// Exporta el pool para ser usado en rutas y servicios
module.exports = { pool };
