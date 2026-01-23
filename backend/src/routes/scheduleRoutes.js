const express = require('express');
const router = express.Router();
const { generateSchedule } = require('../services/scheduleService');
const { logActivity } = require('../services/loggerService');

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
        // Default limit 120, max allow 600 via API
        let limit = req.body.limit ? parseInt(req.body.limit) : 120;
        if (limit > 600) limit = 600; // Hard cap for safety

        const preference = req.body.preference || 'morning';
        const ignoreCoreqs = req.body.ignoreCoreqs === true;

        const result = await generateSchedule(addedCourses, addedSections, limit, preference, ignoreCoreqs);

        if (!result.success) {
            if (result.error === 'MISSING_COREQS') {
                return res.status(409).json(result);
            }
            return res.status(400).json(result);
        }

        if (result.totalSchedules === 0) {
            console.log('⚠️ No schedules found - logging conflicts');
            // Log conflicts for analytics
            logActivity(req, 'GENERATE_CONFLICT', {
                courseCount: addedCourses.length,
                sectionCount: addedSections.length,
                conflicts: result.conflicts || []
            });
        } else {
            console.log(`✅ Successfully generated ${result.totalSchedules} schedules`);
            // Log successful generation activity
            logActivity(req, 'GENERATE_SCHEDULE', {
                courseCount: addedCourses.length,
                sectionCount: addedSections.length,
                schedulesFound: result.totalSchedules,
                limited: result.limited
            });
        }

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