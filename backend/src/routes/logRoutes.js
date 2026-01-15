const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { logActivity } = require('../services/loggerService');

// GET /api/logs - View all logs (Internal Debug)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50');
        res.json({ success: true, count: result.rowCount, logs: result.rows });
    } catch (error) {
        console.error('Log view error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/logs/sessions - View active sessions (Internal Debug)
router.get('/sessions', async (req, res) => {
    try {
        const result = await pool.query('SELECT sid, sess, expire FROM session ORDER BY expire DESC LIMIT 20');
        res.json({ success: true, count: result.rowCount, sessions: result.rows });
    } catch (error) {
        console.error('Session view error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/logs/view
router.post('/view', async (req, res) => {
    try {
        const { page } = req.body;

        if (!page) {
            return res.status(400).json({ success: false, message: 'Page name is required' });
        }

        await logActivity(
            req,
            'PAGE_VIEW',
            {
                page: page,
                userAgent: req.headers['user-agent'],
                referer: req.headers['referer']
            }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error logging page view:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/logs/event - Log a custom UI event (click, etc)
router.post('/event', async (req, res) => {
    try {
        const { eventName, details } = req.body;
        await logActivity(req, 'EVENT', { eventName, ...details });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// POST /api/logs/error - DELETED for security
// Client-side errors are no longer accepted by the server.

module.exports = router;
