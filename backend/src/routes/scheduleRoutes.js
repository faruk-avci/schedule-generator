const express = require('express');
const router = express.Router();
const { generateSchedule } = require('../services/scheduleService');

/**
 * POST /api/schedule/generate
 * Generate all possible schedules from basket
 */
router.post('/generate', async (req, res) => {
    try {
        const addedCourses = req.session.addedCourses || [];
        const addedSections = req.session.addedSections || [];

        // Validation
        if (addedCourses.length === 0 && addedSections.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Basket is empty. Please add courses first.'
            });
        }

        console.log('🎯 Generating schedules...');
        console.log('   Courses:', addedCourses);
        console.log('   Sections:', addedSections);

        // Generate schedules
        const result = await generateSchedule(addedCourses, addedSections);

        if (!result.success) {
            return res.status(400).json(result);
        }

        console.log(`✅ Successfully generated ${result.totalSchedules} schedules`);

        res.json(result);

    } catch (error) {
        console.error('❌ Schedule generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate schedules',
            message: error.message
        });
    }
});

/**
 * GET /api/schedule/info
 * Get information about current basket for schedule generation
 */
router.get('/info', async (req, res) => {
    try {
        const addedCourses = req.session.addedCourses || [];
        const addedSections = req.session.addedSections || [];

        const totalItems = addedCourses.length + addedSections.length;

        res.json({
            success: true,
            basket: {
                courses: addedCourses,
                sections: addedSections,
                totalItems: totalItems
            },
            canGenerate: totalItems > 0,
            message: totalItems === 0 ? 'Add courses to generate schedules' : 'Ready to generate schedules'
        });

    } catch (error) {
        console.error('❌ Error getting schedule info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get schedule info',
            message: error.message
        });
    }
});

module.exports = router;