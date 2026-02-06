import { useState, useEffect } from 'react';
import './DisclaimerModal.css';

const DisclaimerModal = ({ language, setLanguage }) => {
    const [showModal, setShowModal] = useState(false);
    const [currentLang, setCurrentLang] = useState(language);

    useEffect(() => {
        // Check if user has already accepted the disclaimer
        const hasAccepted = localStorage.getItem('disclaimer_accepted');
        if (!hasAccepted) {
            setShowModal(true);
            // Prevent scrolling when modal is open
            document.body.style.overflow = 'hidden';
        }
    }, []);

    // Keep internal lang in sync with prop
    useEffect(() => {
        setCurrentLang(language);
    }, [language]);

    const handleLanguageChange = (lang) => {
        setCurrentLang(lang);
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const handleAccept = () => {
        localStorage.setItem('disclaimer_accepted', 'true');
        document.body.style.overflow = '';
        setShowModal(false);
    };

    if (!showModal) return null;

    return (
        <div className="disclaimer-overlay">
            <div className="disclaimer-modal">
                {/* Language Toggle */}
                <div className="disclaimer-language-toggle">
                    <button
                        className={`lang-btn ${currentLang === 'tr' ? 'active' : ''}`}
                        onClick={() => handleLanguageChange('tr')}
                    >
                        🇹🇷 Türkçe
                    </button>
                    <button
                        className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
                        onClick={() => handleLanguageChange('en')}
                    >
                        🇬🇧 English
                    </button>
                </div>

                <div className="disclaimer-icon">⚠️</div>
                <h2 className="disclaimer-title">
                    {currentLang === 'tr' ? 'Önemli Uyarı' : 'Important Notice'}
                </h2>
                <div className="disclaimer-content">
                    <p>
                        {currentLang === 'tr'
                            ? 'Bu site resmi bir Özyeğin Üniversitesi sitesi değildir. Ders kayıtlarınızı mutlaka SIS (Öğrenci Bilgi Sistemi) üzerinden yapınız.'
                            : 'This is not an official Özyeğin University website. Please make sure to complete your course registration through SIS (Student Information System).'}
                    </p>
                    <p className="disclaimer-note">
                        {currentLang === 'tr'
                            ? 'Bu araç sadece ders programı planlamanıza yardımcı olmak için tasarlanmıştır.'
                            : 'This tool is only designed to help you plan your course schedule.'}
                    </p>
                </div>
                <button className="disclaimer-button" onClick={handleAccept}>
                    {currentLang === 'tr' ? 'Anladım' : 'I Understand'}
                </button>
            </div>
        </div>
    );
};

export default DisclaimerModal;
