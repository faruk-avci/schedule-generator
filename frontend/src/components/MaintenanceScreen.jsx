import { useState } from 'react';
import './MaintenanceScreen.css';

const MaintenanceScreen = ({ language: initialLanguage }) => {
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

                {/* Logo Header */}
                <div className="logo-header">
                    <div className="logo-text">OzuPlanner</div>
                </div>

                {/* 2x2 Card Grid */}
                <div className="card-grid">
                    {/* 1. Thanks Card */}
                    <div className="card thanks-card">
                        <div className="card-icon">💜</div>
                        <h2>{lang === 'tr' ? 'Teşekkürler!' : 'Thank You!'}</h2>
                        <p>
                            {lang === 'tr'
                                ? 'Ders kayıtlarınızda başarılar! OzuPlanner\'ı kullandığınız için çok teşekkür ederim. Site 4-6 Şubat tarihleri arasında kullanıma kapalı kalacaktır.'
                                : 'Good luck with your course registration! Thank you so much for using OzuPlanner. The site will be closed between February 4-6.'}
                        </p>
                    </div>

                    {/* 2. Survey Card */}
                    <div className="card survey-card">
                        <div className="card-icon">📝</div>
                        <h2>{lang === 'tr' ? 'Görüşlerinizi Paylaşın' : 'Share Your Thoughts'}</h2>
                        <p>
                            {lang === 'tr'
                                ? 'Lütfen kısa anketimize katılın ve deneyimlerinizi paylaşın.'
                                : 'Please take a moment to complete our short survey and share your feedback.'}
                        </p>
                        <a
                            href="https://docs.google.com/forms/d/e/1FAIpQLSeCaXzVr8tFIQzHJdqCrxNq95NwGIQFU8UvllBFlqvSfaOOhA/viewform?usp=sharing&ouid=109363452252301908479"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                        >
                            {lang === 'tr' ? 'Ankete Katıl' : 'Take Survey'}
                        </a>
                    </div>

                    {/* 3. SIS Warning Card */}
                    <div className="card warning-card">
                        <div className="card-icon">⚠️</div>
                        <h2>{lang === 'tr' ? 'Önemli Uyarı!' : 'Important Warning!'}</h2>
                        <p>
                            {lang === 'tr'
                                ? 'OzuPlanner resmi bir üniversite uygulaması DEĞİLDİR! Kayıtlarınızı SIS üzerinden yapın.'
                                : 'OzuPlanner is NOT an official app! Complete registration through SIS.'}
                        </p>
                        <a
                            href="https://sis.ozyegin.edu.tr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-warning"
                        >
                            {lang === 'tr' ? 'SIS\'e Git →' : 'Go to SIS →'}
                        </a>
                    </div>

                    {/* 4. Contact Card */}
                    <div className="card contact-card">
                        <div className="card-icon">💬</div>
                        <h2>{lang === 'tr' ? 'İletişim' : 'Contact'}</h2>
                        <p>
                            {lang === 'tr'
                                ? 'Sitenin açılması gerektiğini düşünüyorsanız veya sorunuz varsa bana ulaşın.'
                                : 'If you think the site should be open or have questions, reach out.'}
                        </p>
                        <a href="mailto:faruk.avci@ozu.edu.tr" className="btn-contact">
                            faruk.avci@ozu.edu.tr
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceScreen;
