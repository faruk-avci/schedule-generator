import { useState, useEffect } from 'react';
import './MaintenanceScreen.css';

const MaintenanceScreen = ({ language: initialLanguage }) => {
    const [lang, setLang] = useState(initialLanguage || localStorage.getItem('language') || 'tr');
    const [showBasket, setShowBasket] = useState(false);
    const [basket, setBasket] = useState(null);
    const [loadingBasket, setLoadingBasket] = useState(false);

    const toggleLanguage = () => {
        const newLang = lang === 'tr' ? 'en' : 'tr';
        setLang(newLang);
        localStorage.setItem('language', newLang);
    };

    const fetchBasket = async () => {
        setLoadingBasket(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${API_URL}/api/courses/basket`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setBasket(data.basket);
            }
        } catch (error) {
            console.error('Error fetching basket:', error);
        } finally {
            setLoadingBasket(false);
        }
    };

    const handleViewBasket = () => {
        setShowBasket(true);
        if (!basket) {
            fetchBasket();
        }
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

                    {/* 2. View Basket Card */}
                    <div className="card basket-card">
                        <div className="card-icon">🛒</div>
                        <h2>{lang === 'tr' ? 'Sepetimi Gör' : 'View My Basket'}</h2>
                        <p>
                            {lang === 'tr'
                                ? 'Daha önce eklediğiniz dersleri görmek için tıklayın.'
                                : 'Click to see the courses you previously added.'}
                        </p>
                        <button className="btn-basket" onClick={handleViewBasket}>
                            {lang === 'tr' ? 'Sepetimi Göster' : 'Show My Basket'}
                        </button>
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

                    {/* 4. Survey Card */}
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
                </div>

                {/* Contact Info */}
                <div className="contact-footer">
                    <span>{lang === 'tr' ? 'Sorularınız için:' : 'Questions?'}</span>
                    <a href="mailto:faruk.avci@ozu.edu.tr">faruk.avci@ozu.edu.tr</a>
                </div>
            </div>

            {/* Basket Popup Modal */}
            {showBasket && (
                <div className="basket-modal-overlay" onClick={() => setShowBasket(false)}>
                    <div className="basket-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="basket-modal-close" onClick={() => setShowBasket(false)}>
                            ✕
                        </button>
                        <h2>{lang === 'tr' ? '🛒 Sepetim' : '🛒 My Basket'}</h2>

                        {loadingBasket ? (
                            <div className="basket-loading">
                                {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                            </div>
                        ) : basket ? (
                            <div className="basket-content">
                                {basket.courses?.length === 0 && basket.sections?.length === 0 ? (
                                    <p className="basket-empty">
                                        {lang === 'tr' ? 'Sepetiniz boş.' : 'Your basket is empty.'}
                                    </p>
                                ) : (
                                    <>
                                        {basket.courses?.length > 0 && (
                                            <div className="basket-section">
                                                <h3>{lang === 'tr' ? 'Dersler' : 'Courses'}</h3>
                                                <ul>
                                                    {basket.courses.map((course, i) => (
                                                        <li key={i} className="basket-item">{course}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {basket.sections?.length > 0 && (
                                            <div className="basket-section">
                                                <h3>{lang === 'tr' ? 'Şubeler' : 'Sections'}</h3>
                                                <ul>
                                                    {basket.sections.map((sec, i) => (
                                                        <li key={i} className="basket-item">
                                                            {sec.course} - {sec.section}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <p className="basket-empty">
                                {lang === 'tr' ? 'Sepet yüklenemedi.' : 'Could not load basket.'}
                            </p>
                        )}

                        <p className="basket-note">
                            {lang === 'tr'
                                ? '💡 Bu dersleri SIS\'e girerek kayıt olabilirsiniz.'
                                : '💡 You can register for these courses through SIS.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceScreen;
