import { logEvent, logError } from '../services/api';

/**
 * Analytics Utility
 * Used to track user interactions across the app
 */
const Analytics = {
    // Standard event types for consistency
    Events: {
        CLICK_GITHUB: 'CLICK_GITHUB',
        CLICK_GITHUB_AUTHOR: 'CLICK_GITHUB_AUTHOR',
        CLICK_SIS_LINK: 'CLICK_SIS_LINK',
        CLICK_LINKEDIN: 'CLICK_LINKEDIN',
        CLICK_QUICK_SEARCH: 'CLICK_QUICK_SEARCH',
        CLICK_EXPORT_PDF: 'CLICK_EXPORT_PDF',
        CLICK_EXPORT_PNG: 'CLICK_EXPORT_PNG',
        CLICK_EXPORT_IMAGE: 'CLICK_EXPORT_IMAGE',
        CLICK_EXPORT_CALENDAR: 'CLICK_EXPORT_CALENDAR',
        CLICK_SAVE_BASKET: 'CLICK_SAVE_BASKET',
        CLICK_LOAD_BASKET: 'CLICK_LOAD_BASKET',
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
        // Only log to console for debugging, do not send to server
        console.error(`[Analytics] Error tracked: ${context}`, error);
    },

    /**
     * Automatic setup for global error catching
     */
    initGlobalErrorTracking() {
        // Disabled global error reporting to backend for security
        console.log('✅ Analytics initialized (Error reporting disabled)');
    }
};

export default Analytics;
