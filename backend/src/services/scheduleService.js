const { Worker } = require('worker_threads');
const path = require('path');
const { sendAlert } = require('./telegramService');
const { pool } = require('../database/db');

// Day name to index mapping
const DAY_INDEX = {
    'Pazartesi': 0,
    'Salı': 1,
    'Çarşamba': 2,
    'Perşembe': 3,
    'Cuma': 4
};
function timeToIndex(timeString) {
    const hour = parseInt(timeString.split(':')[0]);
    return hour - 8;
}

/**
 * Fetch all course data with time slots from database
 */
async function fetchCoursesData(courseCodes, currentTerm) {
    const sanitizedTerm = (currentTerm || '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    let coursesTable = currentTerm ? `courses_${sanitizedTerm}` : 'courses';
    let slotsTable = currentTerm ? `course_time_slots_${sanitizedTerm}` : 'course_time_slots';

    if (currentTerm) {
        const tableCheck = await pool.query("SELECT to_regclass($1)", [coursesTable]);
        if (!tableCheck.rows[0].to_regclass) {
            coursesTable = 'courses';
            slotsTable = 'course_time_slots';
        }
    }

    const colCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = $1
    `, [coursesTable]);
    const cols = colCheck.rows.map(r => r.column_name);

    const hasCourseCode = cols.includes('course_code');
    const codeField = hasCourseCode ? 'c.course_code' : 'c.course_name as course_code';
    const filterField = hasCourseCode ? 'c.course_code' : 'c.course_name';

    const query = `
        SELECT 
            c.id,
            ${codeField},
            c.course_name,
            c.section_name,
            c.lecturer,
            c.credits,
            c.faculty,
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
        WHERE ${filterField} = ANY($1)
        ORDER BY ${filterField}, c.section_name, ts_start.day_of_week
    `;

    const result = await pool.query(query, [courseCodes]);
    return result.rows;
}

/**
 * Organize raw database rows into structured course data
 */
function organizeCourseData(rows, addedCourses, addedSections) {
    const rawCourses = {};

    rows.forEach(row => {
        const courseCode = row.course_code;
        const courseName = row.course_name;
        const sectionName = row.section_name;

        if (!rawCourses[courseCode]) {
            rawCourses[courseCode] = {};
        }

        if (!rawCourses[courseCode][sectionName]) {
            rawCourses[courseCode][sectionName] = {
                id: row.id,
                course_code: courseCode,
                course_name: courseName,
                section_name: sectionName,
                lecturer: row.lecturer,
                credits: parseFloat(row.credits),
                faculty: row.faculty,
                timeSlots: [],
                mask: [0, 0, 0, 0, 0]
            };
        }

        if (row.day_of_week && row.start_time && row.end_time) {
            rawCourses[courseCode][sectionName].timeSlots.push({
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
                        rawCourses[courseCode][sectionName].mask[dayIdx] |= (1 << h);
                    }
                }
            }
        }
    });

    const filteredCourses = {};
    for (const [courseCode, sections] of Object.entries(rawCourses)) {
        if (addedCourses.includes(courseCode)) {
            filteredCourses[courseCode] = sections;
        } else {
            const selectedSections = addedSections
                .filter(s => s.course === courseCode)
                .map(s => s.section);

            if (selectedSections.length > 0) {
                filteredCourses[courseCode] = {};
                selectedSections.forEach(sectionName => {
                    if (sections[sectionName]) {
                        filteredCourses[courseCode][sectionName] = sections[sectionName];
                    }
                });
            }
        }
    }

    return { filteredCourses, rawCourses };
}

function sectionsConflict(s1, s2) {
    for (let d = 0; d < 5; d++) {
        if ((s1.mask[d] & s2.mask[d]) !== 0) {
            return true;
        }
    }
    return false;
}

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
                const isSectionSpecific1 = addedSections.some(s => s.course === course1);
                const isSectionSpecific2 = addedSections.some(s => s.course === course2);

                let suggestion = null;
                if (isSectionSpecific1 || isSectionSpecific2) {
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
}
        }
    }

// --- 3-Way Conflict Detection (if no pairwise found) ---
if (conflicts.length === 0 && courseNames.length >= 3) {
    for (let i = 0; i < courseNames.length; i++) {
        for (let j = i + 1; j < courseNames.length; j++) {
            for (let k = j + 1; k < courseNames.length; k++) {
                const course1 = courseNames[i];
                const course2 = courseNames[j];
                const course3 = courseNames[k];

                const sections1 = Object.values(filteredCourses[course1]);
                const sections2 = Object.values(filteredCourses[course2]);
                const sections3 = Object.values(filteredCourses[course3]);

                let hasCompatibleTrio = false;

                // Check if any combination of s1, s2, s3 exists that works together
                for (const s1 of sections1) {
                    for (const s2 of sections2) {
                        if (sectionsConflict(s1, s2)) continue; // Pair 1-2 bad

                        for (const s3 of sections3) {
                            if (sectionsConflict(s1, s3)) continue; // Pair 1-3 bad
                            if (sectionsConflict(s2, s3)) continue; // Pair 2-3 bad

                            hasCompatibleTrio = true;
                            break;
                        }
                        if (hasCompatibleTrio) break;
                    }
                    if (hasCompatibleTrio) break;
                }

                if (!hasCompatibleTrio) {
                    conflicts.push({
                        type: 'COMPLEX_CONFLICT',
                        courses: [course1, course2, course3],
                        message: `3-Way Time Conflict: No schedule allows taking ${course1}, ${course2}, and ${course3} together.`,
                        suggestion: `One of these 3 courses is blocking the others. Try changing sections or removing one.`
                    });
                    // Return immediately to avoid spamming multiple combinations of the same conflict
                    return conflicts;
                }
            }
        }
    }
}

return conflicts;
}

/**
 * Main schedule generation function (now offloaded to Worker Threads)
 */
async function generateSchedule(addedCourses, addedSections) {
    try {
        if ((!addedCourses || addedCourses.length === 0) &&
            (!addedSections || addedSections.length === 0)) {
            return {
                success: false,
                message: 'No courses in basket',
                totalSchedules: 0,
                schedules: []
            };
        }

        const currentTerm = process.env.CURRENT_TERM || "";
        const allCourseCodes = [
            ...(addedCourses || []),
            ...(addedSections || []).map(s => s.course)
        ];
        const uniqueCourseCodes = [...new Set(allCourseCodes)];

        // Fetch course data from database (still in main thread for DB access)
        const rows = await fetchCoursesData(uniqueCourseCodes, currentTerm);

        if (rows.length === 0) {
            return {
                success: false,
                message: 'No course data found in database',
                totalSchedules: 0,
                schedules: []
            };
        }

        // Organize data
        const { filteredCourses, rawCourses } = organizeCourseData(rows, addedCourses, addedSections);

        // COMBO GUARD pre-check (protect against massive calculations)
        const potentialCombos = Object.values(filteredCourses).reduce(
            (product, sections) => product * Object.keys(sections).length,
            1
        );

        const MAX_POTENTIAL_COMBOS = 1000000;
        console.log(`🔧 Potential combinations: ${potentialCombos.toLocaleString()}`);

        const { initTelegramBot, sendAlert } = require('./telegramService');

        // ... in generateSchedule ...
        if (potentialCombos > MAX_POTENTIAL_COMBOS) {
            // Send Alert to Telegram
            sendAlert(`⚠️ *Combo Guard Triggered*\nPotential Combinations: ${potentialCombos.toLocaleString()}\nUser Basket has too many sections.`);

            return {
                success: false,
                message: `Too many potential combinations (${potentialCombos.toLocaleString()}).`,
                error: 'COMBINATION_OVERLOAD',
                suggestion: 'Please try selecting specific sections for some courses to reduce complexity.',
                totalSchedules: 0,
                schedules: []
            };
        }

        // --- Offload heavy computation to Worker Thread ---
        console.log('🧵 Spawning worker thread for schedule computation...');

        return new Promise((resolve, reject) => {
            const workerPath = path.join(__dirname, 'scheduleWorker.js');
            const worker = new Worker(workerPath, {
                workerData: { filteredCourses }
            });

            worker.on('message', (result) => {
                if (result.success) {
                    if (result.totalGenerated === 0) {
                        const conflicts = detectConflicts(filteredCourses, rawCourses, addedCourses, addedSections);

                        // Fallback for complex (3+ way) conflicts that pairwise detection misses
                        if (conflicts.length === 0) {
                            const courseNames = Object.keys(filteredCourses);
                            conflicts.push({
                                type: 'COMPLEX_CONFLICT',
                                courses: courseNames,
                                message: 'Complex time conflict detected involving multiple courses.',
                                suggestion: 'Try changing sections for one of these courses.'
                            });
                        }

                        resolve({
                            success: true,
                            message: 'No valid schedules found (all combinations have time conflicts)',
                            totalSchedules: 0,
                            schedules: [],
                            conflicts: conflicts
                        });
                    } else {
                        resolve({
                            success: true,
                            totalSchedules: result.schedules.length,
                            totalGenerated: result.totalGenerated,
                            limited: result.limited,
                            schedules: result.schedules
                        });
                    }
                } else {
                    reject(new Error(result.error));
                }
            });

            worker.on('error', (err) => {
                console.error('❌ Worker error:', err);
                reject(err);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`❌ Worker stopped with exit code ${code}`);
                }
            });
        });

    } catch (error) {
        console.error('❌ Schedule generation error:', error);
        throw error;
    }
}

module.exports = { generateSchedule };