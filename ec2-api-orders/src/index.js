require('dotenv').config();
// v1.0.4
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const { connectRabbitMQ } = require('./services/rabbitmq');
const { pool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: ['https://freck.lat', 'https://admin.freck.lat', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(globalLimiter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

async function start() {
    try {
        await pool.query('SELECT 1');
        console.log('Database connected');

        await connectRabbitMQ();
        console.log('RabbitMQ connected');

        app.listen(PORT, () => {
            console.log(`Orders API running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start:', err.message);
        process.exit(1);
    }
}

start();
