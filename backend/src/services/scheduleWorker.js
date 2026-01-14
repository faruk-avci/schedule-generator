const { parentPort, workerData } = require('worker_threads');

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
 * Generate all possible schedules using optimized backtracking with bitmasks
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
            validSchedules.push([...currentSections]);
            return;
        }

        const courseName = courseNames[courseIndex];
        const sections = Object.values(coursesData[courseName]);

        for (const section of sections) {
            const sectionMask = section.mask;
            let conflict = false;

            for (let d = 0; d < 5; d++) {
                if ((currentMask[d] & sectionMask[d]) !== 0) {
                    conflict = true;
                    break;
                }
            }

            if (!conflict) {
                for (let d = 0; d < 5; d++) {
                    currentMask[d] |= sectionMask[d];
                }
                currentSections.push(section);

                backtrack(courseIndex + 1);

                currentSections.pop();
                for (let d = 0; d < 5; d++) {
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
            course_code: section.course_code,
            course_name: section.course_name,
            section_name: section.section_name,
            lecturer: section.lecturer,
            credits: section.credits
        }));

        const totalCredits = lessons.reduce((sum, lesson) => sum + lesson.credits, 0);

        return {
            lessons: lessons,
            totalCredits: totalCredits,
            matrix: matrix
        };
    });
}

// Execute calculation
try {
    const { filteredCourses } = workerData;
    const allSchedules = generateAllSchedules(filteredCourses);

    // Result object
    const result = {
        totalGenerated: allSchedules.length,
        schedules: []
    };

    if (allSchedules.length > 0) {
        const maxSchedules = 120;
        const limitedSchedules = allSchedules.slice(0, maxSchedules);
        result.schedules = transformSchedules(limitedSchedules);
        result.limited = allSchedules.length > maxSchedules;
    }

    parentPort.postMessage({ success: true, ...result });
} catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
}
