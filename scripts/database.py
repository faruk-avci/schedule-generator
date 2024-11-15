import mysql.connector
import os
from dotenv import load_dotenv
import csv

load_dotenv()

def create_connection():
    try:
        conn = mysql.connector.connect(
            user="root",  
            password="1234",
            database="ozu2"
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

def create_database():
    conn = create_connection()
    if conn is None:
        return
    
    cursor = conn.cursor()
    
    # Create table for courses
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS courses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_name VARCHAR(255) NOT NULL,
            section_name VARCHAR(255) NOT NULL,
            faculty VARCHAR(255) NOT NULL,
            description TEXT,
            credits DECIMAL(5,2) NOT NULL,
            lecturer VARCHAR(255) NOT NULL,
            required INT NOT NULL
        )
    ''')
    conn.commit()

    # Create table for time slots
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS time_slots (
            time_id INT AUTO_INCREMENT PRIMARY KEY,
            day_of_week VARCHAR(255) NOT NULL,
            hour_of_day VARCHAR(255) NOT NULL
        )
    ''')
    conn.commit()

    # Create table for course time slots
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS course_time_slots (
            course_id INT NOT NULL,
            start_time_id INT NOT NULL,
            end_time_id INT NOT NULL,
            FOREIGN KEY(course_id) REFERENCES courses(id),
            FOREIGN KEY(start_time_id) REFERENCES time_slots(time_id),
            FOREIGN KEY(end_time_id) REFERENCES time_slots(time_id)
        )
    ''')
    conn.commit()

    conn.close()

def handle_time_table():
    conn = create_connection()
    if conn is None:
        return

    cursor = conn.cursor()
    
    # Insert time slots
    for day in ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"]:
        for hour in range(8, 21):
            hour_str = f"{hour}:40"
            cursor.execute('''
                INSERT INTO time_slots (day_of_week, hour_of_day)
                VALUES (%s, %s)
            ''', (day, hour_str))
            conn.commit()
    
    # Verify that time slots have been inserted correctly
    cursor.execute('SELECT * FROM time_slots')
    time_slots = cursor.fetchall()
    print("Time slots in database:")
    for time_slot in time_slots:
        print(time_slot)
    
    conn.close()

class Course:
    def __init__(self, course_name, section_name, faculty, description, credits, lecturer):
        self.course_name = course_name
        self.section_name = section_name
        self.faculty = faculty
        self.description = description
        self.credits = credits
        self.lecturer = lecturer

def add_to_db(data):
    conn = create_connection()
    if conn is None:
        return

    cursor = conn.cursor()
    
    for row in data[1:]:
        print(row)
        course = Course(row[0], row[0] + row[1], row[2], row[3], row[4], row[5])

        required = 0
        req_time_slots = row[6].strip().split("\n")
        for time in req_time_slots:
            day, hour = time.split(" | ")
            hour_split = hour.split(" - ")
            start_hour = int(hour_split[0][0:2])
            end_hour = int(hour_split[1][0:2])
            required += end_hour - start_hour
        cursor.execute('''
            INSERT INTO courses (course_name, section_name, faculty, description, credits, lecturer, required)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (course.course_name, course.section_name, course.faculty, course.description, course.credits, course.lecturer, required))
        conn.commit()

        course_id = cursor.lastrowid

        time_slots = row[6].strip().split("\n")
        for time_slot in time_slots:
            day, hour = time_slot.split(" | ")

            day_id = 0
            if day == "Pazartesi":
                day_id = 1
            elif day == "Salı":
                day_id = 14
            elif day == "Çarşamba":
                day_id = 27
            elif day == "Perşembe":
                day_id = 40
            elif day == "Cuma":
                day_id = 53

            sep_hours = hour.split(" - ")
            start_hour = int(sep_hours[0][0:2])
            end_hour = int(sep_hours[1][0:2]) - 1

            start_hour_id = start_hour - 8
            end_hour_id = end_hour - 8

            # Print time slot IDs for debugging
            print(f"Inserting time slot for course_id {course_id}: start_time_id={start_hour_id + day_id}, end_time_id={end_hour_id + day_id}")

            cursor.execute('''
                INSERT INTO course_time_slots (course_id, start_time_id, end_time_id)
                VALUES (%s, %s, %s)
            ''', (course_id, start_hour_id + day_id, end_hour_id + day_id))
            conn.commit()
    
    conn.close()

def main():
    create_database()  # Create tables
    handle_time_table()  # Insert time slots
    
    with open("faculty_of_engineering.csv", 'r', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        data = list(csv_reader)
        add_to_db(data=data)  # Add courses and time slots

if __name__ == "__main__":
    main()
