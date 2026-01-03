require('dotenv').config();
const { pool } = require('./src/database/db');

async function initSessionTable() {
    try {
        console.log('🔄 Initializing session table for connect-pg-simple...');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS "session" (
                "sid" varchar NOT NULL COLLATE "default",
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL
            )
            WITH (OIDS=FALSE);
        `;

        const alterTableQuery = `
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
                    ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
                END IF;
            END
            $$;
        `;

        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
        `;

        await pool.query(createTableQuery);
        await pool.query(alterTableQuery);
        await pool.query(createIndexQuery);

        console.log('✅ Successfully created/verified session table');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to initialize session table:', error);
        process.exit(1);
    }
}

initSessionTable();
