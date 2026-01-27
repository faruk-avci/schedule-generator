// Load environment variables from .env file
require('dotenv').config();

module.exports = {
    apps: [
        {
            name: 'schedule-backend',
            script: 'app.js',
            instances: 'max', // Uses all CPU cores
            exec_mode: 'cluster',
            max_memory_restart: '1500M', // 1.5GB per instance (safe for 8GB RAM VPS)
            // Auto-restart settings
            watch: false,
            autorestart: true,
            restart_delay: 1000,
            // Logging
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss'
        }
    ]
};
