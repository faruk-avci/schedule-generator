const mysql = require('mysql2'); // MySQL Connection
const math = require('mathjs');  // Matrix Operations
const { ConstantMatrixOverlapError } = require('./error');

const DAYS_OF_WEEK = {
    'Pazartesi': 0,
    'Salı': 1,
    'Çarşamba': 2,
    'Perşembe': 3,
    'Cuma': 4
};

async function regulate(courses, sections) {
    const regulated = {};
    courses.forEach(course => {
        regulated[course] = ["all"];
    });
    sections.forEach(section => {
        if (!(section.course in regulated)) {
            regulated[section.course] = [section.section];
        } else {
            regulated[section.course].push(section.section);
        }
    });
    return regulated;
}

async function get_lessons_from_db(lessons) {
    const pool = mysql.createPool({
        host: "localhost",
        user: "root",
        password: "1234",
        database: "ozu2",
        connectionLimit: 10
    });

    const db = pool.promise();
    var all_courses = {}

    try {
        for (const lesson of lessons){
            const [rows] = await db.execute(`
                SELECT 
                    c.course_name,
                    c.section_name,   
                    c.lecturer,
                    c.credits,
                    c.required,
                    ts_start.day_of_week AS start_day,
                    ts_start.hour_of_day AS start_hour,
                    ts_end.hour_of_day AS end_hour,
                    c.id
                FROM
                    course_time_slots cts
                JOIN
                    time_slots ts_start ON cts.start_time_id = ts_start.time_id
                JOIN
                    time_slots ts_end ON cts.end_time_id = ts_end.time_id
                JOIN
                    courses c ON cts.course_id = c.id
                WHERE
                    c.course_name = ?
            `, [lesson]);
            all_courses[lesson] = rows;
        }
        return all_courses;
    } catch (err) {
        console.error("Database error:", err);
    } finally {
        // Always close the pool when done
        pool.end();
    }
}

async function course_to_sections(regulated,all_courses) {
    var course_to_section = {}
    for(const [course_name, sections] of Object.entries(all_courses)){
        const sections = all_courses[course_name];
        if(regulated[course_name]=="all"){
            for(const section of sections){
                const section_namee = section["section_name"];
                if(!(course_name in course_to_section)){
                    course_to_section[course_name] = {}
                }
                if(!(section_namee in course_to_section[course_name])){
                    course_to_section[course_name][section_namee] = {
                        "course_name": course_name,
                        "section_name": section_namee,
                        "id" : section["id"],
                        "lecturer": section["lecturer"],
                        "credits": section["credits"],
                        "required": section["required"],
                        "times": {}
                    }
                }
                const day_of_week = section["start_day"];
                const start_h = section["start_hour"];
                const end_h = section["end_hour"];

                if(!(day_of_week in course_to_section[course_name][section_namee]["times"])){
                    course_to_section[course_name][section_namee]["times"][day_of_week] = [];
                }
                course_to_section[course_name][section_namee]["times"][day_of_week].push(start_h, end_h);
            }
        }
        else{
            for(const section of sections){
                const section_namee = section["section_name"];
                for(inside of regulated[course_name]){ 
                    if(inside == section_namee){ 
                        if(!(course_name in course_to_section)){
                            course_to_section[course_name] = {}
                        }
                        if(!(section_namee in course_to_section[course_name])){
                            course_to_section[course_name][section_namee] = {
                                "course_name": course_name,
                                "section_name": section_namee,
                                "id": section["id"],
                                "lecturer": section["lecturer"],
                                "credits": section["credits"],
                                "required": section["required"],
                                "times": {},
                            }
                        }
                        const day_of_week = section["start_day"];
                        const start_h = section["start_hour"];
                        const end_h = section["end_hour"];

                        if(!(day_of_week in course_to_section[course_name][section_namee]["times"])){
                            course_to_section[course_name][section_namee]["times"][day_of_week] = [];
                        }
                        course_to_section[course_name][section_namee]["times"][day_of_week].push(start_h, end_h);
                    }
                }
            }
        }
    }
    // console.dir(course_to_section, { depth: null });
    return course_to_section;
}

async function generate_constant_matrix(grouped_sections) {

    let c_matrix = math.zeros([5,13]);
    for(const course in grouped_sections){
        const sections = Object.keys(grouped_sections[course]);
        if(sections.length === 1){
            
            const times = grouped_sections[course][sections]["times"];
            
            for (const day in times) {
                
                const time = times[day];
                const start_hour = parseInt(time[0].split(":")[0]) - 8;
                const end_hour = parseInt(time[1].split(":")[0]) - 8;
                const rowIndex = DAYS_OF_WEEK[day];

                for (let i = start_hour; i <= end_hour; i++) {
                    if (c_matrix[rowIndex][i] !== 0) {
                        throw new ConstantMatrixOverlapError(`Overlap detected at,${grouped_sections[course][sections]["section_name"]} on row ${rowIndex}, column ${i}`);
                    }
                    c_matrix[rowIndex][i] = grouped_sections[course][sections]["id"];
                }    
            }
        }
    }
    return c_matrix;
}

async function generate_one_lesson(allMatrix, lesson) {

    const allMatrixCopy = [...allMatrix];
    allMatrix.length = 0;

    allMatrixCopy.forEach((matrix) => {
        Object.entries(lesson).forEach(([sectionKey, sectionData]) => {
            const newMatrix = matrix.map((row) => [...row]);
            const { id, times } = sectionData;

            let checker = false;
            for (const day in times) {
                const startHour = parseInt(times[day][0].split(":")[0], 10);
                const endHour = parseInt(times[day][1].split(":")[0], 10);
                

                for (let hour = startHour; hour <= endHour; hour++) {
                    let dayIndex = DAYS_OF_WEEK[day];
                    if (newMatrix[dayIndex][hour - 8] === 0) {
                        newMatrix[dayIndex][hour - 8] = id;
                    }
                    else{
                        checker = true;
                    }
                  
                }
            }
            if(!checker){
                allMatrix.push(newMatrix);
            }
        });
    });

}

async function createCourseIdMap(groupedSections) {
    const idMap = new Map();
    Object.values(groupedSections).forEach(sections => {
        Object.values(sections).forEach(section => {
            idMap[section.id] = {
                section_name: section.section_name,
                lecturer: section.lecturer,
                credits: section.credits,
                class: "AB1.00"
            };
        });
    });
    return idMap;
}

async function transformSchedule(idMap, matrix) {
    return matrix.map(day =>
        day.map(cellId => {
            if (cellId !== 0) {
                // Replace cellId with the corresponding value from idMap
                return {
                    ...idMap[cellId] || cellId}; // Fallback to cellId if not found in idMap
            }
            return 0; 
        })
    );
}



async function calistir(courses,sections) {
    try {
        const regulated = await regulate(courses,sections);
        const lessons = Object.keys(regulated);  
        const allCourses = await get_lessons_from_db(lessons);
        const groupedSections = await course_to_sections(regulated, allCourses);
        const idMap = await createCourseIdMap(groupedSections);
        const constantMatrix = await generate_constant_matrix(groupedSections);

        let allMatrices = [constantMatrix];
        for (const course of Object.keys(groupedSections)) {
            const sections = Object.keys(groupedSections[course]);
            if(sections.length != 1){
                await generate_one_lesson(allMatrices, groupedSections[course]);
            }
            else{
                console.log(`${course} is not sent to function`);
            }
        }

        // test matrices

        // final version
        let transformed = [];
        let schedules = {};
        schedules["totalSchedules"] = allMatrices.length;
        for(const matrix of allMatrices){
            const matrixx = await transformSchedule(idMap, matrix);
            transformed.push(matrixx);
        }
        schedules["schs"] = transformed;

        return schedules;
    } catch (error) {
        console.error("An error occurred during execution:", error);
    }
}

module.exports = { calistir };
