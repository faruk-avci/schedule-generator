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
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.xls' || ext === '.xlsx') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed (.xls, .xlsx)'), false);
        }
    }
});

// Middleware to check if user is authenticated as Admin
const authAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.status(401).json({ success: false, error: 'Unauthorized. Please login as admin.' });
};

// POST /api/admin/login
router.post('/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        return res.status(500).json({ success: false, error: 'Admin password not configured on server.' });
    }

    if (password === adminPassword) {
        req.session.isAdmin = true;
        logActivity(req, 'ADMIN_LOGIN', { status: 'success' });
        return res.json({ success: true, message: 'Admin login successful' });
    } else {
        logActivity(req, 'ADMIN_LOGIN', { status: 'failed', attempt: password });
        return res.status(401).json({ success: false, error: 'Invalid admin password' });
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
        const { search, limit = 50, offset = 0 } = req.query;
        let query = 'SELECT * FROM courses';
        const params = [];

        if (search) {
            query += ' WHERE course_name ILIKE $1 OR section_name ILIKE $1 OR lecturer ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ` ORDER BY course_name ASC, section_name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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
        const { course_name, section_name, lecturer, credits, faculty, description } = req.body;
        const result = await pool.query(
            'INSERT INTO courses (course_name, section_name, lecturer, credits, faculty, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [course_name, section_name, lecturer, credits, faculty, description]
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
        const { course_name, section_name, lecturer, credits, faculty, description } = req.body;
        const result = await pool.query(
            'UPDATE courses SET course_name = $1, section_name = $2, lecturer = $3, credits = $4, faculty = $5, description = $6 WHERE id = $7 RETURNING *',
            [course_name, section_name, lecturer, credits, faculty, description, id]
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
        await pool.query('DELETE FROM courses WHERE id = $1', [id]);
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

        if (clearExisting === 'true') {
            // Option to clear old courses before new import
            await pool.query('TRUNCATE TABLE course_time_slots, courses RESTART IDENTITY CASCADE');
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

module.exports = router;
