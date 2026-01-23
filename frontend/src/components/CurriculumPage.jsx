import React, { useState, useEffect } from 'react';
import './CurriculumPage.css';
import { translations } from '../utils/translations';

// Import curriculum data
// Import curriculum data
import eeCurriculum from '../data/curriculums/ee.json';
import aiCurriculum from '../data/curriculums/ai.json';
import ieCurriculum from '../data/curriculums/ie.json';
import ceCurriculum from '../data/curriculums/ce.json';
import meCurriculum from '../data/curriculums/me.json';
import csCurriculum from '../data/curriculums/cs.json';

const AVAILABLE_MAJORS = [
    { id: 'ee', tr: 'Elektrik-Elektronik Mühendisliği', en: 'Electrical-Electronics Engineering', data: eeCurriculum },
    { id: 'cs', tr: 'Bilgisayar Mühendisliği', en: 'Computer Science', data: csCurriculum },
    { id: 'ai', tr: 'Yapay Zeka Mühendisliği', en: 'Artificial Intelligence Engineering', data: aiCurriculum },
    { id: 'ie', tr: 'Endüstri Mühendisliği', en: 'Industrial Engineering', data: ieCurriculum },
    { id: 'me', tr: 'Makine Mühendisliği', en: 'Mechanical Engineering', data: meCurriculum },
    { id: 'ce', tr: 'İnşaat Mühendisliği', en: 'Civil Engineering', data: ceCurriculum },
];

// Map full major names (from localStorage) to IDs
const MAJOR_NAME_MAP = {
    'Electrical-Electronics Engineering': 'ee',
    'Elektrik-Elektronik Mühendisliği': 'ee',
    'Computer Science': 'cs',
    'Computer Engineering': 'cs',
    'Bilgisayar Mühendisliği': 'cs',
    'Artificial Intelligence Engineering': 'ai',
    'Yapay Zeka Mühendisliği': 'ai',
    'Industrial Engineering': 'ie',
    'Endüstri Mühendisliği': 'ie',
    'Mechanical Engineering': 'me',
    'Makine Mühendisliği': 'me',
    'Civil Engineering': 'ce',
    'İnşaat Mühendisliği': 'ce'
};

function CurriculumPage({ language }) {
    const isTr = language === 'tr';
    const [selectedMajorId, setSelectedMajorId] = useState('ee'); // Default fallback
    const [curriculum, setCurriculum] = useState(eeCurriculum);

    // Auto-select major from localStorage on mount
    useEffect(() => {
        const storedMajor = localStorage.getItem('student_major');
        if (storedMajor) {
            const mappedId = MAJOR_NAME_MAP[storedMajor];
            // Only autoset if we actually have data for this major
            if (mappedId && AVAILABLE_MAJORS.find(m => m.id === mappedId)) {
                setSelectedMajorId(mappedId);
            }
        }
    }, []);

    useEffect(() => {
        const major = AVAILABLE_MAJORS.find(m => m.id === selectedMajorId);
        if (major) {
            setCurriculum(major.data);
        }
    }, [selectedMajorId]);

    return (
        <div className="curriculum-page">
            <div className="curriculum-header-section">
                <h1>{isTr ? 'Müfredat' : 'Curriculum'}</h1>
                <p>
                    {isTr
                        ? 'Dönemlik ders planı ve ön/yan koşullar.'
                        : 'Semester course plan and requisites.'}
                </p>

                <div className="major-selector">
                    <label>{isTr ? 'Bölüm Seçiniz:' : 'Select Major:'}</label>
                    <select
                        value={selectedMajorId}
                        onChange={(e) => setSelectedMajorId(e.target.value)}
                        className="major-dropdown"
                    >
                        {AVAILABLE_MAJORS.map(major => (
                            <option key={major.id} value={major.id}>
                                {isTr ? major.tr : major.en}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Curriculum Content */}
            <div className="curriculum-content">
                <h2 className="major-title">
                    {isTr ? curriculum.title_tr : curriculum.title_en}
                </h2>

                {[1, 2, 3, 4].map(year => {
                    const yearData = curriculum.semesters[year];
                    if (!yearData) return null;

                    return (
                        <div key={year} className="year-section">
                            <div className="year-badge-container">
                                <span className="year-badge">
                                    {year}. {isTr ? 'Yıl' : 'Year'}
                                </span>
                            </div>

                            <div className="semesters-grid">
                                {/* Fall Semester */}
                                <div className="semester-card">
                                    <div className="semester-header">
                                        <h3>{isTr ? 'Güz' : 'Fall'}</h3>
                                        <span className="semester-icon">🍂</span>
                                    </div>
                                    <div className="table-container">
                                        <SemesterTable courses={yearData.fall} isTr={isTr} />
                                    </div>
                                </div>

                                {/* Spring Semester */}
                                <div className="semester-card">
                                    <div className="semester-header">
                                        <h3>{isTr ? 'Bahar' : 'Spring'}</h3>
                                        <span className="semester-icon">🌱</span>
                                    </div>
                                    <div className="table-container">
                                        <SemesterTable courses={yearData.spring} isTr={isTr} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Sub-component for clean table rendering
const SemesterTable = ({ courses, isTr }) => {
    const totalCredits = courses.reduce((acc, c) => acc + (parseFloat(c.credits) || 0), 0);

    return (
        <table className="pixel-perfect-table">
            <thead>
                <tr>
                    <th className="th-code">{isTr ? 'Kod' : 'Code'}</th>
                    <th className="th-title">{isTr ? 'Ders Adı' : 'Course Title'}</th>
                    <th className="th-credits">{isTr ? 'AKTS' : 'ECTS'}</th>
                    <th className="th-req">{isTr ? 'Koşullar' : 'Requisites'}</th>
                </tr>
            </thead>
            <tbody>
                {courses.map((course, idx) => (
                    <tr key={idx}>
                        <td className="code-cell">{course.code || '-'}</td>
                        <td className="title-cell">
                            {isTr ? (course.title_tr || course.title) : (course.title_en || course.title)}
                        </td>
                        <td className="credits-cell">{course.credits}</td>
                        <td className="req-cell">
                            {course.prereq && (
                                <span className="tag tag-prereq">
                                    {isTr ? 'Ön Koşul:' : 'Prereq:'} {course.prereq}
                                </span>
                            )}
                            {course.coreq && (
                                <span className="tag tag-coreq">
                                    {isTr ? 'Yan Koşul:' : 'Coreq:'} {course.coreq}
                                </span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan="2" className="text-right">{isTr ? 'Toplam' : 'Total'}</td>
                    <td className="credits-cell font-bold">{totalCredits}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    );
};

export default CurriculumPage;
