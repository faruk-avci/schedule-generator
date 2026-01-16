import React, { useState, useEffect } from 'react';
import ScheduleList from './ScheduleList';

const FocusMode = ({ isOpen, onClose, schedules, language = 'tr' }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 50;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; // Lock background scroll
            setCurrentPage(0);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const totalPages = Math.ceil(schedules.length / pageSize);
    const currentSlice = schedules.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize
    );

    const isTr = language === 'tr';

    return (
        <div className="focus-mode-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Helper Header */}
            <div className="focus-header" style={{
                padding: '15px 20px',
                backgroundColor: 'white',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        className="secondary-btn"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(p => p - 1)}
                        style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
                    >
                        ← {isTr ? 'Önceki' : 'Prev'}
                    </button>

                    <span style={{ fontWeight: 'bold' }}>
                        {isTr ? 'Sayfa' : 'Page'} {currentPage + 1} / {totalPages}
                    </span>

                    <button
                        className="secondary-btn"
                        disabled={currentPage >= totalPages - 1}
                        onClick={() => setCurrentPage(p => p + 1)}
                        style={{ opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}
                    >
                        {isTr ? 'Sonraki' : 'Next'} →
                    </button>

                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '0.9rem' }}>
                        ({schedules.length} {isTr ? 'programdan' : 'total'} {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, schedules.length)})
                    </span>
                </div>

                <button
                    className="close-focus-btn"
                    onClick={onClose}
                    style={{
                        padding: '8px 20px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    ✕ {isTr ? 'Kapat ve Dön' : 'Close & Return'}
                </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="focus-content" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                paddingBottom: '100px'
            }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Reuse ScheduleList but just for display */}
                    <ScheduleList
                        schedules={currentSlice}
                        language={language}
                        loading={false}
                        conflicts={[]}
                    />
                </div>
            </div>
        </div>
    );
};

export default FocusMode;
