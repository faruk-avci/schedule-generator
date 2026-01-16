import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ScheduleList from './ScheduleList';

const ResultsPage = ({ language }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const schedules = location.state?.schedules || [];
    const initialSort = location.state?.initialSort || 'morning';

    const [currentPage, setCurrentPage] = useState(0);
    const [sortBy, setSortBy] = useState(initialSort);
    const pageSize = 50;

    // Helper: Calculate Score (Duplicate of Backend Logic for Client-Side responsiveness)
    const getScheduleScore = (schedule, preference) => {
        if (preference === 'balanced') return 0;
        let score = 0;
        schedule.lessons.forEach(lesson => {
            // We need time slots to score. 
            // The structure in 'lessons' might NOT have time slots directly if transformed?
            // Wait, ScheduleList receives 'schedules' which has 'matrix'.
            // Or 'lessons' has times?
            // Backend 'transformSchedules' returns { lessons: [...], matrix: ... }
            // 'lessons' items don't have time slots easily accessible (just names).
            // But 'matrix' has IDs.
            // Actually, we can use the MATRIX to score!
        });

        // Matrix is 5 arrays of 16 integers.
        // day[0] is Monday.
        if (!schedule.matrix) return 0;

        schedule.matrix.forEach((dayRow) => {
            dayRow.forEach((courseId, h) => {
                if (courseId !== 0) {
                    if (preference === 'morning') {
                        if (h < 5) score += (6 - h);
                    } else if (preference === 'evening') {
                        if (h >= 5) score += (h - 4);
                    }
                }
            });
        });
        return score;
    };

    const sortedSchedules = React.useMemo(() => {
        if (!schedules) return [];
        let sorted = [...schedules];
        if (sortBy !== 'balanced') {
            sorted.sort((a, b) => {
                const scoreA = getScheduleScore(a, sortBy);
                const scoreB = getScheduleScore(b, sortBy);
                return scoreB - scoreA;
            });
        }
        return sorted;
    }, [schedules, sortBy]);

    // Reset page on sort change
    useEffect(() => {
        setCurrentPage(0);
    }, [sortBy]);

    // If no data, redirect home
    useEffect(() => {
        if (!schedules || schedules.length === 0) {
            navigate('/');
        }
    }, [schedules, navigate]);

    const isTr = language === 'tr';
    const totalPages = Math.ceil(sortedSchedules.length / pageSize);
    const currentSlice = sortedSchedules.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize
    );

    return (
        <div className="results-page-container" style={{ width: '100%', maxWidth: '100%', margin: '0 auto', marginTop: '20px', display: 'flex', flexDirection: 'column' }}>
            {/* Header / Nav Area for Results */}
            <div className="results-header" style={{
                marginBottom: '20px',
                padding: '20px 25px', // slightly compacted
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                        <h1 style={{ marginBottom: '5px', fontSize: '1.8rem', color: 'var(--ozu-burgundy)' }}>
                            {isTr ? 'Arama Sonuçları' : 'Search Results'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {sortedSchedules.length} {isTr ? 'program bulundu' : 'schedules found'}
                        </p>
                    </div>

                    {/* Sorting UI */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ozu-gray)' }}>
                            {isTr ? 'Sırala:' : 'Sort By:'}
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: '#f9fafb',
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="morning">{isTr ? 'Sabah Ağırlıklı' : 'More Morning'}</option>
                            <option value="evening">{isTr ? 'Öğleden Sonra Ağırlıklı' : 'More Afternoon'}</option>
                            <option value="balanced">{isTr ? 'Dengeli (Varsayılan)' : 'Balanced / Default'}</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {/* Pagination Controls */}
                    <div className="pagination-controls" style={{
                    {/* Pagination Controls */}
                    <div className="pagination-controls" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#f9fafb',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <button
                            disabled={currentPage === 0}
                            onClick={() => {
                                setCurrentPage(p => p - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="nav-btn"
                            style={{
                                padding: '6px 14px',
                                border: 'none',
                                background: currentPage === 0 ? 'transparent' : 'white',
                                color: currentPage === 0 ? '#ccc' : 'var(--ozu-burgundy)',
                                fontWeight: '600',
                                cursor: currentPage === 0 ? 'default' : 'pointer',
                                borderRadius: '6px',
                                boxShadow: currentPage === 0 ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                        >
                            ← {isTr ? 'Önceki' : 'Prev'}
                        </button>

                        <span style={{ fontWeight: 'bold', minWidth: '80px', textAlign: 'center', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {currentPage + 1} / {totalPages}
                        </span>

                        <button
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => {
                                setCurrentPage(p => p + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="nav-btn"
                            style={{
                                padding: '6px 14px',
                                border: 'none',
                                background: currentPage >= totalPages - 1 ? 'transparent' : 'white',
                                color: currentPage >= totalPages - 1 ? '#ccc' : 'var(--ozu-burgundy)',
                                fontWeight: '600',
                                cursor: currentPage >= totalPages - 1 ? 'default' : 'pointer',
                                borderRadius: '6px',
                                boxShadow: currentPage >= totalPages - 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                        >
                            {isTr ? 'Sonraki' : 'Next'} →
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'white',
                            color: 'var(--ozu-gray)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        ✕ {isTr ? 'Kapat' : 'Close'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <ScheduleList
                schedules={currentSlice}
                language={language}
                loading={false}
                conflicts={[]} // Results page assumes valid schedules
                isLimited={false} // Don't show limit warning here
                offset={currentPage * pageSize}
            />
        </div>
    );
};

export default ResultsPage;
