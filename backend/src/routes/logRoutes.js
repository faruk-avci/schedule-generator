const express = require('express');
const router = express.Router();
const { logActivity } = require('../services/loggerService');

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

module.exports = router;
