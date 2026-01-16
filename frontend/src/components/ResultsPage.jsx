import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ScheduleList from './ScheduleList';

const ResultsPage = ({ language }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const schedules = location.state?.schedules || [];

    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 50;

    // If no data, redirect home
    useEffect(() => {
        if (!schedules || schedules.length === 0) {
            navigate('/');
        }
    }, [schedules, navigate]);

    const isTr = language === 'tr';
    const totalPages = Math.ceil(schedules.length / pageSize);
    const currentSlice = schedules.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize
    );

    const ResultsPage = ({ language }) => {
        // ...
        return (
            <div className="results-page-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
                {/* Header / Nav Area for Results */}
                <div className="results-header" style={{
                    marginBottom: '20px',
                    padding: '25px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div>
                        <h1 style={{ marginBottom: '5px', fontSize: '1.8rem', color: 'var(--ozu-burgundy)' }}>
                            {isTr ? 'Arama Sonuçları' : 'Search Results'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {schedules.length} {isTr ? 'program bulundu' : 'schedules found'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
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
