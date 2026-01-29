import React from 'react';
import { translations } from '../utils/translations';

const WarningBanner = ({ language }) => {
    const t = translations[language];

    return (
        <div style={{
            backgroundColor: '#F5E6EB', // Light Burgundy
            color: '#A50050', // Ozu Burgundy
            border: '1px solid #c21d64', // Lighter burgundy for border
            padding: '12px 20px',
            marginBottom: '5px',
            marginTop: '5px', // Small margin to separate from InfoBanner
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center', // Center content since no close button
            gap: '15px',
            fontSize: '15px',
            lineHeight: '1.4',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            textAlign: 'center'
        }} className="warning-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <span style={{ fontWeight: 600 }}>{t.officialWarning}</span>
                <a
                    href="https://sis.ozyegin.edu.tr"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: '#82003f',
                        textDecoration: 'underline',
                        fontWeight: '700'
                    }}
                >
                    sis.ozyegin.edu.tr
                </a>
            </div>
        </div>
    );
};

export default WarningBanner;
