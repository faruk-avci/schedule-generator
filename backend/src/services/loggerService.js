const fs = require('fs');
const path = require('path');
const { pool } = require('../database/db');

// Ensure logs directory exists
const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function appendToFile(filename, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    fs.appendFile(path.join(LOG_DIR, filename), logLine, (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });
}

/**
 * Log server errors to file
 */
function logSystemError(error, context = '') {
    const msg = `${context} - ${error.message}\nStack: ${error.stack}`;
    appendToFile('error.log', msg);
}

/**
 * Log HTTP requests to file
 */
function logAccess(method, url, status, ip, duration) {
    const msg = `${method} ${url} ${status} - ${ip} - ${duration}ms`;
    appendToFile('access.log', msg);
}

module.exports = { logActivity, logSystemError, logAccess };


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

