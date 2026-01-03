import React, { useState, useEffect } from 'react';
import '../App.css';

const CookieBanner = ({ language }) => {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            // Delay slightly for smooth entrance
            setTimeout(() => setShowBanner(true), 1000);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="cookie-banner">
            <div className="cookie-content">
                <span className="cookie-icon">🍪</span>
                <div className="cookie-text">
                    <p>
                        {language === 'tr'
                            ? 'Deneyiminizi iyileştirmek için çerezleri ve anonim kullanım verilerini kullanıyoruz.'
                            : 'We use cookies and anonymous usage data to improve your scheduling experience.'}
                    </p>
                </div>
            </div>
            <button className="cookie-btn" onClick={handleAccept}>
                {language === 'tr' ? 'Tamam' : 'Got it'}
            </button>
        </div>
    );
};

export default CookieBanner;
