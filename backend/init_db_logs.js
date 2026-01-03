require('dotenv').config();
const { pool } = require('./src/database/db');

async function initLogsTable() {
    try {
        console.log('🔄 Initializing activity_logs table...');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                session_id TEXT,
                action TEXT NOT NULL,
                details JSONB,
                ip_address TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;

        const createIndexesQuery = `
            CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
        `;

        await pool.query(createTableQuery);
        await pool.query(createIndexesQuery);

        console.log('✅ Successfully created/verified activity_logs table');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to initialize table:', error);
        process.exit(1);
    }
}

initLogsTable();
