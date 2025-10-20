const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

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

        console.log('🔍 Searching for courses:', courseName);

        // Query database with time information
        const query = `
            SELECT 
                c.course_name, 
                c.credits, 
                c.section_name, 
                c.lecturer,
                c.description,
                c.id as course_id,
                ts_start.day_of_week,
                ts_start.hour_of_day as start_time,
                CASE 
                    WHEN ts_end.hour_of_day LIKE '%:40' THEN 
                        REPLACE(ts_end.hour_of_day, ':40', ':30')
                ELSE 
                    ts_end.hour_of_day
                END as end_time
            FROM courses c
            LEFT JOIN course_time_slots cts ON c.id = cts.course_id
            LEFT JOIN time_slots ts_start ON cts.start_time_id = ts_start.time_id
            LEFT JOIN time_slots ts_end ON cts.end_time_id = ts_end.time_id
            WHERE c.course_name ILIKE $1
            ORDER BY c.course_name, c.section_name, ts_start.day_of_week, ts_start.hour_of_day
        `;

        const result = await pool.query(query, [`%${courseName}%`]);
        
        // Group sections by course name and include time slots
        const courseMap = new Map();
        
        result.rows.forEach(row => {
            if (!courseMap.has(row.course_name)) {
                courseMap.set(row.course_name, {
                    course_name: row.course_name,
                    credits: row.credits,
                    description: row.description,
                    sections: new Map()
                });
            }
            
            const course = courseMap.get(row.course_name);
            
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
            course_name: course.course_name,
            credits: course.credits,
            description: course.description,
            sections: Array.from(course.sections.values())
        }));


        console.log(`✓ Found ${courses.length} courses with ${result.rows.length} total sections`);

        res.json({ 
            success: true,
            count: courses.length,
            courses: courses 
        });

    } catch (error) {
        console.error('❌ Search error:', error);
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
router.post('/add', (req, res) => {
    try {
        const { course, section } = req.body;

        // Validation
        if (!course) {
            return res.status(400).json({ 
                success: false,
                error: 'Course name is required' 
            });
        }

        // Case 1: Adding entire course (section is null)
        if (section === null || section === undefined) {
            
            // Check if course already added
            if (req.session.addedCourses.includes(course)) {
                return res.status(400).json({ 
                    success: false,
                    error: `Course "${course}" is already in your basket` 
                });
            }

            // Check if any section of this course is already added
            const hasSection = req.session.addedSections.some(s => s.course === course);
            if (hasSection) {
                return res.status(400).json({ 
                    success: false,
                    error: `A section of "${course}" is already in your basket. Remove the section first.` 
                });
            }

            // Add course
            req.session.addedCourses.push(course);
            console.log(`✓ Added course: ${course}`);
            
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
        
        // Check if this specific section already added
        const existingSection = req.session.addedSections.find(
            s => s.course === course && s.section === section
        );
        
        if (existingSection) {
            return res.status(400).json({ 
                success: false,
                error: `Section "${section}" of "${course}" is already in your basket` 
            });
        }

        // Check if entire course is already added
        if (req.session.addedCourses.includes(course)) {
            return res.status(400).json({ 
                success: false,
                error: `The entire course "${course}" is already in your basket. Cannot add individual sections.` 
            });
        }

        // Add section
        req.session.addedSections.push({ course, section });
        console.log(`✓ Added section: ${course} - ${section}`);
        
        return res.json({ 
            success: true, 
            message: `Section "${section}" of "${course}" added to basket`,
            basket: {
                courses: req.session.addedCourses,
                sections: req.session.addedSections
            }
        });

    } catch (error) {
        console.error('❌ Add error:', error);
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
            
            if (!req.session.addedCourses.includes(course)) {
                return res.status(400).json({ 
                    success: false,
                    error: `Course "${course}" is not in your basket` 
                });
            }

            // Remove course
            req.session.addedCourses = req.session.addedCourses.filter(c => c !== course);
            console.log(`✓ Removed course: ${course}`);
            
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
        
        return res.json({ 
            success: true, 
            message: `Section "${section}" of "${course}" removed from basket`,
            basket: {
                courses: req.session.addedCourses,
                sections: req.session.addedSections
            }
        });

    } catch (error) {
        console.error('❌ Remove error:', error);
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
        const totalCourses = req.session.addedCourses.length;
        const totalSections = req.session.addedSections.length;
        
        res.json({
            success: true,
            basket: {
                courses: req.session.addedCourses,
                sections: req.session.addedSections,
                totalItems: totalCourses + totalSections
            }
        });

    } catch (error) {
        console.error('❌ Basket error:', error);
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
        console.error('❌ Clear basket error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error',
            message: error.message 
        });
    }
});

module.exports = router;