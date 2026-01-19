import psycopg2
from psycopg2 import sql
import csv
import os

# PostgreSQL connection parameters
DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'), 
    'database': os.getenv('DB_NAME')  
}

def create_database():
    """Create the ozu_schedule database"""
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database='postgres'
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'ozu_schedule'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute("CREATE DATABASE ozu_schedule")
            print("✓ Database 'ozu_schedule' created successfully")
        else:
            print("✓ Database 'ozu_schedule' already exists")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.Error as err:
        print(f"❌ Error creating database: {err}")
        return False

def create_connection():
    """Create connection to ozu_schedule database"""
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database='ozu_schedule'
        )
        return conn
    except psycopg2.Error as err:
        print(f"❌ Error connecting to database: {err}")
        return None

def create_tables():
    """Create all necessary tables"""
    conn = create_connection()
    if conn is None:
        return
    
    cursor = conn.cursor()
    
    try:
        # Drop tables if they exist (for fresh start)
        print("Dropping existing tables...")
        cursor.execute('DROP TABLE IF EXISTS course_time_slots CASCADE')
        cursor.execute('DROP TABLE IF EXISTS time_slots CASCADE')
        cursor.execute('DROP TABLE IF EXISTS courses CASCADE')
        conn.commit()
        
        # Create courses table
        print("Creating courses table...")
        cursor.execute('''
            CREATE TABLE courses (
                id SERIAL PRIMARY KEY,
                course_name VARCHAR(255) NOT NULL,
                section_name VARCHAR(255) NOT NULL,
                faculty VARCHAR(255) NOT NULL,
                description TEXT,
                credits DECIMAL(5,2) NOT NULL,
                lecturer VARCHAR(255) NOT NULL,
                required INTEGER NOT NULL
            )
        ''')
        conn.commit()
        print("✓ Courses table created")
        
        # Create time_slots table
        print("Creating time_slots table...")
        cursor.execute('''
            CREATE TABLE time_slots (
                time_id SERIAL PRIMARY KEY,
                day_of_week VARCHAR(255) NOT NULL,
                hour_of_day VARCHAR(255) NOT NULL
            )
        ''')
        conn.commit()
        print("✓ Time_slots table created")
        
        # Create course_time_slots table
        print("Creating course_time_slots table...")
        cursor.execute('''
            CREATE TABLE course_time_slots (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL,
                start_time_id INTEGER NOT NULL,
                end_time_id INTEGER NOT NULL,
                FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY(start_time_id) REFERENCES time_slots(time_id),
                FOREIGN KEY(end_time_id) REFERENCES time_slots(time_id)
            )
        ''')
        conn.commit()
        print("✓ Course_time_slots table created")
        
        # Create indexes for better performance
        print("Creating indexes...")
        cursor.execute('CREATE INDEX idx_course_name ON courses(course_name)')
        cursor.execute('CREATE INDEX idx_course_sections ON courses(course_name, section_name)')
        cursor.execute('CREATE INDEX idx_course_time_slots ON course_time_slots(course_id)')
        conn.commit()
        print("✓ Indexes created")
        
    except psycopg2.Error as err:
        print(f"❌ Error creating tables: {err}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def populate_time_slots():
    """Insert all time slots"""
    conn = create_connection()
    if conn is None:
        return
    
    cursor = conn.cursor()
    
    try:
        print("Inserting time slots...")
        days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"]
        
        for day in days:
            for hour in range(8, 22):
                hour_str = f"{hour}:40"
                cursor.execute('''
                    INSERT INTO time_slots (day_of_week, hour_of_day)
                    VALUES (%s, %s)
                ''', (day, hour_str))
        
        conn.commit()
        
        # Verify
        cursor.execute('SELECT COUNT(*) FROM time_slots')
        count = cursor.fetchone()[0]
        print(f"✓ Inserted {count} time slots")
        
    except psycopg2.Error as err:
        print(f"❌ Error inserting time slots: {err}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

class Course:
    def __init__(self, course_name, section_name, faculty, description, credits, lecturer):
        self.course_name = course_name
        self.section_name = section_name
        self.faculty = faculty
        self.description = description
        self.credits = credits
        self.lecturer = lecturer

def add_courses_from_csv(csv_file):
    """Add courses from CSV file"""
    conn = create_connection()
    if conn is None:
        return
    
    cursor = conn.cursor()
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            data = list(csv_reader)
            
            print(f"Processing {len(data)-1} courses from CSV...")
            
            for idx, row in enumerate(data[1:], 1):  # Skip header
                try:
                    # create a savepoint before each insert
                    cursor.execute("SAVEPOINT before_row")

                    course_name = row[0]
                    section_name = row[0] + row[1]
                    faculty = row[2]
                    description = row[3]
                    credits = float(row[4])
                    lecturer = row[5]
                    time_info = row[6]
                    
                    # Calculate required hours
                    required = 0
                    req_time_slots = time_info.strip().split("\n")
                    for time in req_time_slots:
                        day, hour = time.split(" | ")
                        hour_split = hour.split(" - ")
                        start_hour = int(hour_split[0][0:2])
                        end_hour = int(hour_split[1][0:2])
                        required += end_hour - start_hour
                    
                    # Insert course
                    cursor.execute('''
                        INSERT INTO courses (course_name, section_name, faculty, description, credits, lecturer, required)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    ''', (course_name, section_name, faculty, description, credits, lecturer, required))
                    
                    course_id = cursor.fetchone()[0]
                    
                    # Insert time slots for this course
                    time_slots = time_info.strip().split("\n")
                    for time_slot in time_slots:
                        day, hour = time_slot.split(" | ")
                        
                        # Parse time string: "14:40 - 16:30"
                        sep_hours = hour.split(" - ")
                        start_time_str = sep_hours[0].strip()
                        end_time_str = sep_hours[1].strip()

                        # Validation: Only allow standard X:40 start times
                        if not start_time_str.endswith(":40"):
                            print(f"   ⚠️ Skipping non-standard start time: {start_time_str} for {course_name}")
                            continue
                        
                        # Handle end time mapping (e.g., 16:30 -> 16:40 slot)
                        # The system expects end_time to match a slot for duration calculation
                        # If end time is X:30, mapped slot is X:40
                        if end_time_str.endswith(":30"):
                            prefix = end_time_str.split(":")[0]
                            target_end_slot = f"{prefix}:40"
                        elif end_time_str.endswith(":40"):
                            target_end_slot = end_time_str
                        else:
                             print(f"   ⚠️ Skipping non-standard end time: {end_time_str} for {course_name}")
                             continue

                        # Find IDs from DB
                        cursor.execute("SELECT time_id FROM time_slots WHERE day_of_week = %s AND hour_of_day = %s", (day, start_time_str))
                        res_start = cursor.fetchone()
                        
                        cursor.execute("SELECT time_id FROM time_slots WHERE day_of_week = %s AND hour_of_day = %s", (day, target_end_slot))
                        res_end = cursor.fetchone()

                        if res_start and res_end:
                            cursor.execute('''
                                INSERT INTO course_time_slots (course_id, start_time_id, end_time_id)
                                VALUES (%s, %s, %s)
                            ''', (course_id, res_start[0], res_end[0]))
                        else:
                             print(f"   ⚠️ Time slot not found in DB: {day} {start_time_str}-{target_end_slot}")
                    
                    if idx % 10 == 0:
                        print(f"  Processed {idx} courses...")

                except Exception as e:
                    print(f"❌ Error processing row {idx}: {e}")
                    print(f"   Row data: {row}")
                    # rollback only this row, not the entire transaction
                    cursor.execute("ROLLBACK TO SAVEPOINT before_row")
                    continue


            conn.commit()
            
            # Verify
            cursor.execute('SELECT COUNT(*) FROM courses')
            course_count = cursor.fetchone()[0]
            cursor.execute('SELECT COUNT(*) FROM course_time_slots')
            slot_count = cursor.fetchone()[0]
            
            print(f"✓ Successfully inserted {course_count} courses")
            print(f"✓ Successfully inserted {slot_count} course time slots")
            
    except FileNotFoundError:
        print(f"❌ CSV file '{csv_file}' not found")
    except Exception as err:
        print(f"❌ Error adding courses: {err}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def verify_database():
    """Verify database contents"""
    conn = create_connection()
    if conn is None:
        return
    
    cursor = conn.cursor()
    
    try:
        print("\n" + "="*50)
        print("DATABASE VERIFICATION")
        print("="*50)
        
        # Count courses
        cursor.execute('SELECT COUNT(*) FROM courses')
        course_count = cursor.fetchone()[0]
        print(f"Total courses: {course_count}")
        
        # Count time slots
        cursor.execute('SELECT COUNT(*) FROM time_slots')
        slot_count = cursor.fetchone()[0]
        print(f"Total time slots: {slot_count}")
        
        # Count course time slots
        cursor.execute('SELECT COUNT(*) FROM course_time_slots')
        cts_count = cursor.fetchone()[0]
        print(f"Total course-time mappings: {cts_count}")
        
        # Show sample courses
        print("\nSample courses:")
        cursor.execute('''
            SELECT course_name, section_name, lecturer, credits 
            FROM courses 
            LIMIT 5
        ''')
        for row in cursor.fetchall():
            print(f"  - {row[0]} ({row[1]}) - {row[2]} - {row[3]} credits")
        
        print("="*50 + "\n")
        
    except psycopg2.Error as err:
        print(f"❌ Error verifying database: {err}")
    finally:
        cursor.close()
        conn.close()

def main():
    print("="*50)
    print("POSTGRESQL DATABASE SETUP")
    print("="*50 + "\n")
    
    # Step 1: Create database
    if not create_database():
        print("Failed to create database. Exiting...")
        return
    
    # Step 2: Create tables
    create_tables()
    
    # Step 3: Populate time slots
    populate_time_slots()
    
    # Step 4: Add courses from CSV
    csv_file = "lessons.csv"
    print(f"\nLooking for CSV file: {csv_file}")
    add_courses_from_csv(csv_file)
    
    # Step 5: Verify
    verify_database()
    
    print("\n✓ Database setup complete!")
    print("\nConnection details for .env file:")
    print("="*50)
    print(f"DB_HOST=localhost")
    print(f"DB_PORT=5432")
    print(f"DB_USER=postgres")
    print(f"DB_PASSWORD=postgres")
    print(f"DB_NAME=ozu_schedule")
    print("="*50)

if __name__ == "__main__":
    main()