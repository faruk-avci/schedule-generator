const { Telegraf } = require('telegraf');
const pidusage = require('pidusage');
const os = require('os');

// Placeholders - to be filled via .env
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;

let bot;
let monitoringInterval;

/**
 * Initialize Telegram Bot
 */
function initTelegramBot() {
    if (!BOT_TOKEN) {
        console.warn('⚠️  TELEGRAM_BOT_TOKEN not found in .env. Telegram monitoring disabled.');
        return;
    }

    bot = new Telegraf(BOT_TOKEN);

    // Middleware to restrict access to ADMIN_ID
    bot.use(async (ctx, next) => {
        if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID.toString()) {
            return ctx.reply('⛔ Unauthorized. Contact the administrator.');
        }
        return next();
    });

    // /start command
    bot.start((ctx) => {
        ctx.reply('🛡️ *OzuPlanner Monitor Bot Active*\n\nCommands:\n/stats - System Health\n/cache - Cache Stats\n/clear - Clear Cache', { parse_mode: 'Markdown' });
    });

    // /stats command
    bot.command('stats', async (ctx) => {
        try {
            const stats = await pidusage(process.pid);
            const uptime = Math.floor(process.uptime());
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);

            const message = [
                '📊 *System Health*',
                '━━━━━━━━━━━━',
                `🚀 *CPU:* ${(stats.cpu).toFixed(2)}%`,
                `🧠 *RAM:* ${(stats.memory / 1024 / 1024).toFixed(1)} MB`,
                `⏱️ *Uptime:* ${hours}h ${minutes}m`,
                `📈 *Load Avg (1m):* ${os.loadavg()[0].toFixed(2)}`,
                `🗄️ *DB Pool:* Connected`
            ].join('\n');

            ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (err) {
            ctx.reply('❌ Error fetching stats: ' + err.message);
        }
    });

    // /cache command
    bot.command('cache', (ctx) => {
        try {
            // Lazy load courseRoutes to avoid circular dependency
            const courseRoutes = require('../routes/courseRoutes');
            const searchCache = courseRoutes.searchCache;

            if (!searchCache) {
                return ctx.reply('❌ Error: Search Cache is not initialized on the server.');
            }

            const stats = searchCache.getStats();

            const message = [
                '🗄️ *Search Cache*',
                '━━━━━━━━━━━━',
                `📦 *Keys:* ${stats.keys}`,
                `✅ *Hits:* ${stats.hits}`,
                `❌ *Misses:* ${stats.misses}`,
                `🎯 *Ratio:* ${((stats.hits / (stats.hits + stats.misses || 1)) * 100).toFixed(1)}%`
            ].join('\n');

            ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🗑️ Clear Cache', callback_data: 'clear_cache' }]]
                }
            });
        } catch (err) {
            ctx.reply('❌ Error fetching cache stats: ' + err.message);
        }
    });

    // Handle button callback
    bot.action('clear_cache', (ctx) => {
        const courseRoutes = require('../routes/courseRoutes');
        const searchCache = courseRoutes.searchCache;

        if (searchCache) {
            searchCache.flushAll();
            ctx.answerCbQuery('Cache cleared!');
            ctx.editMessageText('✅ *Cache has been cleared!*', { parse_mode: 'Markdown' });
        } else {
            ctx.answerCbQuery('Error: Cache not found');
        }
    });

    // Launch bot
    bot.launch().then(() => {
        console.log('🤖 Telegram Bot launched successfully');
        startMonitoring();
    }).catch(err => {
        console.error('❌ Failed to launch Telegram Bot:', err);
    });

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

/**
 * Background Monitoring Task
 */
function startMonitoring() {
    if (monitoringInterval) clearInterval(monitoringInterval);

    let highCpuCount = 0;

    monitoringInterval = setInterval(async () => {
        try {
            const stats = await pidusage(process.pid);
            const cpuUsage = stats.cpu;

            // Alert if CPU is > 90% for 4 consecutive checks (2 minutes)
            if (cpuUsage > 90) {
                highCpuCount++;
                if (highCpuCount === 4) {
                    sendAlert(`🔥 *CRITICAL CPU USAGE*: ${cpuUsage.toFixed(1)}% for 2 minutes!`);
                }
            } else {
                highCpuCount = 0;
            }

        } catch (err) {
            console.error('Monitoring error:', err);
        }
    }, 30000); // Check every 30 seconds
}

/**
 * Send custom alert to admin
 */
async function sendAlert(message) {
    if (!bot || !ADMIN_ID) return;
    try {
        await bot.telegram.sendMessage(ADMIN_ID, `🚨 *ALERT*: ${message}`, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('Failed to send Telegram alert:', err);
    }
}

module.exports = { initTelegramBot, sendAlert };
