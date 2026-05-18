// Carga las variables de entorno desde el archivo .env al process.env
require('dotenv').config();
// CD verified
// Importa el framework Express para crear el servidor HTTP
const express = require('express');
// Importa Helmet para configurar cabeceras HTTP de seguridad
const helmet = require('helmet');
// Importa CORS para permitir peticiones cross-origin desde el frontend
const cors = require('cors');
// Importa express-rate-limit para limitar la cantidad de peticiones por IP
const rateLimit = require('express-rate-limit');

// Importa las rutas de autenticación (registro, login, 2FA)
const authRoutes = require('./routes/auth');
// Importa las rutas de órdenes (CRUD de órdenes)
const orderRoutes = require('./routes/orders');
// Importa las rutas de administración (dashboard, usuarios, DLQ, notificaciones)
const adminRoutes = require('./routes/admin');
// Importa la función para conectarse al broker RabbitMQ
const { connectRabbitMQ } = require('./services/rabbitmq');
// Importa el pool de conexiones a PostgreSQL
const { pool } = require('./config/database');

// Crea la instancia de la aplicación Express
const app = express();
// Define el puerto del servidor, usa variable de entorno o 3000 por defecto
const PORT = process.env.PORT || 3000;

// Configura las opciones de CORS con los orígenes permitidos
const corsOptions = {
  // Lista de dominios que pueden hacer peticiones a la API
  origin: [
    'https://freck.lat',           // Frontend de producción (usuarios)
    'https://admin.freck.lat',     // Panel de administración en producción
    'http://localhost:3000',        // Desarrollo local API
    'http://localhost:3001',        // Desarrollo local dashboard
    'http://127.0.0.1:3000',       // Desarrollo local API (IP directa)
    'http://127.0.0.1:3001',       // Desarrollo local dashboard (IP directa)
  ],
  credentials: true,               // Permite envío de cookies y cabeceras de autenticación
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas en las peticiones
};
// Aplica el middleware CORS con la configuración definida
app.use(cors(corsOptions));
// Responde automáticamente a las peticiones preflight OPTIONS
app.options('*', cors(corsOptions));
// Aplica Helmet con política de recursos cross-origin permisiva
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// Habilita el parsing de JSON en el body de las peticiones
app.use(express.json());

// Configura el rate limiter global: máximo 100 peticiones por IP cada 15 minutos
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,      // Ventana de tiempo: 15 minutos en milisegundos
    max: 100,                        // Máximo de peticiones por ventana
    standardHeaders: true,           // Incluye cabeceras estándar RateLimit-* en la respuesta
    legacyHeaders: false             // Desactiva las cabeceras legacy X-RateLimit-*
});
// Aplica el rate limiter a todas las rutas
app.use(globalLimiter);

// Endpoint de health check para monitoreo y balanceadores de carga
app.get('/health', (req, res) => {
    // Responde con estado OK y timestamp del servidor
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Monta las rutas de autenticación bajo el prefijo /auth
app.use('/auth', authRoutes);
// Monta las rutas de órdenes bajo el prefijo /orders
app.use('/orders', orderRoutes);
// Monta las rutas de administración bajo el prefijo /admin
app.use('/admin', adminRoutes);

// Middleware global de manejo de errores (debe tener 4 parámetros)
app.use((err, req, res, next) => {
    // Imprime el stack trace del error en consola para debugging
    console.error(err.stack);
    // Responde con error 500 genérico al cliente (no expone detalles internos)
    res.status(500).json({ error: 'Internal server error' });
});

// Función asíncrona que inicializa todas las dependencias y arranca el servidor
async function start() {
    try {
        // Verifica la conexión a PostgreSQL con una query simple
        await pool.query('SELECT 1');
        // Confirma en consola que la base de datos está conectada
        console.log('Database connected');

        // Establece la conexión con RabbitMQ y declara exchanges/queues
        await connectRabbitMQ();
        // Confirma en consola que RabbitMQ está conectado
        console.log('RabbitMQ connected');

        // Inicia el servidor HTTP en el puerto configurado
        app.listen(PORT, () => {
            // Confirma en consola que la API está corriendo
            console.log(`Orders API running on port ${PORT}`);
        });
    } catch (err) {
        // Si falla alguna dependencia, imprime el error
        console.error('Failed to start:', err.message);
        // Termina el proceso con código de error (PM2 lo reiniciará)
        process.exit(1);
    }
}

// Ejecuta la función de arranque
start();
