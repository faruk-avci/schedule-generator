const { pool } = require('../database/db');

/**
 * Log user activity to the database
 * @param {Object} req - Express request object (to extract session and IP)
 * @param {string} action - Action name (e.g., 'SEARCH', 'ADD_COURSE')
 * @param {Object} details - Additional details about the action
 */
async function logActivity(req, action, details = {}) {
    try {
        const sessionId = req.sessionID || req.session?.id || 'anonymous';

        // Safe IP extraction
        let ipAddress = 'unknown';
        if (req) {
            ipAddress = req.ip ||
                (req.socket && req.socket.remoteAddress) ||
                (req.connection && req.connection.remoteAddress) ||
                'unknown';

            // Handle proxy headers if behind Nginx/deployment
            if (req.headers && req.headers['x-forwarded-for']) {
                ipAddress = req.headers['x-forwarded-for'].split(',')[0];
            }
        }

        const query = `
            INSERT INTO activity_logs (session_id, action, details, ip_address)
            VALUES ($1, $2, $3, $4)
        `;

        // Fire and forget - don't await to avoid blocking response
        pool.query(query, [sessionId, action, details, ipAddress])
            .catch(err => console.error('❌ Logger error:', err.message));

    } catch (error) {
        console.error('❌ Detailed logger error:', error);
    }
}

module.exports = { logActivity };
