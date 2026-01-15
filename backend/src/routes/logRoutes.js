const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { logActivity } = require('../services/loggerService');

// GET /api/logs - DELETED for security
// GET /api/logs/sessions - DELETED for security

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
