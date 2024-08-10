require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const mysql = require('mysql2');
const session = require('express-session');
const app = express();

const port = 5000;

app.use(bodyParser.json());
app.use(express.static('public')); 

app.use(session({
    secret: process.env.SECRET_KEY || 'secret-key',
    name: 'sessionId',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" } // Set to true if using HTTPS
}));

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
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

    const query = `
        SELECT course_name, credits, section_name
        FROM courses
        WHERE course_name LIKE ?`;

    const likePattern = `%${courseName}%`;
    try {
        const [rows] = await db.execute(query, [likePattern]);

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
            courseMap.get(row.course_name).sections.push(row.section_name);
        });

        // Convert map values to an array
        const uniqueResults = Array.from(courseMap.values());

        res.json({ courses: uniqueResults });
        console.log('uniqueResults:', uniqueResults);
    } catch (err) {
        console.error('Error executing query:', err.message);
        res.status(500).json({ error: 'Database query failed' });
    }
});

app.post('/add-course', (req, res) => {
    const { courseName, credits } = req.body;
    if (!courseName || credits === undefined) {
        return res.status(400).json({ error: 'Course name and credits are required' });
    }

    if (!req.session.courses) {
        req.session.courses = [];
    }

    const exists = req.session.courses.some(course => course.course_name === courseName);
    if (exists) {
        return res.status(400).json({ error: 'Course already added.' });
    }

    req.session.courses.push({ course_name: courseName, credits });
    res.json({ success: true });
});

app.post('/remove-course', (req, res) => {
    const { courseName, credits } = req.body;
    if (!courseName || credits === undefined) {
        return res.status(400).json({ error: 'Course name and credits are required' });
    }

    if (!req.session.courses) {
        return res.status(400).json({ error: 'No courses found' });
    }

    const index = req.session.courses.findIndex(course => course.course_name === courseName);
    if (index === -1) {
        return res.status(400).json({ error: 'Course not found' });
    }

    req.session.courses.splice(index, 1);
    res.json({ success: true });
});

app.get('/get-added-courses', (req, res) => {
    res.json({ courses: req.session.courses || [] });
});

app.get('/get-total-credit-lesson', (req, res) => {
    if (!req.session.courses) {
        return res.json({ totalCredits: 0, totalLesson: 0 });
    }

    let totalCredits = req.session.courses.reduce((acc, course) => acc + course.credits, 0);
    let totalLesson = req.session.courses.length;
    res.json({ totalCredits, totalLesson });
});

app.post('/generate-schedules', (req, res) => {
    const lessons = req.session.courses.map(course => `${course.course_name}`);
    const lessonsArgs = lessons.join(' ');

    exec(`python scripts/generate_schedules.py "${lessonsArgs}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error}`);
            res.status(500).send('Error generating schedules');
            return;
        }
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
            res.status(500).send('Error generating schedules');
            return;
        }

        try {
            const schedules = JSON.parse(stdout.trim());
            console.log('Schedules:', schedules);
            res.send(schedules);
        } catch (parseError) {
            console.error(`Error parsing script output: ${parseError}`);
            res.status(500).send('Error parsing schedules');
        }
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
