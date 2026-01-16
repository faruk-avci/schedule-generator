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

    return (
        <div className="main-container">
            {/* Header / Nav Area for Results */}
            <div className="results-header" style={{
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div>
                    <h1 style={{ marginBottom: '5px', fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                        {isTr ? 'Arama Sonuçları' : 'Search Results'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {schedules.length} {isTr ? 'program bulundu' : 'schedules found'}
                    </p>
                </div>

                <button
                    className="secondary-btn"
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    ← {isTr ? 'Programa Dön' : 'Back to Builder'}
                </button>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-wrapper" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                <div className="pagination-controls" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    backgroundColor: 'white',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                    <button
                        className="secondary-btn"
                        disabled={currentPage === 0}
                        onClick={() => {
                            setCurrentPage(p => p - 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                            opacity: currentPage === 0 ? 0.5 : 1,
                            padding: '8px 16px',
                            borderRadius: '20px'
                        }}
                    >
                        ← {isTr ? 'Önceki' : 'Prev'}
                    </button>

                    <span style={{ fontWeight: 'bold', minWidth: '80px', textAlign: 'center' }}>
                        {currentPage + 1} / {totalPages}
                    </span>

                    <button
                        className="secondary-btn"
                        disabled={currentPage >= totalPages - 1}
                        onClick={() => {
                            setCurrentPage(p => p + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                            opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
                            padding: '8px 16px',
                            borderRadius: '20px'
                        }}
                    >
                        {isTr ? 'Sonraki' : 'Next'} →
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
