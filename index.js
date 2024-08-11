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
// Logger configuration
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

const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis successfully');
    } catch (err) {
        console.error('Error connecting to Redis:', err);
        errorLogger.error('Error connecting to Redis:', err);
        process.exit(1); 
    }
})();

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(limiter);

app.use(session({
    store: new RedisStore({ client: redisClient }),
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

    searchLogger.info(`Searching for courses with name: ${courseName}`);

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
        errorLogger.error('Error executing query:', err.message);
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
    addedCoursesLogger.info(`Added course: ${courseName}, credits: ${credits}`);
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
    removedCoursesLogger.info(`Removed course: ${courseName}, credits: ${credits}`);
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
            res.status(500).send('Program oluşturulurken bir hata oluştu');
            return;
        }
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
            res.status(500).send('Program oluşturulurken bir hata oluştu');
            return;
        }

        try {
            const schedules = JSON.parse(stdout.trim());
            console.log('Schedules:', schedules);
            res.send(schedules);
        } catch (parseError) {
            console.error(`Error parsing script output: ${parseError}`);
            errorLogger.error(`Error parsing script output: ${parseError}`);
            res.status(500).send('Program oluşturulurken bir hata oluştu');
            
        }
    });
});
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
