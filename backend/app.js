require('dotenv').config();
const { initTelegramBot } = require('./src/services/telegramService');
const express = require('express');

// Initialize Telegram Bot for monitoring
initTelegramBot();
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { pool, testConnection } = require('./src/database/db');
const PgSession = require('connect-pg-simple')(session);
const logRoutes = require('./src/routes/logRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 8081;

// ============================================
// MIDDLEWARE
// ============================================

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check or API root
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'OzuPlanner API is running',
        version: '2.0.0'
    });
});

const allowedOrigins = [
    'https://ozuplanner.com',
    'https://www.ozuplanner.com',
    'https://admin.ozuplanner.com',
    'https://api.ozuplanner.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(o => {
        const trimmed = o.trim();
        if (trimmed && !allowedOrigins.includes(trimmed)) {
            allowedOrigins.push(trimmed);
        }
    });
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Simple check for ozuplanner.com subdomains
        const isOzuSubdomain = origin.endsWith('.ozuplanner.com') || origin === 'https://ozuplanner.com';

        if (allowedOrigins.indexOf(origin) !== -1 || isOzuSubdomain) {
            return callback(null, true);
        } else {
            console.error(`❌ CORS blocked for origin: ${origin}`);
            return callback(new Error('CORS not allowed'), false);
        }
    },
    credentials: true
}));

// Trust proxy (Crucial for secure cookies behind Nginx)
app.set('trust proxy', 1);

// Session configuration
const sessionStore = new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: false // Already created by script
});
app.set('sessionStore', sessionStore);

const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
    name: '_sid', // Custom name to hide tech stack
    secret: process.env.SESSION_SECRET || 'default-secret-change-this',
    resave: false,
    saveUninitialized: false, // Only save session when something is added to basket
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true, // Prevents XSS script access
        secure: isProduction, // Use secure cookies in production
        sameSite: isProduction ? 'lax' : 'lax', // Consistent sameSite
        domain: isProduction ? '.ozuplanner.com' : 'localhost' // Share cookie across subdomains in prod
    }
}));

// Detailed request logger
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || 'No-UA';
    console.log(`[${timestamp}] ${ip} - ${req.method} ${req.path} - ${ua}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'API test works' });
});

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// API ROUTES
// ============================================

// Course routes (search, add, remove, basket)
app.use('/api/courses', courseRoutes);

// Schedule routes (generate)
app.use('/api/schedule', scheduleRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);

// Admin Debug Dashboard (Hidden)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path
    });
});

// General error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Add CORS headers even for errors!
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
    try {
        // Test database connection first
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ Cannot start server - database connection failed');
            process.exit(1);
        }

        // Start server
        app.listen(PORT, () => {
            console.log('=================================');
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV}`);
            console.log(`💾 Database: ${process.env.DB_NAME}`);
            console.log('=================================');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();