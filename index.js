require('dotenv').config();
const express = require('express');
const RedisStore = require('connect-redis').default;
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const winston = require('winston');
const mysql = require('mysql2');
const redis = require('redis');
const path = require('path');
const { generateSchedule } = require('./schedule');
const { ConstantMatrixOverlapError, TooManySchedulesError } = require('./error');


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 100 requests per windowMs
    handler: (req, res, next, options) => {
        res.status(429).json({
            error: 'Bu IP adresi üzerinden çok fazla istekte bulundunuz. Lütfen daha sonra tekrar deneyin.'
        });
    }
});

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});
const errorLogger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        logFormat
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, 'logs', 'error.log') })
    ]
});
const searchLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        logFormat
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, 'logs', 'searches.log') })
    ]
});
const addedCoursesLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        logFormat
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, 'logs', 'added-courses.log') })
    ]
});
const removedCoursesLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        logFormat
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, 'logs', 'removed-courses.log') })
    ]
});

const app = express();
const port = 5000;


app.use(bodyParser.json());
app.use(express.static('public'));
app.use(limiter);

app.use(session({
    secret: process.env.SECRET_KEY || 'secret-key',
    name: 'sessionId',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === "production", // Set true for HTTPS
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "ozu2",
    connectionLimit: 10
});

const db = pool.promise();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/search', async (req, res) => {
    const courseName = req.body.courseName;
    if (!courseName) {
        return res.status(400).json({ error: 'Course name is required' });
    }

    searchLogger.info(`Searching for courses with name: ${courseName}`);

    const query = `
        SELECT course_name, credits, section_name, lecturer
        FROM courses
        WHERE course_name LIKE ?`;

    const likePattern = `%${courseName}%`;
    try {
        const [rows] = await db.execute(query, [likePattern]);
        console.log(rows)
        // Use a map to aggregate sections by course_name and credits
        const courseMap = new Map();

        rows.forEach(row => {
            if (!courseMap.has(row.course_name)) {
                courseMap.set(row.course_name, {
                    course_name: row.course_name,
                    credits: row.credits,
                    sections: []
                });
            }
            courseMap.get(row.course_name).sections.push({section_name: row.section_name, lecturer:row.lecturer});
        });
        console.log(courseMap);

        // Convert map values to an array
        const uniqueResults = Array.from(courseMap.values());

        res.json({ courses: uniqueResults });
        console.log('uniqueResults:', uniqueResults);
    } catch (err) {
        console.error('Error executing query:', err.message);
        errorLogger.error('Error executing query:', err.message);
        res.status(500).json({ error: 'Database query failed' });
    }
});

app.post('/add', async (req, res) =>{
    const { course, section } = req.body;

    if (!req.session.addedCourses) {
        req.session.addedCourses = [];
    }
    if (!req.session.addedSections) {
        req.session.addedSections = [];
    }

    if (section === null) {
        // Process of adding a COURSE
        // Check if the course is already added
        if (req.session.addedCourses.includes(course)) {
            return res.status(400).json({ error: 'Course is already added' });
        }

        // Check if any of its sections are added
        const sectionExists = req.session.addedSections.some(s => s.course === course);
        if (sectionExists) {
            return res.status(400).json({
                error: `One of the sections of the course "${course}" is already added. Remove the section before adding the entire course.`
            });
        }

        // Add the course
        req.session.addedCourses.push(course);
        return res.json({ success: true, message: `Course "${course}" added successfully.` });
    } else {
        // Process of adding a SECTION
        // Check if the section is already added
        const existingSection = req.session.addedSections.find(
            s => s.course === course && s.section === section
        );
        if (existingSection) {
            return res.status(400).json({
                error: `The section "${section}" of the course "${course}" is already added.`
            });
        }

        // Check if the entire course is already added
        if (req.session.addedCourses.includes(course)) {
            return res.status(400).json({
                error: `The course "${course}" is already added. Cannot add individual sections.`
            });
        }

        // Add the section
        req.session.addedSections.push({ course, section });
        return res.json({
            success: true,
            message: `Section "${section}" of the course "${course}" added successfully.`
        });
    }


});

app.post('/remove', async (req, res) => {
    const { course, section } = req.body;

    // Ensure session arrays exist
    if (!req.session.addedCourses) {
        req.session.addedCourses = [];
    }
    if (!req.session.addedSections) {
        req.session.addedSections = [];
    }

    try {
        if (section === null) {
            if (!req.session.addedCourses.includes(course)) {
                return res.status(400).json({
                    error: `Course "${course}" is not in your added courses.`
                });
            }

            req.session.addedCourses = req.session.addedCourses.filter(c => c !== course);
            
            return res.json({
                success: true,
                message: `Course "${course}" removed successfully.`
            });

        } else {
            // Process of removing a SECTION
            const sectionIndex = req.session.addedSections.findIndex(
                s => s.course === course && s.section === section
            );

            if (sectionIndex === -1) {
                return res.status(400).json({
                    error: `The section "${section}" of the course "${course}" is not in your added sections.`
                });
            }

            // Remove the section
            req.session.addedSections = req.session.addedSections.filter(
                (s, index) => index !== sectionIndex
            );

            return res.json({
                success: true,
                message: `Section "${section}" of the course "${course}" removed successfully.`
            });
        }

    } catch (error) {
        console.error('Error in /remove endpoint:', error);
        return res.status(500).json({
            error: 'An error occurred while processing your request.'
        });
    }
});

app.post('/generate', async (req, res) => {
    try {
        const schedules = await generateSchedule(req.session.addedCourses, req.session.addedSections);
        
        if (schedules) {
            
            if(schedules["totalSchedules"] > 120){
                throw new TooManySchedulesError("The number of schedules exceeds the allowed limit of 120.");
            }
            res.json({
                success: true,
                data: schedules,
            }); 
        } else {
            // If schedules is falsy, respond with an error message
            res.status(400).json({
                success: false,
                message: 'No schedules could be generated. Please check the input data.',
            });
        }
    } catch (error) {
        console.error('Error generating schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate schedules',
            error: error.message, // Send the error message
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined, // Include stack trace only in development
        });
    }
});
app.get('/get-courses-sections',(req,res)=>{
    const response = {
        addedCourses: req.session.addedCourses,
        addedSections: req.session.addedSections,
    };

    res.json(response);
});

// headers
app.get('/me',(req,res) =>{
    res.sendFile(__dirname + '/public/me.html');
})

app.get('/about',(req,res) =>{
    res.sendFile(__dirname + '/public/about.html');
})

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
