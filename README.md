# OzuPlanner - Course Schedule Builder

This is a web application designed for Ozyegin Unviersity students to help preparing their weekly schedules before course registirations. 

## Overview

Students can add courses to their basket by searching, with the ability to either add the entire course (all sections) or just selected sections for schedule generation.

The application simplifies generating tens of schedule combinations by applying a conflict detection algorithm and serves available options to students to choose their optimal weekly schedule. (Future enhancements may include advanced sorting features such as morning-heavy schedules, balanced daily distributions, or preferred time slot filtering.)

## Universal Application

This application can be adapted to any university. Since all university course systems share the same structure (Course Name, Course Code, Section Name, Time Slots, Lecturer, Faculty, Credits), if you import your university's course data into the database tables, the system will work seamlessly. You are encouraged to adapt it for your own university.


## Architecture

The system uses a simple three-tier architecture. The backend runs on Node.js with Express handling API requests. The frontend is built with React and Vite for the user interface. PostgreSQL serves as the database with three tables storing course data, time slots, and their relationships.

## Installation

### Prerequisites
- Node.js v16+
- PostgreSQL 12+
- Python 3.8+ (for database setup)

### Setup

Clone the repository:
```bash
git clone https://github.com/faruk-avci/schedule-generator.git
cd schedule-generator
```

Setup database:
```bash
cd backend/database_python
pip install psycopg2-binary python-dotenv
python database.py
```

Start backend:
```bash
cd backend
npm install
npm app.js
```

Start frontend:
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`

## Contributing

Contributions are welcome! Whether you want to add features, fix bugs, or adapt this for your own university, feel free to fork and submit pull requests.

### Adapting for Your University

If you want to use this system for your university:

1. Export your university's course data in CSV format with columns: course_code, section_number, faculty, description, credits, lecturer, time_info
2. Replace the `lessons.csv` file in `backend/database_python/`
3. Run the database setup script to populate your courses
4. Update the university name and branding in the frontend

The system will work with any university's course structure as long as the data follows the standard format.
