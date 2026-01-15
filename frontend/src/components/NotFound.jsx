import React from 'react';

const NotFound = ({ language, onNavigate }) => {
    const isTr = language === 'tr';

    return (
        <div className="main-container" style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🕵️‍♂️</div>
            <h1 style={{ color: 'var(--ozu-burgundy)', marginBottom: '16px' }}>
                {isTr ? 'Sayfa Bulunamadı' : 'Page Not Found'}
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                {isTr
                    ? 'Aradığınız sayfayı bulamadık. Silinmiş, taşınmış veya hiç var olmamış olabilir.'
                    : "We couldn't find the page you're looking for. It might have been removed, moved, or never existed."}
            </p>
            <button
                className="add-course-btn"
                onClick={() => onNavigate('/')}
                style={{ padding: '12px 30px', fontSize: '1.1rem' }}
            >
                {isTr ? 'Anasayfaya Dön' : 'Go Back Home'}
            </button>
        </div>
    );
};

export default NotFound;
