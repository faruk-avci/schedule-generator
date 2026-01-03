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
            c.faculty,
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
 * AND pre-calculate bitmasks for each section
 */
function organizeCourseData(rows, addedCourses, addedSections) {
    const rawCourses = {};

    rows.forEach(row => {
        const courseName = row.course_name;
        const sectionName = row.section_name;

        if (!rawCourses[courseName]) {
            rawCourses[courseName] = {};
        }

        if (!rawCourses[courseName][sectionName]) {
            rawCourses[courseName][sectionName] = {
                id: row.id,
                course_name: courseName,
                section_name: sectionName,
                lecturer: row.lecturer,
                credits: parseFloat(row.credits),
                faculty: row.faculty,
                description: row.description,
                timeSlots: [],
                mask: [0, 0, 0, 0, 0]
            };
        }

        if (row.day_of_week && row.start_time && row.end_time) {
            rawCourses[courseName][sectionName].timeSlots.push({
                day: row.day_of_week,
                startTime: row.start_time,
                endTime: row.end_time
            });

            const dayIdx = DAY_INDEX[row.day_of_week];
            if (dayIdx !== undefined) {
                const startIdx = timeToIndex(row.start_time);
                const endIdx = timeToIndex(row.end_time);

                for (let h = startIdx; h < endIdx; h++) {
                    if (h >= 0 && h < 13) {
                        rawCourses[courseName][sectionName].mask[dayIdx] |= (1 << h);
                    }
                }
            }
        }
    });

    const filteredCourses = {};
    for (const [courseName, sections] of Object.entries(rawCourses)) {
        if (addedCourses.includes(courseName)) {
            filteredCourses[courseName] = sections;
        } else {
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

    return { filteredCourses, rawCourses };
}

/**
 * Helper to check if two sections conflict
 */
function sectionsConflict(s1, s2) {
    for (let d = 0; d < 5; d++) {
        if ((s1.mask[d] & s2.mask[d]) !== 0) {
            return true;
        }
    }
    return false;
}

/**
 * Detect why no schedules could be generated
 */
function detectConflicts(filteredCourses, rawCourses, addedCourses, addedSections) {
    const courseNames = Object.keys(filteredCourses);
    const conflicts = [];

    for (let i = 0; i < courseNames.length; i++) {
        for (let j = i + 1; j < courseNames.length; j++) {
            const course1 = courseNames[i];
            const course2 = courseNames[j];

            const sections1 = Object.values(filteredCourses[course1]);
            const sections2 = Object.values(filteredCourses[course2]);

            let hasCompatiblePair = false;
            for (const s1 of sections1) {
                for (const s2 of sections2) {
                    if (!sectionsConflict(s1, s2)) {
                        hasCompatiblePair = true;
                        break;
                    }
                }
                if (hasCompatiblePair) break;
            }

            if (!hasCompatiblePair) {
                // If they conflict, check if it's because the user picked specific sections
                const isSectionSpecific1 = addedSections.some(s => s.course === course1);
                const isSectionSpecific2 = addedSections.some(s => s.course === course2);

                let suggestion = null;
                if (isSectionSpecific1 || isSectionSpecific2) {
                    // Check if other sections of these courses would work
                    const allSections1 = Object.values(rawCourses[course1]);
                    const allSections2 = Object.values(rawCourses[course2]);

                    let alternativeExists = false;
                    for (const s1 of allSections1) {
                        for (const s2 of allSections2) {
                            if (!sectionsConflict(s1, s2)) {
                                alternativeExists = true;
                                break;
                            }
                        }
                        if (alternativeExists) break;
                    }

                    if (alternativeExists) {
                        suggestion = `Try adding the whole course '${isSectionSpecific1 ? course1 : course2}' instead of a specific section to see more options.`;
                    }
                }

                conflicts.push({
                    type: 'COURSE_CONFLICT',
                    courses: [course1, course2],
                    message: `${course1} and ${course2} are blocking each other.`,
                    suggestion: suggestion
                });
            }
        }
    }

    return conflicts;
}

/**
 * Generate all possible schedules using optimized backtracking with bitmasks
 * Returns array of Arrays of Sections
 */
function generateAllSchedules(coursesData) {
    const courseNames = Object.keys(coursesData);
    const validSchedules = [];

    // Current state of the schedule (5 integers, representing filled slots)
    const currentMask = [0, 0, 0, 0, 0];

    // Stack of sections in the current schedule
    const currentSections = [];

    function backtrack(courseIndex) {
        // Base case: all courses processed
        if (courseIndex === courseNames.length) {
            // Push a shallow copy of the sections list
            validSchedules.push([...currentSections]);
            return;
        }

        const courseName = courseNames[courseIndex];
        const sections = Object.values(coursesData[courseName]);

        // Try each section of current course
        for (const section of sections) {
            const sectionMask = section.mask;
            let conflict = false;

            // 1. Bitwise Conflict Check
            for (let d = 0; d < 5; d++) {
                if ((currentMask[d] & sectionMask[d]) !== 0) {
                    conflict = true;
                    break;
                }
            }

            if (!conflict) {
                // 2. Add Section (Update Masks In-Place)
                for (let d = 0; d < 5; d++) {
                    currentMask[d] |= sectionMask[d];
                }
                currentSections.push(section);

                // 3. Recurse
                backtrack(courseIndex + 1);

                // 4. Backtrack (Undo Changes)
                currentSections.pop();
                for (let d = 0; d < 5; d++) {
                    // XOR removes the bits we just added since we know they didn't exist before
                    currentMask[d] ^= sectionMask[d];
                }
            }
        }
    }

    backtrack(0);

    return validSchedules;
}

/**
 * Reconstruct 5x13 Matrix from a list of sections
 * Used for frontend visualization compatibility
 */
function createMatrixFromSections(sections) {
    const matrix = Array(5).fill(null).map(() => Array(13).fill(0));

    for (const section of sections) {
        for (const slot of section.timeSlots) {
            const dayIndex = DAY_INDEX[slot.day];
            if (dayIndex === undefined) continue;

            const startIndex = timeToIndex(slot.startTime);
            const endIndex = timeToIndex(slot.endTime);

            for (let hour = startIndex; hour < endIndex; hour++) {
                if (hour >= 0 && hour < 13) {
                    matrix[dayIndex][hour] = section.id;
                }
            }
        }
    }
    return matrix;
}

/**
 * Transform schedule lists into readable format with matrix
 */
function transformSchedules(scheduleLists) {
    return scheduleLists.map(sections => {
        const matrix = createMatrixFromSections(sections);

        const lessons = sections.map(section => ({
            id: section.id,
            course_name: section.course_name,
            section_name: section.section_name,
            lecturer: section.lecturer,
            credits: section.credits,
            description: section.description
        }));

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
async function generateSchedule(addedCourses, addedSections, preferences = {}) {
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

        // Organize data (calculates bitmasks internally)
        const { filteredCourses, rawCourses } = organizeCourseData(rows, addedCourses, addedSections);

        // Log what we're working with
        const totalSections = Object.values(filteredCourses).reduce(
            (sum, sections) => sum + Object.keys(sections).length,
            0
        );
        console.log(`🔧 Processing ${Object.keys(filteredCourses).length} courses with ${totalSections} sections`);

        // Generate all possible schedules (returns list of sections)
        const allSchedules = generateAllSchedules(filteredCourses);

        console.log(`✨ Generated ${allSchedules.length} possible schedules`);

        if (allSchedules.length === 0) {
            const conflicts = detectConflicts(filteredCourses, rawCourses, addedCourses, addedSections);
            return {
                success: true,
                message: 'No valid schedules found (all combinations have time conflicts)',
                totalSchedules: 0,
                schedules: [],
                conflicts: conflicts
            };
        }

        // ============================================================
        // SCORING & SORTING ALGORITHM
        // ============================================================
        const { morning = 0, freeDays = false } = preferences || {};

        // Weights for morning slots (0=8:40, 1=9:40, 2=10:40, 3=11:40)
        const MORNING_WEIGHTS = {
            0: 1.0, // 8:40 - Highest impact
            1: 0.8, // 9:40
            2: 0.6, // 10:40
            3: 0.4  // 11:40
        };

        const scoredSchedules = allSchedules.map(schedule => {
            let score = 0;
            const daysWithClasses = new Set();
            let morningScore = 0;

            schedule.forEach(section => {
                section.timeSlots.forEach(slot => {
                    const dayIdx = DAY_INDEX[slot.day];
                    if (dayIdx !== undefined) daysWithClasses.add(dayIdx);

                    const startIdx = timeToIndex(slot.startTime);

                    // Morning Preference Calculation
                    if (startIdx <= 3) {
                        // If user wants Morning (1), Add score. If Afternoon (-1), Subtract score.
                        // If Balanced (0), this part is 0.
                        const weight = MORNING_WEIGHTS[startIdx] || 0;
                        if (morning === 1) score += (weight * 10);      // Bonus for early
                        else if (morning === -1) score -= (weight * 10); // Penalty for early
                    }
                });
            });

            // Free Days Preference (High impact)
            if (freeDays) {
                const emptyDays = 5 - daysWithClasses.size;
                score += (emptyDays * 50); // Huge bonus for full free days
            }

            return { schedule, score };
        });

        // Sort by Score Descending
        scoredSchedules.sort((a, b) => b.score - a.score);

        // Extract back to clean list
        const sortedSchedules = scoredSchedules.map(item => item.schedule);

        // Limit number of schedules
        const maxSchedules = 120;
        const limitedSchedules = sortedSchedules.slice(0, maxSchedules);

        if (allSchedules.length > maxSchedules) {
            console.log(`⚠️  Limited to ${maxSchedules} schedules (from ${allSchedules.length})`);
        }

        // Transform to readable format (rebuilds matrices for frontend)
        const transformedSchedules = transformSchedules(limitedSchedules);

        return {
            success: true,
            totalSchedules: transformedSchedules.length,
            totalGenerated: allSchedules.length,
            limited: allSchedules.length > maxSchedules,
            schedules: transformedSchedules
        };

    } catch (error) {
        console.error('❌ Schedule generation error:', error);
        throw error;
    }
}

module.exports = { generateSchedule };