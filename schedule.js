const mysql = require('mysql2');

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
                console.log(regulated[course_name])
                console.log(section_namee)
                for(inside of regulated[course_name]){ 
                    if(inside == section_namee){ 
                        if(!(course_name in course_to_section)){
                            course_to_section[course_name] = {}
                        }
                        if(!(section_namee in course_to_section[course_name])){
                            course_to_section[course_name][section_namee] = {
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
            }
        }
    }
    console.dir(course_to_section, { depth: null });
}

(async () => {
    const regulated = await regulate(
        ["CS202","MATH103","MATH104"],[{
            "course": "CS201",
            "section": "CS201A"
            },
            {
            "course": "CS201",
            "section": "CS201B"
            },
            {
            "course": "CS201L",
            "section": "CS201LA"
            },
            {
            "course": "CS201L",
            "section": "CS201LB"
            }]
    );
    course_to_sections(regulated,await get_lessons_from_db(Object.keys(regulated)));
})();
