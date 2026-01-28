import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { translations } from '../utils/translations';
import grain from '../analytics';

const InfoBanner = ({ language }) => {
    const [isVisible, setIsVisible] = useState(true);
    const t = translations[language];
    const navigate = useNavigate();

    useEffect(() => {
        // Check session storage on mount
        const dismissed = sessionStorage.getItem('hide_curriculum_info');
        if (dismissed === 'true') {
            setIsVisible(false);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('hide_curriculum_info', 'true');
        grain.track('info_div_closed', { source: 'info_div' });
    };

    const handleNavigate = () => {
        navigate('/curriculum');
        grain.track('click_curriculum_info', { source: 'info_div' });
    };

    if (!isVisible) return null;

    return (
        <div style={{
            backgroundColor: '#eff6ff', // Light blue background (softer)
            color: '#1e3a8a', // Dark blue text
            border: '1px solid #dbeafe',
            padding: '12px 20px',
            marginBottom: '5px', // 5px gap as requested
            marginTop: '20px', // Simple 20px top margin as requested
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '15px',
            fontSize: '15px',
            lineHeight: '1.4',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }} className="info-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500 }}>{t.curriculumInfo}</span>
                <button
                    onClick={handleNavigate}
                    style={{
                        backgroundColor: '#2563eb', // Primary blue button
                        color: 'white',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                    {t.goToCurriculum}
                </button>
            </div>

            <button
                onClick={handleDismiss}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.color = '#0f172a'}
                onMouseOut={(e) => e.target.style.color = '#64748b'}
                aria-label="Close"
            >
                ✕
            </button>
        </div>
    );
};

export default InfoBanner;
