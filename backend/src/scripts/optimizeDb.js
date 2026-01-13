const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../database/db');

async function optimize() {
    try {
        console.log('--- Database Optimization Script ---');

        // 1. Enable pg_trgm extension
        console.log('Enabling pg_trgm extension...');
        await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
        console.log('✓ pg_trgm extension enabled');

        // 2. Identify tables
        const currentTerm = process.env.CURRENT_TERM || "";
        const sanitizedTerm = currentTerm.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const coursesTable = currentTerm ? `courses_${sanitizedTerm}` : 'courses';

        console.log(`Working on table: ${coursesTable}`);

        // 3. Create Gin Trigram Indexes
        // We'll index course_code and course_name as these are most searched
        console.log('Creating GIN trigram indexes...');

        const hasCourseCodeQuery = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = 'course_code'
        `, [coursesTable]);

        if (hasCourseCodeQuery.rows.length > 0) {
            console.log('Adding index to course_code...');
            await pool.query(`CREATE INDEX IF NOT EXISTS trgm_idx_course_code ON ${coursesTable} USING gin (course_code gin_trgm_ops);`);
        }

        console.log('Adding index to course_name...');
        await pool.query(`CREATE INDEX IF NOT EXISTS trgm_idx_course_name ON ${coursesTable} USING gin (course_name gin_trgm_ops);`);

        console.log('✓ Trigram indexes created successfully');

        // 4. Analyze to update stats
        console.log('Analyzing tables...');
        await pool.query(`ANALYZE ${coursesTable};`);
        console.log('✓ Tables analyzed');

    } catch (error) {
        console.error('❌ Optimization failed:', error.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

optimize();
