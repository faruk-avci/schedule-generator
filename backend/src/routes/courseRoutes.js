const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { logActivity } = require('../services/loggerService');

const ALLOWED_MAJORS = [
    'Computer Engineering',
    'Electrical - Electronics Engineering',
    'Industrial Engineering',
    'Civil Engineering',
    'Mechanical Engineering',
    'Artificial Intelligence and Data Engineering',
    'Economics',
    'Entrepreneurship',
    'Business Administration',
    'International Finance',
    'International Trade and Business Management',
    'Management Information Systems',
    'Industrial Design',
    'Interior Architecture and Environmental Design',
    'Communication and Design',
    'Architecture (English)',
    'Architecture (Turkish)',
    'Aviation Management',
    'Pilot Training',
    'Psychology',
    'International Relations',
    'Anthropology',
    'Gastronomy and Culinary Arts',
    'Hotel Management',
    'Law',
    'Prefer not to share'
];

// ============================================
// POST /api/courses/search
// Search for courses by name
// ============================================
router.post('/search', async (req, res) => {
    try {
        const { courseName } = req.body;

        // Validation
        if (!courseName) {
            return res.status(400).json({
                success: false,
                error: 'Course name is required'
            });
        }

        if (courseName.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Course name must be at least 2 characters'
            });
        }


        // Normalize input: remove all spaces
        const normalizedInput = courseName.replace(/\s+/g, '');

        console.log('🔍 Searching for courses:', normalizedInput);

        // Get current academic term from settings
        const termResult = await pool.query("SELECT value FROM site_settings WHERE key = 'current_term'");
        const currentTerm = termResult.rows[0]?.value || '';
        const sanitizedTerm = currentTerm.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        // Use term-specific tables if currentTerm is set, otherwise fallback to main tables
        let coursesTable = currentTerm ? `courses_${sanitizedTerm}` : 'courses';
        let slotsTable = currentTerm ? `course_time_slots_${sanitizedTerm}` : 'course_time_slots';

        // Check if term-specific table exists, fallback to global table if not
        if (currentTerm) {
            const tableCheck = await pool.query("SELECT to_regclass($1)", [coursesTable]);
            if (!tableCheck.rows[0].to_regclass) {
                coursesTable = 'courses';
                slotsTable = 'course_time_slots';
            }
        }

        // Check for available columns to prevent 500s during migrations
        const colCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = $1
        `, [coursesTable]);
        const cols = colCheck.rows.map(r => r.column_name);

        const hasCourseCode = cols.includes('course_code');
        const hasTerm = cols.includes('term');
        const hasPrereq = cols.includes('prerequisites');
        const hasCoreq = cols.includes('corequisites');

        const codeField = hasCourseCode ? 'c.course_code' : 'c.course_name as course_code';
        const prereqField = hasPrereq ? 'c.prerequisites' : "'' as prerequisites";
        const coreqField = hasCoreq ? 'c.corequisites' : "'' as corequisites";

        const searchCondition = hasCourseCode
            ? "(REPLACE(c.course_name, ' ', '') ILIKE $1 OR REPLACE(c.course_code, ' ', '') ILIKE $1)"
            : "REPLACE(c.course_name, ' ', '') ILIKE $1";
        const termCondition = hasTerm ? "AND (c.term = $2 OR $2 = '')" : "";

        // Query database with normalized space handling and term filtering
        const query = `
            SELECT 
                ${codeField},
                c.course_name, 
                c.credits, 
                c.section_name, 
                c.lecturer,
                c.faculty,
                c.description,
                ${prereqField},
                ${coreqField},
                c.id as course_id,
                ts_start.day_of_week,
                ts_start.hour_of_day as start_time,
                CASE 
                    WHEN ts_end.hour_of_day LIKE '%:40' THEN 
                        REPLACE(ts_end.hour_of_day, ':40', ':30')
                ELSE 
                    ts_end.hour_of_day
                END as end_time
            FROM ${coursesTable} c
            LEFT JOIN ${slotsTable} cts ON c.id = cts.course_id
            LEFT JOIN time_slots ts_start ON cts.start_time_id = ts_start.time_id
            LEFT JOIN time_slots ts_end ON cts.end_time_id = ts_end.time_id
            WHERE ${searchCondition}
            ${termCondition}
            ORDER BY c.course_name, c.section_name, ts_start.day_of_week, ts_start.hour_of_day
        `;

        const params = [`%${normalizedInput}%`];
        if (hasTerm) {
            params.push(currentTerm);
        }

        const result = await pool.query(query, params);

        // Group sections by course name and include time slots
        const courseMap = new Map();


        result.rows.forEach(row => {
            if (!courseMap.has(row.course_code)) {
                courseMap.set(row.course_code, {
                    course_code: row.course_code,
                    course_name: row.course_name,
                    credits: row.credits,
                    faculty: row.faculty,
                    description: row.description,
                    sections: new Map()
                });
            }

            const course = courseMap.get(row.course_code);

            // Initialize section if it doesn't exist
            if (!course.sections.has(row.section_name)) {
                course.sections.set(row.section_name, {
                    section_name: row.section_name,
                    lecturer: row.lecturer,
                    times: []
                });
            }

            // Add time slot if it exists
            if (row.day_of_week && row.start_time && row.end_time) {
                course.sections.get(row.section_name).times.push({
                    day: row.day_of_week,
                    start: row.start_time,
                    end: row.end_time
                });
            }
        });

        // Convert nested Maps to arrays
        const courses = Array.from(courseMap.values()).map(course => ({
            course_code: course.course_code,
            course_name: course.course_name,
            credits: course.credits,
            faculty: course.faculty,
            description: course.description,
            sections: Array.from(course.sections.values())
        }));


        console.log(`✓ Found ${courses.length} courses with ${result.rows.length} total sections`);

        // Log search activity
        logActivity(req, 'SEARCH', {
            query: courseName,
            normalized: normalizedInput,
            resultsCount: courses.length
        });

        res.json({
            success: true,
            count: courses.length,
            courses: courses
        });

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
// POST /api/courses/add
// Add a course or section to basket
// ============================================
router.post('/add', async (req, res) => {
    try {
        const { course, section } = req.body; // 'course' here refers to course_code

        // Validation
        if (!course) {
            return res.status(400).json({
                success: false,
                error: 'Course code is required'
            });
        }

        // Get current academic term from settings
        const termResult = await pool.query("SELECT value FROM site_settings WHERE key = 'current_term'");
        const currentTerm = termResult.rows[0]?.value || '';
        const sanitizedTerm = currentTerm.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        let coursesTable = currentTerm ? `courses_${sanitizedTerm}` : 'courses';

        // Check if term-specific table exists, fallback to global table if not
        if (currentTerm) {
            const tableCheck = await pool.query("SELECT to_regclass($1)", [coursesTable]);
            if (!tableCheck.rows[0].to_regclass) {
                coursesTable = 'courses';
            }
        }
        // Check if course_code column exists
        const colCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = 'course_code'
        `, [coursesTable]);
        const hasCourseCode = colCheck.rows.length > 0;
        const codeCol = hasCourseCode ? 'course_code' : 'course_name';

        // Case 1: Adding entire course (section is null or undefined)
        if (section === null || section === undefined) {
            // [SECURITY] Verify course exists in database and belongs to current term
            const courseExists = await pool.query(
                `SELECT id FROM ${coursesTable} WHERE ${codeCol} = $1 AND (term = $2 OR $2 = '') LIMIT 1`,
                [course, currentTerm]
            );

            if (courseExists.rows.length === 0) {
                logActivity(req, 'SECURITY_ALERT', {
                    type: 'INVALID_COURSE',
                    course,
                    message: 'Attempted to add non-existent course'
                });
                return res.status(404).json({
                    success: false,
                    error: `Course "${course}" not found in database.`
                });
            }

            // Check if course already added
            if ((req.session.addedCourses || []).includes(course)) {
                return res.status(400).json({
                    success: false,
                    error: `Course "${course}" is already in your basket`
                });
            }

            // Check if any section of this course is already added
            const hasSection = (req.session.addedSections || []).some(s => s.course === course);
            if (hasSection) {
                return res.status(400).json({
                    success: false,
                    error: `A section of "${course}" is already in your basket. Remove the section first.`
                });
            }

            // [SECURITY] Initialize session arrays if they don't exist (triggers session save)
            if (!req.session.addedCourses) req.session.addedCourses = [];
            if (!req.session.addedSections) req.session.addedSections = [];

            // Add course
            req.session.addedCourses.push(course);
            console.log(`✓ Added course: ${course}`);

            logActivity(req, 'ADD_COURSE', { course });

            return res.json({
                success: true,
                message: `Course "${course}" added to basket`,
                basket: {
                    courses: req.session.addedCourses,
                    sections: req.session.addedSections
                }
            });
        }

        // Case 2: Adding specific section

        // [SECURITY] Verify section exists and belongs to this course and term
        const sectionExists = await pool.query(
            `SELECT id FROM ${coursesTable} WHERE ${codeCol} = $1 AND section_name = $2 AND (term = $3 OR $3 = '') LIMIT 1`,
            [course, section, currentTerm]
        );

        if (sectionExists.rows.length === 0) {
            logActivity(req, 'SECURITY_ALERT', {
                type: 'INVALID_SECTION',
                course,
                section,
                message: 'Attempted to add non-existent or mismatched section'
            });
            return res.status(404).json({
                success: false,
                error: `Security Alert: Section "${section}" for course "${course}" not found or mismatched.`
            });
        }

        // HEURISTIC: Verify section name contains the course code/name (e.g. COMP101A contains COMP101)
        const normalizedCourse = course.replace(/\s+/g, '').toUpperCase();
        const normalizedSection = section.replace(/\s+/g, '').toUpperCase();

        if (!normalizedSection.includes(normalizedCourse)) {
            logActivity(req, 'SECURITY_ALERT', {
                type: 'HEURISTIC_MISMATCH',
                course,
                section,
                message: 'Section name does not match course code'
            });
            return res.status(400).json({
                success: false,
                error: `Security Alert: Section "${section}" does not seem to belong to course code "${course}".`
            });
        }

        // Check if this specific section already added
        const existingSection = (req.session.addedSections || []).find(
            s => s.course === course && s.section === section
        );

        if (existingSection) {
            return res.status(400).json({
                success: false,
                error: `Section "${section}" of "${course}" is already in your basket`
            });
        }

        // Check if entire course is already added
        if ((req.session.addedCourses || []).includes(course)) {
            return res.status(400).json({
                success: false,
                error: `The entire course "${course}" is already in your basket. Cannot add individual sections.`
            });
        }

        // [SECURITY] Initialize session arrays if they don't exist (triggers session save)
        if (!req.session.addedCourses) req.session.addedCourses = [];
        if (!req.session.addedSections) req.session.addedSections = [];

        // Add section
        req.session.addedSections.push({ course, section });
        console.log(`✓ Added section: ${course} - ${section}`);

        logActivity(req, 'ADD_SECTION', { course, section });

        return res.json({
            success: true,
            message: `Section "${section}" of "${course}" added to basket`,
            basket: {
                courses: req.session.addedCourses,
                sections: req.session.addedSections
            }
        });

    } catch (error) {
        console.error('Add error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

// ============================================
// POST /api/courses/remove
// Remove a course or section from basket
// ============================================
router.post('/remove', (req, res) => {
    try {
        const { course, section } = req.body;

        // Validation
        if (!course) {
            return res.status(400).json({
                success: false,
                error: 'Course name is required'
            });
        }

        // Case 1: Removing entire course
        if (section === null || section === undefined) {

            if (!req.session.addedCourses || !req.session.addedCourses.includes(course)) {
                return res.status(400).json({
                    success: false,
                    error: `Course "${course}" is not in your basket`
                });
            }

            // Remove course
            req.session.addedCourses = req.session.addedCourses.filter(c => c !== course);
            console.log(`✓ Removed course: ${course}`);

            logActivity(req, 'REMOVE_COURSE', { course });

            return res.json({
                success: true,
                message: `Course "${course}" removed from basket`,
                basket: {
                    courses: req.session.addedCourses,
                    sections: req.session.addedSections
                }
            });
        }

        // Case 2: Removing specific section

        if (!req.session.addedSections) {
            return res.status(400).json({
                success: false,
                error: `Section "${section}" of "${course}" is not in your basket`
            });
        }

        const sectionIndex = req.session.addedSections.findIndex(
            s => s.course === course && s.section === section
        );

        if (sectionIndex === -1) {
            return res.status(400).json({
                success: false,
                error: `Section "${section}" of "${course}" is not in your basket`
            });
        }

        // Remove section
        req.session.addedSections.splice(sectionIndex, 1);
        console.log(`✓ Removed section: ${course} - ${section}`);

        logActivity(req, 'REMOVE_SECTION', { course, section });

        return res.json({
            success: true,
            message: `Section "${section}" of "${course}" removed from basket`,
            basket: {
                courses: req.session.addedCourses,
                sections: req.session.addedSections
            }
        });

    } catch (error) {
        console.error('Remove error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

// ============================================
// GET /api/courses/basket
// Get current basket contents
// ============================================
router.get('/basket', (req, res) => {
    try {
        const addedCourses = req.session.addedCourses || [];
        const addedSections = req.session.addedSections || [];
        const totalCourses = addedCourses.length;
        const totalSections = addedSections.length;

        res.json({
            success: true,
            basket: {
                courses: req.session.addedCourses || [],
                sections: req.session.addedSections || [],
                major: req.session.major || null, // Include major info
                totalItems: (req.session.addedCourses?.length || 0) + (req.session.addedSections?.length || 0)
            }
        });

    } catch (error) {
        console.error('Basket error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

// ============================================
// DELETE /api/courses/basket/clear
// Clear entire basket
// ============================================
router.delete('/basket/clear', (req, res) => {
    try {
        req.session.addedCourses = [];
        req.session.addedSections = [];

        console.log('✓ Basket cleared');

        logActivity(req, 'CLEAR_BASKET', {});

        res.json({
            success: true,
            message: 'Basket cleared',
            basket: {
                courses: [],
                sections: [],
                totalItems: 0
            }
        });

    } catch (error) {
        console.error('Clear basket error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

// ============================================
router.post('/major', async (req, res) => {
    try {
        const { major } = req.body;

        // 1. Basic Validation
        if (!major) {
            return res.status(400).json({
                success: false,
                error: 'Major is required'
            });
        }

        // 2. Immutability Check: If major is already set, don't allow change
        if (req.session.major) {
            logActivity(req, 'SECURITY_ALERT', {
                type: 'MAJOR_CHANGE_ATTEMPT',
                original: req.session.major,
                attempted: major,
                message: 'Attempted to change an already set major'
            });
            return res.status(403).json({
                success: false,
                error: 'Major cannot be changed once set'
            });
        }

        // 3. Strict Validation: Check against ALLOWED_MAJORS list
        if (!ALLOWED_MAJORS.includes(major)) {
            logActivity(req, 'SECURITY_ALERT', {
                type: 'INVALID_MAJOR',
                attempted: major,
                message: 'Attempted to set an invalid major'
            });
            return res.status(400).json({
                success: false,
                error: 'Invalid major selected'
            });
        }

        // Set major in session
        req.session.major = major;

        console.log(`🎓 Major set: ${major}`);

        logActivity(req, 'SET_MAJOR', { major });

        res.json({
            success: true,
            message: `Major set to "${major}"`,
            major: req.session.major
        });

    } catch (error) {
        console.error('Major set error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

// ============================================
// GET /api/courses/admin/logs
// View recent activity logs (Debug/Admin tool)
// TODO: Add Admin Authentication/Middleware here before deploying to production!
// ============================================
router.get('/admin/logs', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM activity_logs 
            ORDER BY created_at DESC 
        `);

        res.json({
            success: true,
            count: result.rows.length,
            logs: result.rows
        });
    } catch (error) {
        console.error('Log view error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SAVED BASKETS (MULTI-BASKET SUPPORT)
// ============================================

// POST /api/courses/baskets/save
// Save current session basket with a name
router.post('/baskets/save', (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, error: 'Basket name is required' });
        }

        if (!req.session.savedBaskets) req.session.savedBaskets = {};

        req.session.savedBaskets[name] = {
            courses: req.session.addedCourses || [],
            sections: req.session.addedSections || [],
            savedAt: new Date().toISOString()
        };

        console.log(`💾 Basket saved: ${name}`);
        logActivity(req, 'SAVE_BASKET', { name });

        res.json({
            success: true,
            message: `Basket "${name}" saved`,
            savedBaskets: Object.keys(req.session.savedBaskets)
        });
    } catch (error) {
        console.error('Save basket error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/courses/baskets
// List all saved basket names
router.get('/baskets', (req, res) => {
    try {
        const savedBaskets = req.session.savedBaskets || {};
        const basketList = Object.keys(savedBaskets).map(name => ({
            name,
            courseCount: savedBaskets[name].courses.length,
            sectionCount: savedBaskets[name].sections.length,
            totalItems: savedBaskets[name].courses.length + savedBaskets[name].sections.length,
            savedAt: savedBaskets[name].savedAt
        }));

        res.json({ success: true, baskets: basketList });
    } catch (error) {
        console.error('Get baskets error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/courses/baskets/load
// Replace current session basket with a saved one
router.post('/baskets/load', (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !req.session.savedBaskets || !req.session.savedBaskets[name]) {
            return res.status(404).json({ success: false, error: 'Saved basket not found' });
        }

        const target = req.session.savedBaskets[name];
        req.session.addedCourses = [...target.courses];
        req.session.addedSections = [...target.sections];

        console.log(`📂 Basket loaded: ${name}`);
        logActivity(req, 'LOAD_BASKET', { name });

        res.json({
            success: true,
            message: `Basket "${name}" loaded`,
            basket: {
                courses: req.session.addedCourses,
                sections: req.session.addedSections,
                totalItems: req.session.addedCourses.length + req.session.addedSections.length
            }
        });
    } catch (error) {
        console.error('Load basket error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/courses/baskets/remove
// Delete a saved basket
router.post('/baskets/remove', (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !req.session.savedBaskets || !req.session.savedBaskets[name]) {
            return res.status(404).json({ success: false, error: 'Saved basket not found' });
        }

        delete req.session.savedBaskets[name];
        console.log(`🗑️ Basket removed: ${name}`);
        logActivity(req, 'REMOVE_SAVED_BASKET', { name });

        res.json({
            success: true,
            message: `Basket "${name}" removed`,
            savedBaskets: Object.keys(req.session.savedBaskets)
        });
    } catch (error) {
        console.error('Remove saved basket error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/courses/term
// Get currently active academic term
// ============================================
router.get('/term', async (req, res) => {
    try {
        const result = await pool.query("SELECT value FROM site_settings WHERE key = 'current_term'");
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Term information not found'
            });
        }

        res.json({
            success: true,
            term: result.rows[0].value
        });
    } catch (error) {
        console.error('Term fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

module.exports = router;
