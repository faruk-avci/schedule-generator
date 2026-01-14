const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const { pool } = require('../database/db');
const { logActivity } = require('../services/loggerService');
const { getTableColumns, tableExists } = require('../utils/dbUtils');

// ============================================
// PERFORMANCE: Cache for search results
// ============================================
const searchCache = new NodeCache({
    stdTTL: 300,           // 5 minutes
    checkperiod: 60,       // Check for expired keys every 60s
    maxKeys: 2000,         // Store up to 2000 searches
    useClones: false       // Return references for speed
});

// Track pending queries to prevent duplicate database hits
const pendingQueries = new Map();

// ============================================
// POST /api/courses/search - OPTIMIZED VERSION
// ============================================
router.post('/search', async (req, res) => {
    try {
        const { courseName } = req.body;

        // Early validation
        if (!courseName || courseName.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Course name must be at least 2 characters'
            });
        }

        // Normalize input
        const normalizedInput = courseName.replace(/\s+/g, '').toLowerCase();
        const cacheKey = `search:${normalizedInput}`;

        // Check cache first
        const cached = searchCache.get(cacheKey);
        if (cached) {
            res.set('X-Cache', 'HIT');
            res.set('Cache-Control', 'public, max-age=120');
            return res.json(cached);
        }

        // Check if this exact query is already running
        if (pendingQueries.has(cacheKey)) {
            const result = await pendingQueries.get(cacheKey);
            res.set('X-Cache', 'DEDUP');
            return res.json(result);
        }

        // Create query promise
        const queryPromise = executeOptimizedSearch(normalizedInput, req);
        pendingQueries.set(cacheKey, queryPromise);

        try {
            const result = await queryPromise;

            // Cache the result
            searchCache.set(cacheKey, result);

            // Log only on cache miss
            logActivity(req, 'SEARCH', {
                query: courseName,
                normalized: normalizedInput,
                resultsCount: result.count
            });

            res.set('X-Cache', 'MISS');
            res.set('Cache-Control', 'public, max-age=120');
            res.json(result);

        } finally {
            pendingQueries.delete(cacheKey);
        }

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error',
            message: error.message
        });
    }
});

// ============================================
// CORE SEARCH LOGIC - OPTIMIZED
// ============================================
async function executeOptimizedSearch(normalizedInput, req) {
    // Get current term
    const currentTerm = process.env.CURRENT_TERM || "";
    const sanitizedTerm = currentTerm.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    let coursesTable = currentTerm ? `courses_${sanitizedTerm}` : 'courses';
    let slotsTable = currentTerm ? `course_time_slots_${sanitizedTerm}` : 'course_time_slots';

    // Check table existence
    if (currentTerm && !(await tableExists(coursesTable))) {
        coursesTable = 'courses';
        slotsTable = 'course_time_slots';
    }

    // Get columns (cached)
    const cols = await getTableColumns(coursesTable);
    const hasCourseCode = cols.includes('course_code');
    const hasTerm = cols.includes('term');
    const hasPrereq = cols.includes('prerequisites');
    const hasCoreq = cols.includes('corequisites');

    // ============================================
    // OPTIMIZATION 1: Use CTE + JSON aggregation
    // This does the grouping in PostgreSQL, not Node.js
    // ============================================
    const codeField = hasCourseCode ? 'c.course_code' : 'c.course_name';
    const prereqField = hasPrereq ? 'c.prerequisites' : "''";
    const coreqField = hasCoreq ? 'c.corequisites' : "''";
    const termCondition = hasTerm ? "AND (c.term = $2 OR $2 = '')" : "";

    const query = `
        WITH course_sections AS (
            SELECT 
                ${codeField} as course_code,
                c.course_name,
                c.credits,
                c.faculty,
                ${prereqField} as prerequisites,
                ${coreqField} as corequisites,
                c.section_name,
                c.lecturer,
                c.id as course_id
            FROM ${coursesTable} c
            WHERE ${codeField} ILIKE $1
            ${termCondition}
            LIMIT 500
        ),
        section_times AS (
            SELECT 
                cs.course_code,
                cs.section_name,
                json_agg(
                    json_build_object(
                        'day', ts_start.day_of_week,
                        'start', ts_start.hour_of_day,
                        'end', CASE 
                            WHEN ts_end.hour_of_day LIKE '%:40' 
                            THEN REPLACE(ts_end.hour_of_day, ':40', ':30')
                            ELSE ts_end.hour_of_day
                        END
                    ) ORDER BY ts_start.day_of_week, ts_start.hour_of_day
                ) as times
            FROM course_sections cs
            LEFT JOIN ${slotsTable} cts ON cs.course_id = cts.course_id
            LEFT JOIN time_slots ts_start ON cts.start_time_id = ts_start.time_id
            LEFT JOIN time_slots ts_end ON cts.end_time_id = ts_end.time_id
            WHERE ts_start.day_of_week IS NOT NULL
            GROUP BY cs.course_code, cs.section_name
        )
        SELECT 
            cs.course_code,
            cs.course_name,
            cs.credits,
            cs.faculty,
            cs.prerequisites,
            cs.corequisites,
            json_agg(
                json_build_object(
                    'section_name', cs.section_name,
                    'lecturer', cs.lecturer,
                    'times', COALESCE(st.times, '[]'::json)
                ) ORDER BY cs.section_name
            ) as sections
        FROM course_sections cs
        LEFT JOIN section_times st ON cs.course_code = st.course_code 
            AND cs.section_name = st.section_name
        GROUP BY cs.course_code, cs.course_name, cs.credits, cs.faculty, 
                 cs.prerequisites, cs.corequisites
        ORDER BY cs.course_code
    `;

    const params = [`%${normalizedInput}%`];
    if (hasTerm) {
        params.push(currentTerm);
    }

    const result = await pool.query(query, params);

    console.log(`✓ Found ${result.rows.length} courses for "${normalizedInput}"`);

    return {
        success: true,
        count: result.rows.length,
        courses: result.rows
    };
}

// ============================================
// CACHE MANAGEMENT ENDPOINTS
// ============================================

// Clear search cache (useful after data updates)
router.post('/search/cache/clear', (req, res) => {
    const keys = searchCache.keys();
    searchCache.flushAll();
    console.log(`🗑️ Cleared ${keys.length} cached searches`);

    res.json({
        success: true,
        message: `Cleared ${keys.length} cached searches`
    });
});

// Get cache statistics
router.get('/search/cache/stats', (req, res) => {
    const stats = searchCache.getStats();
    res.json({
        success: true,
        stats: {
            keys: stats.keys,
            hits: stats.hits,
            misses: stats.misses,
            hitRate: stats.hits / (stats.hits + stats.misses) || 0
        }
    });
});

module.exports = router;