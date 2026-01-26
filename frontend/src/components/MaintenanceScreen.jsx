import { useState, useEffect } from 'react';
import './MaintenanceScreen.css';

const MaintenanceScreen = ({ language: initialLanguage }) => {
    // Use local state so user can toggle on maintenance screen
    const [lang, setLang] = useState(initialLanguage || localStorage.getItem('language') || 'tr');

    const toggleLanguage = () => {
        const newLang = lang === 'tr' ? 'en' : 'tr';
        setLang(newLang);
        localStorage.setItem('language', newLang);
    };

    return (
        <div className="maintenance-screen">
            <div className="maintenance-content">
                {/* Language Toggle */}
                <button className="lang-toggle" onClick={toggleLanguage}>
                    {lang === 'tr' ? 'EN' : 'TR'}
                </button>

                <div className="maintenance-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                </div>

                <h1>
                    {lang === 'tr' ? 'Bakım Modu' : 'Under Maintenance'}
                </h1>

                <p className="maintenance-message">
                    {lang === 'tr'
                        ? 'Siteyi sizin için daha iyi hale getiriyoruz. Lütfen birkaç dakika içinde tekrar deneyin.'
                        : 'We\'re making things better for you. Please try again in a few minutes.'}
                </p>

                <div className="maintenance-eta">
                    <span className="pulse-dot"></span>
                    {lang === 'tr' ? 'Kısa sürede geri döneceğiz' : 'We\'ll be back shortly'}
                </div>

                <button
                    className="refresh-button"
                    onClick={() => window.location.reload()}
                >
                    {lang === 'tr' ? 'Sayfayı Yenile' : 'Refresh Page'}
                </button>
            </div>
        </div>
    );
};

export default MaintenanceScreen;
