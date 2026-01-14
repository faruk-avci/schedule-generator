const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { logActivity } = require('../services/loggerService');
const { getTableColumns, tableExists } = require('../utils/dbUtils');

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

        // Get current academic term from environment
        const currentTerm = process.env.CURRENT_TERM || "";
        const sanitizedTerm = currentTerm.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        // Use term-specific tables if currentTerm is set, otherwise fallback to main tables
        let coursesTable = currentTerm ? `courses_${sanitizedTerm}` : 'courses';
        let slotsTable = currentTerm ? `course_time_slots_${sanitizedTerm}` : 'course_time_slots';

        // Check if term-specific table exists, fallback to global table if not
        if (currentTerm && !(await tableExists(coursesTable))) {
            coursesTable = 'courses';
            slotsTable = 'course_time_slots';
        }

        // Check for available columns (cached)
        const cols = await getTableColumns(coursesTable);

        const hasCourseCode = cols.includes('course_code');
        const hasTerm = cols.includes('term');
        const hasPrereq = cols.includes('prerequisites');
        const hasCoreq = cols.includes('corequisites');

        const codeField = hasCourseCode ? 'c.course_code' : 'c.course_name as course_code';
        const prereqField = hasPrereq ? 'c.prerequisites' : "'' as prerequisites";
        const coreqField = hasCoreq ? 'c.corequisites' : "'' as corequisites";

        const searchCondition = hasCourseCode
            ? "c.course_code ILIKE $1"
            : "c.course_name ILIKE $1";
        const termCondition = hasTerm ? "AND (c.term = $2 OR $2 = '')" : "";
        const codeColGroup = hasCourseCode ? 'c.course_code' : 'c.course_name';

        // Query database with JSON aggregation: each course is exactly one row
        const query = `
            SELECT 
                ${codeField},
                c.course_name, 
                c.credits,
                c.faculty,
                ${prereqField},
                ${coreqField},
                json_agg(json_build_object(
                    'section_name', c.section_name,
                    'lecturer', c.lecturer,
                    'times', (
                        SELECT json_agg(json_build_object(
                            'day', ts.day_of_week,
                            'start', ts.hour_of_day,
                            'end', CASE 
                                WHEN ts_e.hour_of_day LIKE '%:40' THEN REPLACE(ts_e.hour_of_day, ':40', ':30')
                                ELSE ts_e.hour_of_day
                            END
                        ))
                        FROM ${slotsTable} cts
                        JOIN time_slots ts ON cts.start_time_id = ts.time_id
                        JOIN time_slots ts_e ON cts.end_time_id = ts_e.time_id
                        WHERE cts.course_id = c.id
                    )
                )) as sections
            FROM ${coursesTable} c
            WHERE ${searchCondition} ${termCondition}
            GROUP BY c.course_name, ${codeColGroup}, c.credits, c.faculty, ${prereqField}, ${coreqField}
            ORDER BY ${codeColGroup}
            LIMIT 50;
        `;

        const params = [`%${normalizedInput}%`];
        if (hasTerm) {
            params.push(currentTerm);
        }

        const result = await pool.query(query, params);

        // Database response is already grouped: Map to clean objects
        const courses = result.rows.map(row => ({
            course_code: row.course_code,
            course_name: row.course_name,
            credits: row.credits,
            faculty: row.faculty,
            prerequisites: row.prerequisites,
            corequisites: row.corequisites,
            sections: (row.sections || []).map(s => ({
                ...s,
                times: s.times || []
            }))
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

        // Get current academic term from environment
        const currentTerm = process.env.CURRENT_TERM || "";
        const sanitizedTerm = currentTerm.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        let coursesTable = currentTerm ? `courses_${sanitizedTerm}` : 'courses';

        // Check if term-specific table exists, fallback to global table if not
        if (currentTerm && !(await tableExists(coursesTable))) {
            coursesTable = 'courses';
        }

        // Get available columns (cached)
        const cols = await getTableColumns(coursesTable);
        const hasCourseCode = cols.includes('course_code');
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
        const currentTerm = process.env.CURRENT_TERM || '';
        if (!currentTerm) {
            return res.status(404).json({
                success: false,
                error: 'Term information not found'
            });
        }

        res.json({
            success: true,
            term: currentTerm
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
