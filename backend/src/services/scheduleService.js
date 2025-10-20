const { pool } = require('../database/db');

// Day name to index mapping
const DAY_INDEX = {
    'Pazartesi': 0,
    'Salı': 1,
    'Çarşamba': 2,
    'Perşembe': 3,
    'Cuma': 4
};

// Time to hour index (8:40 -> 0, 9:40 -> 1, etc.)
function timeToIndex(timeString) {
    const hour = parseInt(timeString.split(':')[0]);
    return hour - 8;
}

/**
 * Fetch all course data with time slots from database
 */
async function fetchCoursesData(courseNames) {
    const query = `
        SELECT 
            c.id,
            c.course_name,
            c.section_name,
            c.lecturer,
            c.credits,
            c.description,
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
        WHERE c.course_name = ANY($1)
        ORDER BY c.course_name, c.section_name, ts_start.day_of_week
    `;

    const result = await pool.query(query, [courseNames]);
    return result.rows;
}

/**
 * Organize raw database rows into structured course data
 */
function organizeCourseData(rows, addedCourses, addedSections) {
    const courses = {};

    rows.forEach(row => {
        const courseName = row.course_name;
        const sectionName = row.section_name;

        // Initialize course
        if (!courses[courseName]) {
            courses[courseName] = {};
        }

        // Initialize section
        if (!courses[courseName][sectionName]) {
            courses[courseName][sectionName] = {
                id: row.id,
                course_name: courseName,
                section_name: sectionName,
                lecturer: row.lecturer,
                credits: parseFloat(row.credits),
                description: row.description,
                timeSlots: []
            };
        }

        // Add time slot if exists
        if (row.day_of_week && row.start_time && row.end_time) {
            courses[courseName][sectionName].timeSlots.push({
                day: row.day_of_week,
                startTime: row.start_time,
                endTime: row.end_time
            });
        }
    });

    // Filter sections based on user selection
    const filteredCourses = {};

    for (const [courseName, sections] of Object.entries(courses)) {
        // If entire course added, keep all sections
        if (addedCourses.includes(courseName)) {
            filteredCourses[courseName] = sections;
        } else {
            // Only keep specific sections user selected
            const selectedSections = addedSections
                .filter(s => s.course === courseName)
                .map(s => s.section);

            if (selectedSections.length > 0) {
                filteredCourses[courseName] = {};
                selectedSections.forEach(sectionName => {
                    if (sections[sectionName]) {
                        filteredCourses[courseName][sectionName] = sections[sectionName];
                    }
                });
            }
        }
    }

    return filteredCourses;
}

/**
 * Create empty schedule matrix (5 days x 13 hours)
 */
function createEmptyMatrix() {
    return Array(5).fill(null).map(() => Array(13).fill(0));
}

/**
 * Check if a section can be added to schedule without conflicts
 */
function hasConflict(matrix, section) {
    for (const slot of section.timeSlots) {
        const dayIndex = DAY_INDEX[slot.day];
        if (dayIndex === undefined) continue;

        const startIndex = timeToIndex(slot.startTime);
        const endIndex = timeToIndex(slot.endTime);

        // Check each hour in the time range
        for (let hour = startIndex; hour < endIndex; hour++) {
            if (hour < 0 || hour >= 13) continue; // Out of bounds
            if (matrix[dayIndex][hour] !== 0) {
                return true; // Conflict found
            }
        }
    }

    return false; // No conflict
}

/**
 * Add a section to the schedule matrix
 */
function addToMatrix(matrix, section) {
    const newMatrix = matrix.map(row => [...row]);

    for (const slot of section.timeSlots) {
        const dayIndex = DAY_INDEX[slot.day];
        if (dayIndex === undefined) continue;

        const startIndex = timeToIndex(slot.startTime);
        const endIndex = timeToIndex(slot.endTime);

        for (let hour = startIndex; hour < endIndex; hour++) {
            if (hour >= 0 && hour < 13) {
                newMatrix[dayIndex][hour] = section.id;
            }
        }
    }

    return newMatrix;
}

/**
 * Generate all possible schedules using backtracking
 */
function generateAllSchedules(coursesData) {
    const courseNames = Object.keys(coursesData);
    const schedules = [];

    function backtrack(courseIndex, currentMatrix) {
        // Base case: all courses processed
        if (courseIndex === courseNames.length) {
            schedules.push(currentMatrix);
            return;
        }

        const courseName = courseNames[courseIndex];
        const sections = Object.values(coursesData[courseName]);

        // Try each section of current course
        for (const section of sections) {
            // Check if this section conflicts
            if (!hasConflict(currentMatrix, section)) {
                // Add section and continue with next course
                const newMatrix = addToMatrix(currentMatrix, section);
                backtrack(courseIndex + 1, newMatrix);
            }
        }
    }

    // Start backtracking with empty schedule
    backtrack(0, createEmptyMatrix());

    return schedules;
}

/**
 * Transform schedule matrices into readable format
 */
function transformSchedules(schedules, coursesData) {
    // Create id to section info mapping
    const idMap = {};
    for (const sections of Object.values(coursesData)) {
        for (const section of Object.values(sections)) {
            idMap[section.id] = {
                course_name: section.course_name,
                section_name: section.section_name,
                lecturer: section.lecturer,
                credits: section.credits,
                description: section.description
            };
        }
    }

    return schedules.map(matrix => {
        const lessons = [];
        const seenIds = new Set();

        matrix.forEach((day, dayIndex) => {
            day.forEach((cellId, hourIndex) => {
                if (cellId !== 0 && !seenIds.has(cellId)) {
                    seenIds.add(cellId);
                    const info = idMap[cellId];
                    if (info) {
                        lessons.push({
                            ...info,
                            id: cellId
                        });
                    }
                }
            });
        });

        // Calculate total credits
        const totalCredits = lessons.reduce((sum, lesson) => sum + lesson.credits, 0);

        return {
            lessons: lessons,
            totalCredits: totalCredits,
            matrix: matrix // Include matrix for frontend visualization
        };
    });
}

/**
 * Main schedule generation function
 */
async function generateSchedule(addedCourses, addedSections) {
    try {
        // Validate input
        if ((!addedCourses || addedCourses.length === 0) && 
            (!addedSections || addedSections.length === 0)) {
            return {
                success: false,
                message: 'No courses in basket',
                totalSchedules: 0,
                schedules: []
            };
        }

        // Get all unique course names
        const allCourseNames = [
            ...(addedCourses || []),
            ...(addedSections || []).map(s => s.course)
        ];
        const uniqueCourseNames = [...new Set(allCourseNames)];

        console.log('📚 Generating schedules for:', uniqueCourseNames);

        // Fetch course data from database
        const rows = await fetchCoursesData(uniqueCourseNames);

        if (rows.length === 0) {
            return {
                success: false,
                message: 'No course data found in database',
                totalSchedules: 0,
                schedules: []
            };
        }

        console.log(`📊 Fetched ${rows.length} course time slots from database`);

        // Organize data
        const coursesData = organizeCourseData(rows, addedCourses, addedSections);
        
        // Log what we're working with
        const totalSections = Object.values(coursesData).reduce(
            (sum, sections) => sum + Object.keys(sections).length, 
            0
        );
        console.log(`🔧 Processing ${Object.keys(coursesData).length} courses with ${totalSections} sections`);

        // Generate all possible schedules
        const scheduleMatrices = generateAllSchedules(coursesData);

        console.log(`✨ Generated ${scheduleMatrices.length} possible schedules`);

        if (scheduleMatrices.length === 0) {
            return {
                success: true,
                message: 'No valid schedules found (all combinations have time conflicts)',
                totalSchedules: 0,
                schedules: []
            };
        }

        // Limit number of schedules
        const maxSchedules = 120;
        const limitedSchedules = scheduleMatrices.slice(0, maxSchedules);

        if (scheduleMatrices.length > maxSchedules) {
            console.log(`⚠️  Limited to ${maxSchedules} schedules (generated ${scheduleMatrices.length})`);
        }

        // Transform to readable format
        const transformedSchedules = transformSchedules(limitedSchedules, coursesData);

        return {
            success: true,
            totalSchedules: transformedSchedules.length,
            totalGenerated: scheduleMatrices.length,
            limited: scheduleMatrices.length > maxSchedules,
            schedules: transformedSchedules
        };

    } catch (error) {
        console.error('❌ Schedule generation error:', error);
        throw error;
    }
}

module.exports = { generateSchedule };