const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { logActivity } = require('../services/loggerService');
const importService = require('../services/importService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Double check: Extension AND Mime Type
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype;

        const validExts = ['.xls', '.xlsx'];
        const validMimes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/octet-stream' // Sometimes Excel files sent as octet-stream
        ];

        if (validExts.includes(ext) && validMimes.includes(mime)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel files (.xls, .xlsx) are allowed.'), false);
        }
    }
});

const admin = require('../config/firebase');

// Middleware to check if user is authenticated as Admin via Firebase Token
const authAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Authorization token required' });
        }

        if (!admin.apps.length) {
            console.warn('Firebase Admin not initialized');
            return res.status(500).json({ success: false, error: 'Firebase Auth is not configured on server.' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

        if (allowedEmails.includes(decodedToken.email.toLowerCase())) {
            req.admin = decodedToken;
            return next();
        }

        res.status(403).json({ success: false, error: 'Email not authorized for admin access.' });
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
};

// POST /api/admin/login
// Now verify Firebase token and initialize session
router.post('/login', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, error: 'ID Token is required' });
    }

    if (!admin.apps.length) {
        return res.status(500).json({ success: false, error: 'Firebase Auth is not configured on server.' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

        if (allowedEmails.includes(decodedToken.email.toLowerCase())) {
            req.session.isAdmin = true;
            req.session.adminEmail = decodedToken.email;

            logActivity(req, 'ADMIN_LOGIN', { status: 'success', email: decodedToken.email });

            return res.json({
                success: true,
                message: 'Admin login successful',
                admin: { email: decodedToken.email, name: decodedToken.name }
            });
        }

        logActivity(req, 'ADMIN_LOGIN', { status: 'denied', email: decodedToken.email });
        res.status(403).json({ success: false, error: 'This email is not on the admin whitelist.' });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(401).json({ success: false, error: 'Authentication failed' });
    }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
    req.session.isAdmin = false;
    res.json({ success: true, message: 'Admin logout successful' });
});

// GET /api/admin/check
router.get('/check', authAdmin, (req, res) => {
    res.json({ success: true, authenticated: true });
});

// --- ANALYTICS ---

// GET /api/admin/logs
router.get('/logs', authAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100');
        res.json({ success: true, logs: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/sessions
router.get('/sessions', authAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT sid, sess, expire FROM session ORDER BY expire DESC LIMIT 50');
        res.json({ success: true, sessions: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- SETTINGS ---

// GET /api/admin/settings
router.get('/settings', authAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM site_settings ORDER BY key ASC');
        res.json({ success: true, settings: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/terms
router.get('/terms', authAdmin, async (req, res) => {
    try {
        // 1. Get terms from the main courses table
        const mainTermRes = await pool.query('SELECT DISTINCT term FROM courses WHERE term IS NOT NULL AND term != \'\'');
        const terms = mainTermRes.rows.map(r => r.term);

        // 2. Scan for term-specific tables (courses_2025_fall etc)
        const tableRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'courses_%'
        `);

        // Convert courses_2025_fall back to 2025_fall (approximate representation)
        tableRes.rows.forEach(row => {
            const termFromTable = row.table_name.replace('courses_', '');
            if (!terms.includes(termFromTable)) {
                terms.push(termFromTable);
            }
        });

        res.json({ success: true, terms: terms.sort().reverse() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/settings/:key
router.put('/settings/:key', authAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        await pool.query(
            'INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
            [key, value]
        );

        logActivity(req, 'UPDATE_SETTING', { key, value });
        res.json({ success: true, message: `Setting ${key} updated` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- COURSE MANAGEMENT (CRUD) ---

// GET /api/admin/courses (Search/List)
router.get('/courses', authAdmin, async (req, res) => {
    try {
        const { search, term = process.env.CURRENT_TERM, limit = 50, offset = 0 } = req.query;
        const sanitizedTerm = term ? term.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : null;
        const coursesTable = sanitizedTerm ? `courses_${sanitizedTerm}` : 'courses';

        // Check if table exists
        const tableCheck = await pool.query("SELECT to_regclass($1)", [coursesTable]);
        if (!tableCheck.rows[0].to_regclass) {
            return res.json({ success: true, courses: [], message: 'Term table does not exist yet.' });
        }

        let query = `
            SELECT * FROM ${coursesTable}
            WHERE 1=1
        `;
        const params = [];

        // If the table is term-specific, we don't need to filter by term in the WHERE clause
        // If it's the default 'courses' table, we might still want to filter by term if provided
        if (!sanitizedTerm && term) { // Only apply term filter if using the generic 'courses' table
            params.push(term);
            query += ` AND term = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (course_name ILIKE $${params.length} OR course_code ILIKE $${params.length} OR section_name ILIKE $${params.length} OR lecturer ILIKE $${params.length})`;
        }

        query += ` ORDER BY term DESC, course_code ASC, section_name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        res.json({ success: true, count: result.rowCount, courses: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/courses (Add)
router.post('/courses', authAdmin, async (req, res) => {
    try {
        const { course_code, course_name, section_name, lecturer, credits, faculty, description, term, prerequisites, corequisites } = req.body;
        const sanitizedTerm = term ? term.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : null;
        const coursesTable = sanitizedTerm ? `courses_${sanitizedTerm}` : 'courses';

        const result = await pool.query(
            `INSERT INTO ${coursesTable} (course_code, course_name, section_name, faculty, description, credits, lecturer, term, prerequisites, corequisites)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [course_code, course_name, section_name, faculty, description, credits, lecturer, term, prerequisites, corequisites]
        );
        logActivity(req, 'ADD_COURSE_ADMIN', { id: result.rows[0].id, course_name });
        res.json({ success: true, course: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/courses/:id (Update)
router.put('/courses/:id', authAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { course_code, course_name, section_name, lecturer, credits, faculty, description, term, prerequisites, corequisites } = req.body;
        const sanitizedTerm = term ? term.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : null;
        const coursesTable = sanitizedTerm ? `courses_${sanitizedTerm}` : 'courses';

        const result = await pool.query(
            `UPDATE ${coursesTable} SET course_code = $1, course_name = $2, section_name = $3, faculty = $4, description = $5, credits = $6, lecturer = $7, term = $8, prerequisites = $9, corequisites = $10 WHERE id = $11 RETURNING *`,
            [course_code, course_name, section_name, faculty, description, credits, lecturer, term, prerequisites, corequisites, id]
        );
        logActivity(req, 'UPDATE_COURSE_ADMIN', { id, course_name });
        res.json({ success: true, course: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/admin/courses/:id (Delete)
router.delete('/courses/:id', authAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { term } = req.query; // Admin panel should pass term for correct table deletion
        const sanitizedTerm = term ? term.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : null;
        const coursesTable = sanitizedTerm ? `courses_${sanitizedTerm}` : 'courses';

        await pool.query(`DELETE FROM ${coursesTable} WHERE id = $1`, [id]);
        logActivity(req, 'DELETE_COURSE_ADMIN', { id });
        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- BATCH IMPORT ---

// POST /api/admin/import
router.post('/import', authAdmin, upload.array('files'), async (req, res) => {
    try {
        const { term, clearExisting } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded' });
        }

        const sanitizedTerm = term ? term.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : null;
        const coursesTable = sanitizedTerm ? `courses_${sanitizedTerm}` : 'courses';
        const slotsTable = sanitizedTerm ? `course_time_slots_${sanitizedTerm}` : 'course_time_slots';

        if (clearExisting === 'true') {
            // Option to clear old courses before new import
            await pool.query(`TRUNCATE TABLE ${slotsTable}, ${coursesTable} RESTART IDENTITY CASCADE`);
            logActivity(req, 'CLEAR_DATABASE_ADMIN', { term });
        }

        const summaries = [];

        for (const file of files) {
            const result = await importService.importFromExcel(file.path, term);
            summaries.push({
                fileName: file.originalname,
                ...result
            });

            // Clean up file after processing
            fs.unlinkSync(file.path);
        }

        logActivity(req, 'BATCH_IMPORT_ADMIN', { term, fileCount: files.length });

        res.json({
            success: true,
            summaries: summaries
        });

    } catch (error) {
        console.error('Import Route Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- MAINTENANCE ---

router.post('/maintenance/initialize-term', authAdmin, async (req, res) => {
    try {
        const { term } = req.body;
        if (!term) return res.status(400).json({ success: false, error: 'Term name is required' });

        const sanitizedTerm = term.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const coursesTable = `courses_${sanitizedTerm}`;
        const slotsTable = `course_time_slots_${sanitizedTerm}`;

        // Create tables by cloning the structure of the main tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ${coursesTable} (LIKE courses INCLUDING ALL);
            CREATE TABLE IF NOT EXISTS ${slotsTable} (LIKE course_time_slots INCLUDING ALL);
        `);

        logActivity(req, 'INITIALIZE_TERM_TABLES', { term, coursesTable, slotsTable });

        res.json({
            success: true,
            message: `Tables ${coursesTable} and ${slotsTable} created or already exist.`,
            tables: [coursesTable, slotsTable]
        });
    } catch (error) {
        console.error('Initialization error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/maintenance/cleanup-no-slots
router.post('/maintenance/cleanup-no-slots', authAdmin, async (req, res) => {
    try {
        const { term } = req.body;
        if (!term) return res.status(400).json({ success: false, error: 'Term name is required' });

        const sanitizedTerm = term.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const coursesTable = `courses_${sanitizedTerm}`;
        const slotsTable = `course_time_slots_${sanitizedTerm}`;

        // 1. Identify courses with no time slots
        const findQuery = `
            SELECT id, course_code, course_name, section_name 
            FROM ${coursesTable} c
            WHERE NOT EXISTS (
                SELECT 1 FROM ${slotsTable} s 
                WHERE s.course_id = c.id
            )
        `;
        const toDelete = await pool.query(findQuery);

        if (toDelete.rows.length === 0) {
            return res.json({
                success: true,
                message: 'No courses without time slots were found.',
                deletedCount: 0,
                deletedCourses: []
            });
        }

        // 2. Delete them
        const deleteQuery = `
            DELETE FROM ${coursesTable}
            WHERE id IN (
                SELECT id 
                FROM ${coursesTable} c
                WHERE NOT EXISTS (
                    SELECT 1 FROM ${slotsTable} s 
                    WHERE s.course_id = c.id
                )
            )
        `;
        await pool.query(deleteQuery);

        logActivity(req, 'CLEANUP_NO_SLOTS', {
            term,
            deletedCount: toDelete.rows.length,
            courses: toDelete.rows.map(r => `${r.course_code} (${r.section_name})`)
        });

        res.json({
            success: true,
            message: `Successfully deleted ${toDelete.rows.length} courses with no time slots.`,
            deletedCount: toDelete.rows.length,
            deletedCourses: toDelete.rows
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
