require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { pool, testConnection } = require('./src/database/db');
const PgSession = require('connect-pg-simple')(session);
const logRoutes = require('./src/routes/logRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');

const app = express();
const PORT = process.env.PORT || 8081;

// ============================================
// MIDDLEWARE
// ============================================

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true  // Allow cookies
}));

// Session configuration
const sessionStore = new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: false // Already created by script
});
app.set('sessionStore', sessionStore);

app.use(session({
    name: '_sid', // Custom name to hide tech stack
    secret: process.env.SESSION_SECRET || 'default-secret-change-this',
    resave: false,
    saveUninitialized: false, // Only save session when something is added to basket
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true, // Prevents XSS script access
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'lax' // CSRF protection
    }
}));

// Simple request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
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