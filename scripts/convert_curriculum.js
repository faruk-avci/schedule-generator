const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, '../frontend/src/data/curriculums');
const EE_JSON_PATH = path.join(SRC_DIR, 'ee.json');

// Mappings for file names to major IDs and titles
const MAJOR_INFO = {
    'ai_cir.csv': { id: 'ai', title_tr: 'Yapay Zeka Mühendisliği', title_en: 'Artificial Intelligence Engineering' },
    'ie_cir.csv': { id: 'ie', title_tr: 'Endüstri Mühendisliği', title_en: 'Industrial Engineering' },
    'ce_cir.csv': { id: 'ce', title_tr: 'İnşaat Mühendisliği', title_en: 'Civil Engineering' },
    'me_cir.csv': { id: 'me', title_tr: 'Makine Mühendisliği', title_en: 'Mechanical Engineering' },
    'CS_cir.csv': { id: 'cs', title_tr: 'Bilgisayar Mühendisliği', title_en: 'Computer Science' } // Or Computer Engineering? University usually maps CS code to Computer Science, but user might want 'Computer Engineering' if that's the dept name. CS 401 says 'Bilgisayar Mühendisliği'. I'll use 'Computer Science' as the standard translation for CS, but in Turkey it's often synonymous. Let's stick to 'Computer Science' or check other docs. Actually, let's use 'Computer Science' to be safe with the code 'CS'.
};

// Build translation cache from ee.json
const translationCache = {};

function loadTranslations() {
    if (fs.existsSync(EE_JSON_PATH)) {
        const eeData = JSON.parse(fs.readFileSync(EE_JSON_PATH, 'utf8'));

        const extractFromSemester = (semesterData) => {
            if (!semesterData) return;
            semesterData.forEach(course => {
                if (course.code) {
                    translationCache[course.code] = course.title_en;
                }
                if (course.title_tr && course.title_en) {
                    translationCache[course.title_tr] = course.title_en;
                }
            });
        };

        const semesters = eeData.semesters;
        for (const year in semesters) {
            extractFromSemester(semesters[year].fall);
            extractFromSemester(semesters[year].spring);
        }
    }
}

// Simple CSV parser that handles quoted commas
function parseCSVLine(text) {
    const result = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell.trim());
    return result;
}

function parseSemester(semesterStr) {
    // Format: "1. Yıl - Güz", "2. Yıl - Bahar"
    const yearMatch = semesterStr.match(/(\d+)\.\s*Yıl/);
    const seasonMatch = semesterStr.toLowerCase();

    let year = yearMatch ? yearMatch[1] : 'Unknown';
    let season = 'fall';
    if (seasonMatch.includes('bahar') || seasonMatch.includes('spring')) {
        season = 'spring';
    } else if (seasonMatch.includes('güz') || seasonMatch.includes('fall')) {
        season = 'fall';
    }

    return { year, season };
}

function convertFile(filename) {
    const filePath = path.join(SRC_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filename}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const headers = parseCSVLine(lines[0]); // Expecting CODE,TITLE,CREDITS,...

    const info = MAJOR_INFO[filename];
    if (!info) {
        console.log(`No info for ${filename}`);
        return;
    }

    const output = {
        id: info.id,
        title_tr: info.title_tr,
        title_en: info.title_en,
        semesters: {}
    };

    // Initialize structure
    for (let i = 1; i <= 4; i++) {
        output.semesters[i] = { fall: [], spring: [] };
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cols = parseCSVLine(line);
        if (cols.length < 7) continue;

        const [code, title_tr, credits, prereq, coreq, practical, semesterStr] = cols;
        const { year, season } = parseSemester(semesterStr);

        if (!output.semesters[year]) {
            output.semesters[year] = { fall: [], spring: [] };
        }

        // Try to find English title
        let title_en = translationCache[code] || translationCache[title_tr];
        if (!title_en) {
            // Fallback heuristics
            const common = {
                'Türk Dili ve Edebiyatı': 'Turkish Language and Literature',
                'Atatürk İlkeleri ve İnkılap Tarihi': 'Principles of Atatürk',
                'İngilizce': 'English',
                'Kişisel Gelişim': 'Personal Development',
                'Üniversite Yaşamına Giriş': 'Intro to University Life',
                'Sorumlu Yurttaşlık': 'Civic Responsibility',
                'İşletmeye Giriş': 'Introduction to Business',
                'Fizik': 'Physics',
                'Kimya': 'Chemistry',
                'Mühendislik için Yüksek Matematik': 'Calculus for Engineering',
                'Seçmeli': 'Elective'
            };

            for (const [key, val] of Object.entries(common)) {
                if (title_tr.includes(key)) {
                    // Check for roman numerals like I, II
                    const suffix = title_tr.match(/[IVX]+$/);
                    title_en = val + (suffix ? ' ' + suffix[0] : '');
                    if (title_tr.toLowerCase().includes('seçmeli')) {
                        // Preserve the prefix if it looks like a department code e.g. "BSCE Program-İçi Seçmeli"
                        if (title_tr.includes('Program-İçi')) title_en = 'Program Elective';
                        else if (title_tr.includes('Serbest')) title_en = 'Free Elective';
                        else if (title_tr.includes('Sosyal Bilimler')) title_en = 'Social Science Elective';
                    }
                    break;
                }
            }
        }

        if (!title_en) {
            title_en = title_tr; // Fallback to Turkish
        }

        // Clean up prereq/coreq text (e.g. remove quotes if any remain, though parser handles it)
        // Convert "ve", "veya" to "and", "or" for english display logic? 
        // The frontend logic handles "P" and "C" prefixes, but here we just store the text.
        // The user asked for "Prereq" etc. in the UI, which writes 'Prereq: ' + text.

        output.semesters[year][season].push({
            code: code || "", // handle empty code (electives)
            title_tr: title_tr.replace(/"/g, ''),
            title_en: title_en.replace(/"/g, ''),
            credits: parseFloat(credits) || 0,
            prereq: prereq ? prereq.replace(/"/g, '') : "",
            coreq: coreq ? coreq.replace(/"/g, '') : ""
        });
    }

    const outPath = path.join(SRC_DIR, `${info.id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(output, null, 4));
    console.log(`Converted ${filename} to ${info.id}.json`);

    // Delete CSV
    fs.unlinkSync(filePath);
    console.log(`Deleted ${filename}`);
}

loadTranslations();
Object.keys(MAJOR_INFO).forEach(convertFile);
