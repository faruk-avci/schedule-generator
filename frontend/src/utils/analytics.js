import { logEvent, logError } from '../services/api';

/**
 * Analytics Utility
 * Used to track user interactions across the app
 */
const Analytics = {
    // Standard event types for consistency
    Events: {
        CLICK_EXPORT_PDF: 'CLICK_EXPORT_PDF',
        CLICK_EXPORT_PNG: 'CLICK_EXPORT_PNG',
        CLICK_EXPORT_IMAGE: 'CLICK_EXPORT_IMAGE',
        CLICK_SAVE_BASKET: 'CLICK_SAVE_BASKET',
        CLICK_LOAD_BASKET: 'CLICK_LOAD_BASKET',
        CLICK_GITHUB: 'CLICK_GITHUB',
        CLICK_LINKEDIN: 'CLICK_LINKEDIN',
        CLICK_QUICK_SEARCH: 'CLICK_QUICK_SEARCH',
        GENERATE_SCHEDULE_SUCCESS: 'GENERATE_SCHEDULE_SUCCESS',
        GENERATE_SCHEDULE_EMPTY: 'GENERATE_SCHEDULE_EMPTY'
    },

    /**
     * Track a simple interaction
     */
    track(eventName, details = {}) {
        console.log(`[Analytics] ${eventName}`, details);
        logEvent(eventName, details).catch(() => { });
    },

    /**
     * Track an error specifically
     */
    trackError(error, context = '') {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : '';
        logError(errorMsg, stack, window.location.href).catch(() => { });
    },

    /**
     * Automatic setup for global error catching
     */
    initGlobalErrorTracking() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.trackError(error || message, `Global: ${source}:${lineno}:${colno}`);
        };

        window.onunhandledrejection = (event) => {
            this.trackError(event.reason, 'Unhandled Promise Rejection');
        };
        console.log('✅ Analytics initialized');
    }
};

export default Analytics;
