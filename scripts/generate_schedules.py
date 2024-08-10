import mysql.connector
import numpy as np
import json
import sys
import os
from dotenv import load_dotenv

selected_lessons = [ "CS105","MATH104" , "IE101"]

lesson_id = {
}

id_lesson = {

}
load_dotenv()
def create_connection():
    try:
        conn = mysql.connector.connect(
            user=os.getenv("MYSQL_USER"),  
            password=os.getenv("MYSQL_PASSWORD"),
            host=os.getenv("MYSQL_HOST"),
            port=os.getenv("MYSQL_PORT"),
            database=os.getenv("MYSQL_DATABASE")
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

def get_info_from_db(lessons, lesson_id):
    all_courses = {}
    must_count_dict = {}
    
    conn = create_connection()
    if conn is None:
        return all_courses, must_count_dict

    cursor = conn.cursor()
    
    for lesson in lessons:
        cursor.execute('''
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
            c.course_name = %s
        ''', (lesson,))
        all_courses[lesson] = cursor.fetchall()
        
        for le in all_courses[lesson]:
            if le[1] not in lesson_id:
                lesson_id[le[1]] = le[8]
                
            if le[1] not in must_count_dict:
                must_count_dict[le[1]] = all_courses[lesson][0][4]

    conn.close()
    return all_courses, must_count_dict
def course_to_section(courses):
    course_to_section = {}
    for course_name, sections in courses.items():
        for section in sections:
            section_name = section[1]
            if course_name not in course_to_section:
                course_to_section[course_name] = {}
            if section_name not in course_to_section[course_name]:
                course_to_section[course_name][section_name] = {
                    "lecturer": section[2],
                    "credits": section[3],
                    "required": section[4],
                    "times": {}
                }
            day_of_week = section[5]
            start_hour = section[6]
            end_hour = section[7]
            if day_of_week not in course_to_section[course_name][section_name]["times"]:
                course_to_section[course_name][section_name]["times"][day_of_week] = []
            course_to_section[course_name][section_name]["times"][day_of_week]= (start_hour, end_hour)
    return course_to_section

def constant_matrix_generator(sections):
    constant_matrix = np.zeros((5, 13), dtype=int)
    for key, value in sections.items():
        if len(value) == 1:
            section = value[0]
            times = section[5]
            for day, time in times.items():
                start_hour = int(time[0].split(":")[0]) - 8
                end_hour = int(time[1].split(":")[0]) - 8                
                if day == "Pazartesi":
                    for i in range(start_hour, end_hour+1):
                        constant_matrix[0][i] = lesson_id[value[0][1]]
                elif day == "Salı":
                    for i in range(start_hour, end_hour+1):
                        constant_matrix[1][i] = lesson_id[value[0][1]]
                elif day == "Çarşamba":
                    for i in range(start_hour, end_hour+1):
                        constant_matrix[2][i] = lesson_id[value[0][1]]
                elif day == "Perşembe":
                    for i in range(start_hour, end_hour+1):
                        constant_matrix[3][i] = lesson_id[value[0][1]]
                elif day == "Cuma":
                    for i in range(start_hour, end_hour+1):
                        constant_matrix[4][i] = lesson_id[value[0][1]]
    return constant_matrix

def one_lesson_matrix_generator(all_matrix, lesson):
    all_matrix_copy = all_matrix.copy() 
    all_matrix.clear()
    for matrix in all_matrix_copy:
        for section in lesson:
            new_matrix = matrix.copy()
            key = section[0]
            times = section[5]

            for day in times.keys():
                start_index = int(times[day][0].split(":")[0])
                end_index = int(times[day][1].split(":")[0])

                for x in range(start_index, end_index+1):
                    if day == "Pazartesi":
                        if matrix[0][x-8] == 0:
                            new_matrix[0][x-8] = lesson_id[section[1]]
                    elif day == "Salı":
                        if matrix[1][x-8] == 0:
                            new_matrix[1][x-8] = lesson_id[section[1]]
                    elif day == "Çarşamba":
                        if matrix[2][x-8] == 0:
                            new_matrix[2][x-8] = lesson_id[section[1]]
                    elif day == "Perşembe":
                        if matrix[3][x-8] == 0:
                            new_matrix[3][x-8] = lesson_id[section[1]]
                    elif day == "Cuma":
                        if matrix[4][x-8] == 0:
                            new_matrix[4][x-8] = lesson_id[section[1]]
            all_matrix.append(new_matrix)

def check_matrix(matrix,must_count_dict,id_lesson):
    counter = {}
    for i in range(5):
        for j in range(13):
            if matrix[i][j] not in counter:
                counter[matrix[i][j]] = 1
            else:
                counter[matrix[i][j]] += 1
    for key, value in counter.items():
        if key != 0:
            if value != must_count_dict[id_lesson[key]]:
                return False
    return True

def last_check(matrix, taken_lessons):
    lessons = []
    for row in matrix:
        for cell in row:
            if cell not in lessons:
                lessons.append(cell[:-1])
    
    for les in taken_lessons:
        if les not in lessons:
            return False
        
    return True

def generate_schedules_m(lessons):
    courses, must_count_dict = get_info_from_db(lessons,lesson_id)
   
    sections = course_to_section(courses)
    id_lesson = {v: k for k, v in lesson_id.items()}


    formatted_sections = []
    for course_name, sections in sections.items():
        for section_name, details in sections.items():
            formatted_section = (course_name, section_name, details["lecturer"], details["credits"], details["required"], details["times"])
            formatted_sections.append(formatted_section)

    grouped_sections = {}
    for section in formatted_sections:
        course_name = section[0]
        if course_name not in grouped_sections:
            grouped_sections[course_name] = []
        grouped_sections[course_name].append(section)

    constant_matrix_ = constant_matrix_generator(grouped_sections)

    all_matrix = [constant_matrix_]

    for value in grouped_sections.values():
        one_lesson_matrix_generator(all_matrix, value)

    valid_matrix = []


    for matrix in all_matrix:
        if check_matrix(matrix, must_count_dict,id_lesson):
            valid_matrix.append(matrix)
        


    new_valids = []

    for valid_schedule in valid_matrix:
        new_valid_schedule = []
        for row in valid_schedule:
            new_row = []
            for cell in row:
                if cell == 0:
                    new_row.append("-")
                else:
                    new_row.append(id_lesson[cell])
            new_valid_schedule.append(new_row)
        new_valids.append(new_valid_schedule)
    

    last_valids = []

    for valid_sch in new_valids:
        if last_check(valid_sch,taken_lessons=lessons):
            last_valids.append(valid_sch)
    

    return last_valids

if __name__ == "__main__":
    taken_lessons = sys.argv[1:]
    format_les = taken_lessons[0].split(" ")
    last_valids = generate_schedules_m(format_les)
    formatted_schedules = [{"id": idx,"schedule": schedule} for idx, schedule in enumerate(last_valids)]
    print(json.dumps(formatted_schedules, indent=4))