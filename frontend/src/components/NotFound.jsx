import React from 'react';

const NotFound = ({ language, onNavigate }) => {
    const isTr = language === 'tr';

    return (
        <div className="main-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            padding: '40px 20px'
        }}>
            <h1 style={{
                fontSize: '120px',
                fontWeight: '800',
                color: 'var(--ozu-burgundy)',
                lineHeight: '1',
                marginBottom: '10px',
                opacity: '0.1'
            }}>
                404
            </h1>

            <h2 style={{
                fontSize: '2rem',
                color: 'var(--text-primary)',
                marginBottom: '16px',
                marginTop: '-60px' // Overlap effect
            }}>
                {isTr ? 'Sayfa Bulunamadı' : 'Page Not Found'}
            </h2>

            <p style={{
                fontSize: '1.1rem',
                color: 'var(--text-secondary)',
                marginBottom: '32px',
                maxWidth: '450px',
                lineHeight: '1.6'
            }}>
                {isTr
                    ? 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.'
                    : "The page you are looking for doesn't exist or has been moved."}
            </p>

            <button
                className="add-course-btn"
                onClick={() => onNavigate('/')}
                style={{
                    padding: '12px 32px',
                    fontSize: '1rem',
                    minWidth: 'auto' // Override any full-width defaults
                }}
            >
                {isTr ? 'Anasayfaya Dön' : 'Back to Home'}
            </button>
        </div>
    );
};

export default NotFound;
