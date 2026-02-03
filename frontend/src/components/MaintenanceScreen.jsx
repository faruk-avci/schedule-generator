import { useState, useEffect } from 'react';
import './MaintenanceScreen.css';

const MaintenanceScreen = ({ language: initialLanguage }) => {
    const [lang, setLang] = useState(initialLanguage || localStorage.getItem('language') || 'tr');
    const [showBasket, setShowBasket] = useState(false);
    const [basket, setBasket] = useState(null);
    const [savedBaskets, setSavedBaskets] = useState([]);
    const [loadingBasket, setLoadingBasket] = useState(false);
    const [expandedBasket, setExpandedBasket] = useState(null);

    const toggleLanguage = () => {
        const newLang = lang === 'tr' ? 'en' : 'tr';
        setLang(newLang);
        localStorage.setItem('language', newLang);
    };

    const fetchBaskets = async () => {
        setLoadingBasket(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || '';

            // Fetch current basket
            const basketResponse = await fetch(`${API_URL}/api/courses/basket`, {
                credentials: 'include'
            });
            const basketData = await basketResponse.json();
            if (basketData.success) {
                setBasket(basketData.basket);
            }

            // Fetch saved baskets
            const savedResponse = await fetch(`${API_URL}/api/courses/baskets`, {
                credentials: 'include'
            });
            const savedData = await savedResponse.json();
            if (savedData.success) {
                setSavedBaskets(savedData.baskets || []);
            }
        } catch (error) {
            console.error('Error fetching baskets:', error);
        } finally {
            setLoadingBasket(false);
        }
    };

    const handleViewBasket = () => {
        setShowBasket(true);
        if (!basket) {
            fetchBaskets();
        }
    };

    const toggleExpandBasket = (name) => {
        setExpandedBasket(expandedBasket === name ? null : name);
    };

    const hasCurrentBasket = basket && (basket.courses?.length > 0 || basket.sections?.length > 0);
    const hasSavedBaskets = savedBaskets.length > 0;

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

                {/* 2x2 Card Grid - Desktop: Thanks, Survey, Warning, Basket */}
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

                    {/* 4. View Basket Card */}
                    <div className="card basket-card">
                        <div className="card-icon">🛒</div>
                        <h2>{lang === 'tr' ? 'Sepetlerimi Gör' : 'View My Baskets'}</h2>
                        <p>
                            {lang === 'tr'
                                ? 'Kaydettiğiniz ve mevcut sepetinizdeki dersleri görün.'
                                : 'View your saved baskets and current basket courses.'}
                        </p>
                        <button className="btn-basket" onClick={handleViewBasket}>
                            {lang === 'tr' ? 'Sepetlerimi Göster' : 'Show My Baskets'}
                        </button>
                    </div>
                </div>

                {/* Contact Card - Better Design */}
                <div className="contact-card-standalone">
                    <div className="contact-icon">💬</div>
                    <div className="contact-info">
                        <span className="contact-label">
                            {lang === 'tr' ? 'Sorularınız veya geri bildirimleriniz için:' : 'Questions or feedback?'}
                        </span>
                        <a href="mailto:faruk.avci@ozu.edu.tr" className="contact-email">
                            <span className="email-icon">✉️</span>
                            faruk.avci@ozu.edu.tr
                        </a>
                    </div>
                </div>
            </div>

            {/* Basket Popup Modal */}
            {showBasket && (
                <div className="basket-modal-overlay" onClick={() => setShowBasket(false)}>
                    <div className="basket-modal basket-modal-wide" onClick={(e) => e.stopPropagation()}>
                        <button className="basket-modal-close" onClick={() => setShowBasket(false)}>
                            ✕
                        </button>
                        <h2>{lang === 'tr' ? '🛒 Sepetlerim' : '🛒 My Baskets'}</h2>

                        {loadingBasket ? (
                            <div className="basket-loading">
                                {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                            </div>
                        ) : (
                            <div className="basket-content">
                                {/* Current Basket */}
                                <div className="basket-group">
                                    <h3 className="basket-group-title">
                                        {lang === 'tr' ? '📦 Mevcut Sepet' : '📦 Current Basket'}
                                    </h3>
                                    {hasCurrentBasket ? (
                                        <div className="basket-items-grid">
                                            {basket.courses?.map((course, i) => (
                                                <div key={`c-${i}`} className="basket-item">{course}</div>
                                            ))}
                                            {basket.sections?.map((sec, i) => (
                                                <div key={`s-${i}`} className="basket-item">
                                                    {sec.course} - {sec.section}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="basket-empty-inline">
                                            {lang === 'tr' ? 'Sepetiniz boş.' : 'Your basket is empty.'}
                                        </p>
                                    )}
                                </div>

                                {/* Saved Baskets */}
                                {hasSavedBaskets && (
                                    <div className="basket-group">
                                        <h3 className="basket-group-title">
                                            {lang === 'tr' ? '💾 Kayıtlı Sepetler' : '💾 Saved Baskets'}
                                        </h3>
                                        <div className="saved-baskets-list">
                                            {savedBaskets.map((saved, i) => (
                                                <div key={i} className="saved-basket-card">
                                                    <button
                                                        className="saved-basket-header"
                                                        onClick={() => toggleExpandBasket(saved.name)}
                                                    >
                                                        <span className="saved-basket-name">📁 {saved.name}</span>
                                                        <span className="saved-basket-count">
                                                            {(saved.courses?.length || 0) + (saved.sections?.length || 0)} {lang === 'tr' ? 'ders' : 'courses'}
                                                        </span>
                                                        <span className="saved-basket-toggle">
                                                            {expandedBasket === saved.name ? '▲' : '▼'}
                                                        </span>
                                                    </button>
                                                    {expandedBasket === saved.name && (
                                                        <div className="saved-basket-content">
                                                            {saved.courses?.map((course, j) => (
                                                                <div key={`sc-${j}`} className="basket-item">{course}</div>
                                                            ))}
                                                            {saved.sections?.map((sec, j) => (
                                                                <div key={`ss-${j}`} className="basket-item">
                                                                    {sec.course} - {sec.section}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!hasCurrentBasket && !hasSavedBaskets && (
                                    <p className="basket-empty">
                                        {lang === 'tr' ? 'Hiç sepetiniz yok.' : 'You have no baskets.'}
                                    </p>
                                )}
                            </div>
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
