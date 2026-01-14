const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 50, // increased to handle higher concurrent load (autocannon -c 100)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000, // 10 seconds max per query
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

// Function to test database connection
async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        if (result.rows.length === 0) {
            console.error('❌ Database connection test failed: No rows returned');
            return false;
        }
        console.log('✓ Database connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        return false;
    }
}

// Monitor pool health in production
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        console.log('📊 Pool Status:', {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
            max: pool.options.max
        });
    }, 30000);
}

module.exports = { pool, testConnection };