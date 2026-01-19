const XLSX = require('xlsx');
const { pool } = require('../database/db');
const { logActivity } = require('./loggerService');

/**
 * Service to handle importing course data from Excel files
 */
const importService = {
    /**
     * Parse Excel file and import courses into database
     * @param {string} filePath - Path to the uploaded Excel file
     * @param {string} term - Academic term (e.g. "2024-2025 Fall")
     * @returns {Object} Result summary with success/fail counts and logs
     */
    async importFromExcel(filePath, term) {
        const results = {
            success: 0,
            failed: 0,
            logs: [],
            total: 0
        };

        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            results.total = data.length;

            const sanitizedTerm = term.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const coursesTable = `courses_${sanitizedTerm}`;
            const slotsTable = `course_time_slots_${sanitizedTerm}`;

            const setupClient = await pool.connect();
            try {
                // Ensure tables exist for this term
                await setupClient.query(`
                    CREATE TABLE IF NOT EXISTS ${coursesTable} (LIKE courses INCLUDING ALL);
                    CREATE TABLE IF NOT EXISTS ${slotsTable} (LIKE course_time_slots INCLUDING ALL);
                `);
            } finally {
                setupClient.release();
            }

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const client = await pool.connect();

                try {
                    await client.query('BEGIN');

                    // Extract data based on the observed structure
                    const subject = row['SUBJECT'] || '';
                    const courseNo = row['COURSENO'] || '';
                    const sectionNo = row['SECTIONNO'] || '';
                    const title = row['TITLE'] || '';
                    const faculty = row['FACULTY'] || 'Unknown';
                    const credits = parseFloat(row['CREDITS']) || 0;
                    const lecturer = row['INSTRUCTORFULLNAME'] || 'TBA';
                    const description = row['DESCRIPTION'] || '';
                    const prerequisites = row['PREREQUISITE'] || '';
                    const corequisites = row['COREQUISITE'] || '';
                    const timeInfo = row['SCHEDULEFORPRINT'] || '';

                    if (!subject || !courseNo) {
                        throw new Error('Missing SUBJECT or COURSENO');
                    }

                    const courseCode = `${subject}${courseNo}`;
                    const courseName = title;
                    const sectionName = `${subject}${courseNo}${sectionNo}`;

                    // 1. Calculate required hours (mimicking database.py logic)
                    let requiredHours = 0;
                    const timeSlots = [...new Set(timeInfo.trim().split('\n').filter(t => t.includes('|')))];

                    timeSlots.forEach(slot => {
                        const [day, hourPart] = slot.split('|').map(s => s.trim());
                        const [start, end] = hourPart.split('-').map(s => s.trim());
                        const startHour = parseInt(start.substring(0, 2));
                        const endHour = parseInt(end.substring(0, 2));
                        requiredHours += (endHour - startHour);
                    });

                    // 2. Insert Course
                    const courseInsertRes = await client.query(
                        `INSERT INTO ${coursesTable} (course_code, course_name, section_name, faculty, description, credits, lecturer, required, term, prerequisites, corequisites)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                         RETURNING id`,
                        [courseCode, courseName, sectionName, faculty, description, credits, lecturer, requiredHours, term, prerequisites, corequisites]
                    );
                    const courseId = courseInsertRes.rows[0].id;

                    // 3. Insert Time Slots
                    for (const slot of timeSlots) {
                        const [day, hourPart] = slot.split('|').map(s => s.trim());

                        const targetDay = day.trim();

                        // Parse time parts
                        const [startRaw, endRaw] = hourPart.split('-').map(s => s.trim());

                        // Validation: Start time must end with :40
                        if (!startRaw.endsWith(':40')) {
                            // Optionally log this skip
                            continue;
                        }

                        // Determine target end time string for matching the DB (X:30 -> X:40)
                        let targetEndRaw = endRaw;
                        if (endRaw.endsWith(':30')) {
                            const prefix = endRaw.split(':')[0];
                            targetEndRaw = `${prefix}:40`;
                        } else if (!endRaw.endsWith(':40')) {
                            continue; // Skip if not 30 or 40
                        }

                        // Lookup IDs from DB
                        const timeQuery = `
                            SELECT time_id FROM time_slots 
                            WHERE day_of_week = $1 AND hour_of_day = $2
                        `;

                        const startRes = await client.query(timeQuery, [targetDay, startRaw]);
                        const endRes = await client.query(timeQuery, [targetDay, targetEndRaw]);

                        if (startRes.rows.length > 0 && endRes.rows.length > 0) {
                            const startTimeId = startRes.rows[0].time_id;
                            const endTimeId = endRes.rows[0].time_id;

                            await client.query(
                                `INSERT INTO ${slotsTable} (course_id, start_time_id, end_time_id)
                                 VALUES ($1, $2, $3)`,
                                [courseId, startTimeId, endTimeId]
                            );
                        } else {
                            // Log missing slot if needed
                            // console.warn(`Missing slot for ${courseCode}: ${targetDay} ${startRaw}-${targetEndRaw}`);
                        }
                    }

                    await client.query('COMMIT');
                    results.success++;

                } catch (error) {
                    await client.query('ROLLBACK');
                    results.failed++;
                    results.logs.push({
                        row: i + 2, // 1-indexed + header
                        course: `${row['SUBJECT']} ${row['COURSENO']}`,
                        error: error.message
                    });
                } finally {
                    client.release();
                }
            }

            return results;

        } catch (error) {
            console.error('Import Service Error:', error);
            throw error;
        }
    }
};

module.exports = importService;
