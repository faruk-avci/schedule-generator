import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './CurriculumPage.css';

// All available majors - data loaded dynamically
const AVAILABLE_MAJORS = [
    // Engineering
    { id: 'ee', tr: 'Elektrik-Elektronik Mühendisliği', en: 'Electrical-Electronics Engineering', faculty: 'engineering' },
    { id: 'cs', tr: 'Bilgisayar Mühendisliği', en: 'Computer Science', faculty: 'engineering' },
    { id: 'ai', tr: 'Yapay Zeka Mühendisliği', en: 'Artificial Intelligence Engineering', faculty: 'engineering' },
    { id: 'ie', tr: 'Endüstri Mühendisliği', en: 'Industrial Engineering', faculty: 'engineering' },
    { id: 'me', tr: 'Makine Mühendisliği', en: 'Mechanical Engineering', faculty: 'engineering' },
    { id: 'ce', tr: 'İnşaat Mühendisliği', en: 'Civil Engineering', faculty: 'engineering' },
    // Business
    { id: 'bus', tr: 'İşletme', en: 'Business Administration', faculty: 'business' },
    { id: 'econ', tr: 'Ekonomi', en: 'Economics', faculty: 'business' },
    { id: 'mis', tr: 'Yönetim Bilişim Sistemleri', en: 'Management Information Systems', faculty: 'business' },
    { id: 'uf', tr: 'Uluslararası Finans', en: 'International Finance', faculty: 'business' },
    { id: 'uti', tr: 'Uluslararası Ticaret ve İşletmecilik', en: 'International Trade and Business', faculty: 'business' },
    // Architecture & Design
    { id: 'arch_en', tr: 'Mimarlık (İngilizce)', en: 'Architecture (English)', faculty: 'architecture' },
    { id: 'arch_tr', tr: 'Mimarlık (Türkçe)', en: 'Architecture (Turkish)', faculty: 'architecture' },
    { id: 'code', tr: 'İletişim Tasarımı', en: 'Communication Design', faculty: 'architecture' },
    { id: 'ide', tr: 'Endüstriyel Tasarım', en: 'Industrial Design', faculty: 'architecture' },
    { id: 'inar', tr: 'İç Mimarlık', en: 'Interior Architecture', faculty: 'architecture' },
    // Social Sciences
    { id: 'anth', tr: 'Antropoloji', en: 'Anthropology', faculty: 'social' },
    { id: 'ir', tr: 'Uluslararası İlişkiler', en: 'International Relations', faculty: 'social' },
    { id: 'psy', tr: 'Psikoloji', en: 'Psychology', faculty: 'social' },
    // Aviation
    { id: 'avm', tr: 'Havacılık Yönetimi', en: 'Aviation Management', faculty: 'aviation' },
    { id: 'plt', tr: 'Pilotaj', en: 'Pilotage', faculty: 'aviation' },
    // Applied Sciences
    { id: 'garm', tr: 'Gastronomi ve Mutfak Sanatları', en: 'Gastronomy and Culinary Arts', faculty: 'applied' },
    { id: 'hman', tr: 'Otel Yönetimi', en: 'Hotel Management', faculty: 'applied' },
    // Law
    { id: 'huk', tr: 'Hukuk', en: 'Law', faculty: 'law' },
];

// Faculty groups for organized dropdown
const FACULTY_GROUPS = {
    engineering: { tr: 'Mühendislik', en: 'Engineering' },
    business: { tr: 'İşletme', en: 'Business' },
    architecture: { tr: 'Mimarlık ve Tasarım', en: 'Architecture & Design' },
    social: { tr: 'Sosyal Bilimler', en: 'Social Sciences' },
    aviation: { tr: 'Havacılık', en: 'Aviation' },
    applied: { tr: 'Uygulamalı Bilimler', en: 'Applied Sciences' },
    law: { tr: 'Hukuk', en: 'Law' },
};

// Map names to IDs for auto-selection
const MAJOR_NAME_MAP = {
    'Electrical-Electronics Engineering': 'ee', 'Elektrik-Elektronik Mühendisliği': 'ee',
    'Computer Science': 'cs', 'Computer Engineering': 'cs', 'Bilgisayar Mühendisliği': 'cs',
    'Artificial Intelligence Engineering': 'ai', 'Yapay Zeka Mühendisliği': 'ai',
    'Industrial Engineering': 'ie', 'Endüstri Mühendisliği': 'ie',
    'Mechanical Engineering': 'me', 'Makine Mühendisliği': 'me',
    'Civil Engineering': 'ce', 'İnşaat Mühendisliği': 'ce',
    'Business Administration': 'bus', 'İşletme': 'bus',
    'Economics': 'econ', 'Ekonomi': 'econ',
    'Management Information Systems': 'mis', 'Yönetim Bilişim Sistemleri': 'mis',
    'International Finance': 'uf', 'Uluslararası Finans': 'uf',
    'International Trade and Business': 'uti', 'International Trade and Business Management': 'uti', 'Uluslararası Ticaret ve İşletmecilik': 'uti',
    'Architecture': 'arch_en', 'Architecture (English)': 'arch_en', 'Mimarlık': 'arch_tr', 'Mimarlık (Türkçe)': 'arch_tr',
    'Communication Design': 'code', 'Communication and Design': 'code', 'İletişim Tasarımı': 'code',
    'Industrial Design': 'ide', 'Endüstriyel Tasarım': 'ide',
    'Interior Architecture': 'inar', 'Interior Architecture and Environmental Design': 'inar', 'İç Mimarlık': 'inar', 'İç Mimarlık ve Çevre Tasarımı': 'inar',
    'Anthropology': 'anth', 'Antropoloji': 'anth',
    'International Relations': 'ir', 'Uluslararası İlişkiler': 'ir',
    'Psychology': 'psy', 'Psikoloji': 'psy',
    'Aviation Management': 'avm', 'Havacılık Yönetimi': 'avm',
    'Pilotage': 'plt', 'Pilot Training': 'plt', 'Pilotaj': 'plt',
    'Gastronomy and Culinary Arts': 'garm', 'Gastronomi ve Mutfak Sanatları': 'garm',
    'Hotel Management': 'hman', 'Otel Yönetimi': 'hman',
    'Law': 'huk', 'Hukuk': 'huk',
};

// Elective type display names
const ELECTIVE_TYPE_NAMES = {
    free: { tr: 'Serbest Seçmeli', en: 'Free Elective' },
    social: { tr: 'Sosyal Bilimler Seçmeli', en: 'Social Science Elective' },
    program: { tr: 'Program Seçmeli', en: 'Program Elective' },
    certificate: { tr: 'Sertifika Seçmeli', en: 'Certificate Elective' },
    specialization: { tr: 'Özelleşme Seçmeli', en: 'Specialization Elective' },
    faculty: { tr: 'Fakülte İçi Seçmeli', en: 'Faculty Elective' },
    non_faculty: { tr: 'Fakülte Dışı Seçmeli', en: 'Non-Faculty Elective' },
    restricted: { tr: 'Kısıtlı Seçmeli', en: 'Restricted Elective' },
    social_restricted: { tr: 'Sosyal Bilimler Kısıtlı', en: 'Social Sciences Restricted' },
    finishing_project: { tr: 'Bitirme Projesi', en: 'Finishing Project' },
    design_studio: { tr: 'Tasarım Stüdyosu', en: 'Design Studio' },
    program_external: { tr: 'Program Dışı Seçmeli', en: 'External Program Elective' },
};

function CurriculumPage({ language }) {
    const isTr = language === 'tr';
    const navigate = useNavigate();
    const [selectedMajorId, setSelectedMajorId] = useState('ee');
    const [curriculum, setCurriculum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [electiveModal, setElectiveModal] = useState({ open: false, type: null, courses: [] });

    // Dynamic import function
    const loadCurriculum = useCallback(async (majorId) => {
        setLoading(true);
        setError(null);
        try {
            const module = await import(`../data/curriculums/${majorId}.json`);
            setCurriculum(module.default);
        } catch (err) {
            console.error(`Failed to load curriculum for ${majorId}:`, err);
            setError(isTr ? 'Müfredat yüklenemedi.' : 'Failed to load curriculum.');
        } finally {
            setLoading(false);
        }
    }, [isTr]);

    // Auto-select from localStorage
    useEffect(() => {
        const storedMajor = localStorage.getItem('student_major');
        if (storedMajor && MAJOR_NAME_MAP[storedMajor]) {
            setSelectedMajorId(MAJOR_NAME_MAP[storedMajor]);
        }
    }, []);

    // Load curriculum when major changes
    useEffect(() => {
        loadCurriculum(selectedMajorId);
    }, [selectedMajorId, loadCurriculum]);

    // Handle elective click
    const handleElectiveClick = (electiveType) => {
        if (!curriculum || !curriculum.electives) return;

        const courses = curriculum.electives[electiveType] || [];
        const typeName = ELECTIVE_TYPE_NAMES[electiveType] || { tr: electiveType, en: electiveType };

        setElectiveModal({
            open: true,
            type: electiveType,
            typeName: isTr ? typeName.tr : typeName.en,
            courses
        });
    };

    const closeElectiveModal = () => {
        setElectiveModal({ open: false, type: null, courses: [] });
    };

    // Dispatch event to refresh basket on mount and after changes
    const triggerGlobalBasketRefresh = () => {
        window.dispatchEvent(new Event('basketUpdated'));
    };

    // Refresh basket on mount to ensure sync
    useEffect(() => {
        triggerGlobalBasketRefresh();
    }, []);

    const [message, setMessage] = useState(null);

    // Auto-dismiss message
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Handle adding a course to schedule
    const handleAddCourse = async (course) => {
        if (!course.code) return;

        // Helper to clean course code (remove spaces, e.g. "BUS 101" -> "BUS101")
        const cleanCode = (c) => c.replace(/\s+/g, '');

        const mainCode = cleanCode(course.code);

        // Parse corequisites and clean them
        const coreqs = course.coreq
            ? course.coreq.split(/[,;]/)
                .map(c => c.trim())
                .map(c => cleanCode(c))
                .filter(c => c.length > 0)
            : [];

        const coursesToAdd = [mainCode, ...coreqs];
        const results = [];
        const errors = [];

        // Add course and all corequisites
        for (const code of coursesToAdd) {
            try {
                // Use the dedicated API domain
                const apiUrl = window.location.hostname === 'localhost'
                    ? '/api/courses/add'
                    : 'https://api.ozuplanner.com/api/courses/add';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    // Payload format: { course: "CODE", section: null }
                    body: JSON.stringify({ course: code, section: null })
                });

                const data = await response.json();

                if (data.success) {
                    results.push(code);
                } else {
                    // Extract error message nicely
                    let errMsg = data.error;
                    if (errMsg.includes('already in your basket')) {
                        errMsg = isTr ? 'Zaten sepetinizde' : 'Already in basket';
                    } else if (errMsg.includes('not found')) {
                        errMsg = isTr ? 'Bulunamadı' : 'Not found';
                    }
                    errors.push(`${code}: ${errMsg}`);
                }
            } catch (_err) {
                errors.push(`${code}: ${isTr ? 'Bağlantı hatası' : 'Connection error'}`);
            }
        }

        // Show result via Toast
        if (results.length > 0) {
            const successText = isTr
                ? `Sepete eklendi: ${results.join(', ')}`
                : `Added to basket: ${results.join(', ')}`;
            setMessage({ text: successText, type: 'success' });
            triggerGlobalBasketRefresh(); // Refresh global basket
        } else if (errors.length > 0) {
            // If nothing added, show error from first failure
            setMessage({ text: errors[0], type: 'error' });
        }

        if (errors.length > 0) {
            console.error('Errors adding courses:', errors);
        }
    };

    const _selectedMajor = AVAILABLE_MAJORS.find(m => m.id === selectedMajorId);

    return (
        <div className="terms-page-container">
            <button
                onClick={() => navigate('/')}
                className="back-button"
            >
                ← {isTr ? 'Ana Sayfaya Dön' : 'Back to Home'}
            </button>
            {/* Message Toast */}
            {message && (
                <div className={`message ${message.type}`}>
                    <span style={{ flex: 1 }}>{message.text}</span>
                    <button
                        onClick={() => setMessage(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            lineHeight: 1,
                            color: 'inherit',
                            opacity: 0.7,
                            padding: 0,
                            marginLeft: '10px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Header - Consistent with standard pages */}
            <div className="terms-header">
                <h1>{isTr ? 'Müfredat' : 'Curriculum'}</h1>
                <p className="subtitle">
                    {isTr ? '4 yıllık ders planı ve gereksinimler' : '4-year course plan and requirements'}
                </p>
            </div>

            {/* Major Selector */}
            <div className="major-selector-container" style={{
                maxWidth: '600px',
                margin: '0 auto 40px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
            }}>
                <div className="major-selector">
                    <label htmlFor="major-select">
                        {isTr ? 'Bölüm:' : 'Major:'}
                    </label>
                    <select
                        id="major-select"
                        value={selectedMajorId}
                        onChange={(e) => setSelectedMajorId(e.target.value)}
                        className="major-dropdown"
                    >
                        {Object.entries(FACULTY_GROUPS).map(([faculty, names]) => (
                            <optgroup key={faculty} label={isTr ? names.tr : names.en}>
                                {AVAILABLE_MAJORS.filter(m => m.faculty === faculty).map(major => (
                                    <option key={major.id} value={major.id}>
                                        {isTr ? major.tr : major.en}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            <main className="curriculum-content">
                {loading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>{isTr ? 'Yükleniyor...' : 'Loading...'}</p>
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && curriculum && (
                    <>
                        <h2 className="major-title">
                            {isTr ? curriculum.title_tr : curriculum.title_en}
                        </h2>

                        <div className="years-container">
                            {[1, 2, 3, 4].map(year => {
                                const yearData = curriculum.semesters?.[year];
                                if (!yearData) return null;

                                return (
                                    <div key={year} className="year-section">
                                        <div className="year-header">
                                            <span className="year-number">{year}</span>
                                            <span className="year-label">{isTr ? 'Yıl' : 'Year'}</span>
                                        </div>

                                        <div className="semesters-stack">
                                            {/* Fall */}
                                            <SemesterCard
                                                title={isTr ? 'Güz Dönemi' : 'Fall Semester'}
                                                courses={yearData.fall || []}
                                                isTr={isTr}
                                                onElectiveClick={handleElectiveClick}
                                                onAddCourse={handleAddCourse}
                                            />

                                            {/* Spring */}
                                            <SemesterCard
                                                title={isTr ? 'Bahar Dönemi' : 'Spring Semester'}
                                                courses={yearData.spring || []}
                                                isTr={isTr}
                                                onElectiveClick={handleElectiveClick}
                                                onAddCourse={handleAddCourse}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>

            {/* Elective Modal */}
            {electiveModal.open && (
                <div className="cp-modal-overlay" onClick={closeElectiveModal}>
                    <div className="cp-elective-modal" onClick={e => e.stopPropagation()}>
                        <div className="cp-modal-header">
                            <h2>{electiveModal.typeName}</h2>
                            <button onClick={closeElectiveModal} className="cp-modal-close">×</button>
                        </div>
                        <div className="cp-modal-body">
                            {electiveModal.courses && electiveModal.courses.length > 0 ? (
                                <table className="cp-elective-table">
                                    <thead>
                                        <tr>
                                            <th className="cp-col-status">{isTr ? 'Açık' : 'Open'}</th>
                                            <th className="cp-col-action">{isTr ? 'Ekle' : 'Add'}</th>
                                            <th>{isTr ? 'Kod' : 'Code'}</th>
                                            <th>{isTr ? 'Ders Adı' : 'Course Title'}</th>
                                            <th>{isTr ? 'AKTS' : 'ECTS'}</th>
                                            <th>{isTr ? 'Ön Koşul' : 'Prereq'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {electiveModal.courses.map((course, idx) => (
                                            <tr key={idx}>
                                                <td className="cp-status-cell">
                                                    <span className={`status-dot ${course.opened !== false ? 'opened' : 'closed'}`} />
                                                </td>
                                                <td className="cp-action-cell">
                                                    <button
                                                        className="add-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddCourse(course);
                                                        }}
                                                        disabled={course.opened === false}
                                                        title={course.opened !== false ? (isTr ? 'Sepete Ekle' : 'Add to Basket') : (isTr ? 'Kapalı' : 'Closed')}
                                                    >
                                                        +
                                                    </button>
                                                </td>
                                                <td className="cp-code-cell">{course.code}</td>
                                                <td className="cp-title-cell">
                                                    {isTr ? course.title_tr : course.title_en}
                                                </td>
                                                <td className="cp-credits-cell">{course.credits}</td>
                                                <td className="cp-prereq-cell">{course.prereq || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="cp-no-courses">{isTr ? 'Ders bulunamadı.' : 'No courses found.'}</p>
                            )}
                        </div>
                        <div className="cp-modal-footer">
                            <span className="cp-course-count">
                                {isTr
                                    ? `Toplam ${electiveModal.courses?.length || 0} ders`
                                    : `Total ${electiveModal.courses?.length || 0} courses`}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Semester Card Component with Column Headers
const SemesterCard = ({ title, courses, isTr, onElectiveClick, onAddCourse }) => {
    const totalCredits = courses.reduce((acc, c) => acc + (parseFloat(c.credits) || 0), 0);

    return (
        <div className="semester-card">
            <div className="semester-header">
                <h3>{title}</h3>
                <span className="credits-badge">{totalCredits} ECTS</span>
            </div>

            {/* Column Headers */}
            <div className="courses-header">
                <div className="col-status">{isTr ? 'Açık' : 'Open'}</div>
                <div className="col-code">{isTr ? 'Kod' : 'Code'}</div>
                <div className="col-name">{isTr ? 'Ders Adı' : 'Course Name'}</div>
                <div className="col-credits">ECTS</div>
                <div className="col-action">{isTr ? 'Ekle' : 'Add'}</div>
            </div>

            <div className="courses-list">
                {courses.map((course, idx) => (
                    <CourseRow
                        key={idx}
                        course={course}
                        isTr={isTr}
                        onElectiveClick={onElectiveClick}
                        onAddCourse={onAddCourse}
                    />
                ))}
            </div>
        </div>
    );
};

// Course Row Component - Clean layout with separate req lines
const CourseRow = ({ course, isTr, onElectiveClick, onAddCourse }) => {
    const isElective = !!course.electiveType;
    const title = isTr ? (course.title_tr || course.title) : (course.title_en || course.title);
    const hasPrereq = course.prereq && course.prereq.trim();
    const hasCoreq = course.coreq && course.coreq.trim();
    const isOpened = course.opened !== false;

    const handleClick = () => {
        if (isElective && onElectiveClick) {
            onElectiveClick(course.electiveType);
        }
    };

    const handleAddClick = (e) => {
        e.stopPropagation();
        if (onAddCourse && course.code) {
            onAddCourse(course);
        }
    };

    return (
        <div
            className={`course-row ${isElective ? 'elective-row' : ''} ${!isOpened ? 'course-closed' : ''}`}
            onClick={handleClick}
            role={isElective ? 'button' : undefined}
            tabIndex={isElective ? 0 : undefined}
        >
            {/* Status */}
            <div className="col-status">
                <span className={`status-dot ${isOpened ? 'opened' : 'closed'}`} />
            </div>

            {/* Code */}
            <div className="col-code">
                {course.code || <span className="elective-tag">SEÇ</span>}
            </div>

            {/* Name with Requisites on separate lines */}
            <div className="col-name">
                <div className="course-name">
                    {title}
                    {isElective && <span className="click-hint">{isTr ? ' (tıkla)' : ' (click)'}</span>}
                </div>
                {hasPrereq && (
                    <div className="req-line">
                        <span className="req-label prereq">{isTr ? 'Önkoşul:' : 'Prerequisite:'}</span>
                        <span className="req-codes">{course.prereq}</span>
                    </div>
                )}
                {hasCoreq && (
                    <div className="req-line">
                        <span className="req-label coreq">{isTr ? 'Yankoşul:' : 'Corequisite:'}</span>
                        <span className="req-codes">{course.coreq}</span>
                    </div>
                )}
            </div>

            {/* Credits */}
            <div className="col-credits">{course.credits}</div>

            {/* Add Button */}
            <div className="col-action">
                {course.code && (
                    <button
                        className="add-btn"
                        onClick={handleAddClick}
                        disabled={!isOpened}
                        title={isOpened ? (isTr ? 'Sepete Ekle' : 'Add to Basket') : (isTr ? 'Kapalı' : 'Closed')}
                    >
                        +
                    </button>
                )}
            </div>
        </div>
    );
};

// Elective Modal Component
const ElectiveModal = ({ typeName, courses, isTr, onClose }) => {
    return (
        <div className="cp-modal-overlay" onClick={onClose}>
            <div className="cp-elective-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cp-modal-header">
                    <h2>{typeName}</h2>
                    <button className="cp-modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="cp-modal-body">
                    {courses.length === 0 ? (
                        <p className="cp-no-courses">{isTr ? 'Ders bulunamadı.' : 'No courses found.'}</p>
                    ) : (
                        <table className="cp-elective-table">
                            <thead>
                                <tr>
                                    <th>{isTr ? 'Kod' : 'Code'}</th>
                                    <th>{isTr ? 'Ders Adı' : 'Course Title'}</th>
                                    <th>{isTr ? 'AKTS' : 'ECTS'}</th>
                                    <th>{isTr ? 'Ön Koşul' : 'Prereq'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((course, idx) => (
                                    <tr key={idx}>
                                        <td className="code-cell">{course.code}</td>
                                        <td className="title-cell">
                                            {isTr ? course.title_tr : course.title_en}
                                        </td>
                                        <td className="credits-cell">{course.credits}</td>
                                        <td className="prereq-cell">{course.prereq || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="modal-footer">
                    <span className="course-count">
                        {courses.length} {isTr ? 'ders' : 'courses'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CurriculumPage;
