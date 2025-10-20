require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); 
const { testConnection } = require('./src/database/db');

const app = express();
const PORT = process.env.PORT || 8081;

// ============================================
// MIDDLEWARE
// ============================================

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

app.use(cors({
    origin: 'http://localhost:5173',  // React dev server
    credentials: true  // Allow cookies
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-change-this',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true
    }
}));

// Initialize session arrays
app.use((req, res, next) => {
    if (!req.session.addedCourses) {
        req.session.addedCourses = [];
    }
    if (!req.session.addedSections) {
        req.session.addedSections = [];
    }
    next();
});

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

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// API ROUTES
// ============================================

// Course routes (search, add, remove, basket)
app.use('/api/courses', require('./src/routes/courseRoutes'));

// Schedule routes (generate)
app.use('/api/schedule', require('./src/routes/scheduleRoutes'));

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
        app.listen(PORT, '0.0.0.0',() => {
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