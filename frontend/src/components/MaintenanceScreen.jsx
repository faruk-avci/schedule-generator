import { useState } from 'react';
import './MaintenanceScreen.css';
import Analytics from '../utils/analytics';

const MaintenanceScreen = ({ language: initialLanguage }) => {
    const [lang, setLang] = useState(initialLanguage || localStorage.getItem('language') || 'tr');
    const [showBasket, setShowBasket] = useState(false);
    const [basket, setBasket] = useState(null);
    const [savedBaskets, setSavedBaskets] = useState([]);
    const [loadingBasket, setLoadingBasket] = useState(false);
    const [expandedBasket, setExpandedBasket] = useState(null);
    const [expandedBasketData, setExpandedBasketData] = useState({});
    const [loadingExpanded, setLoadingExpanded] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    const toggleLanguage = () => {
        const newLang = lang === 'tr' ? 'en' : 'tr';
        setLang(newLang);
        localStorage.setItem('language', newLang);
        Analytics.track(Analytics.Events.MAINTENANCE_TOGGLE_LANG, { to: newLang });
    };

    const fetchBaskets = async () => {
        setLoadingBasket(true);
        try {
            // Fetch current basket
            const basketResponse = await fetch(`${API_URL}/api/courses/basket`, {
                credentials: 'include'
            });
            const basketData = await basketResponse.json();
            if (basketData.success) {
                setBasket(basketData.basket);
            }

            // Fetch saved baskets list
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

    const fetchSavedBasketDetails = async (name) => {
        if (expandedBasketData[name]) {
            // Already loaded
            setExpandedBasket(expandedBasket === name ? null : name);
            return;
        }

        setLoadingExpanded(name);
        try {
            // Use the load endpoint to get full basket data (it returns the basket contents)
            const response = await fetch(`${API_URL}/api/courses/baskets/load`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (data.success && data.basket) {
                setExpandedBasketData(prev => ({
                    ...prev,
                    [name]: data.basket
                }));
                setExpandedBasket(name);
            }
        } catch (error) {
            console.error('Error fetching basket details:', error);
        } finally {
            setLoadingExpanded(null);
        }
    };

    const handleViewBasket = () => {
        Analytics.track(Analytics.Events.MAINTENANCE_OPEN_BASKET);
        setShowBasket(true);
        if (!basket) {
            fetchBaskets();
        }
    };

    const toggleExpandBasket = (name) => {
        if (expandedBasket === name) {
            setExpandedBasket(null);
        } else {
            fetchSavedBasketDetails(name);
            Analytics.track(Analytics.Events.MAINTENANCE_EXP_SAVED_BASKET, { basketName: name });
        }
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

                {/* 2x2 Card Grid */}
                <div className="card-grid">
                    {/* 1. Thanks Card */}
                    <div className="card thanks-card">
                        <div className="card-icon">💜</div>
                        <h2>{lang === 'tr' ? 'Teşekkürler!' : 'Thank You!'}</h2>
                        <p>
                            {lang === 'tr'
                                ? 'OzuPlanner\'ı kullandığınız için çok teşekkür ederim. Ders kayıtlarınızı SIS üzerinden yapmalısınız. Güvenlik nedenleriyle site 4-6 Şubat tarihleri arasında kullanıma kapalı kalacaktır.'
                                : 'Thank you so much for using OzuPlanner. You must register for your courses through SIS. The site will be closed between February 4-6 for security reasons.'}
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
                            onClick={() => Analytics.track(Analytics.Events.MAINTENANCE_CLICK_SURVEY)}
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
                            onClick={() => Analytics.track(Analytics.Events.MAINTENANCE_CLICK_SIS)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-warning"
                        >
                            {lang === 'tr' ? 'SIS\'e Git' : 'Go to SIS'}
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

                {/* Contact Card */}
                <div className="contact-card-standalone">
                    <div className="contact-info">
                        <span className="contact-label">
                            {lang === 'tr' ? 'Sorularınız için:' : 'Questions?'}
                        </span>
                        <a href="mailto:faruk.avci@ozu.edu.tr" className="contact-email" onClick={() => Analytics.track(Analytics.Events.MAINTENANCE_CLICK_CONTACT)}>
                            faruk.avci@ozu.edu.tr
                        </a>
                    </div>
                </div>
            </div>

            {/* Basket Popup Modal */}
            {showBasket && (
                <div className="basket-modal-overlay" onClick={() => setShowBasket(false)}>
                    <div className="basket-modal basket-modal-wide" onClick={(e) => e.stopPropagation()}>
                        <button className="basket-modal-close" onClick={() => {
                            setShowBasket(false);
                            Analytics.track(Analytics.Events.MAINTENANCE_CLOSE_BASKET);
                        }}>
                            ✕
                        </button>
                        <h2>{lang === 'tr' ? 'Sepetlerim' : 'My Baskets'}</h2>

                        {loadingBasket ? (
                            <div className="basket-loading">
                                {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                            </div>
                        ) : (
                            <div className="basket-content">
                                {/* Current Basket */}
                                <div className="basket-group">
                                    <h3 className="basket-group-title">
                                        {lang === 'tr' ? 'Mevcut Sepet' : 'Current Basket'}
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
                                            {lang === 'tr' ? 'Kayıtlı Sepetler' : 'Saved Baskets'}
                                        </h3>
                                        <div className="saved-baskets-list">
                                            {savedBaskets.map((saved, i) => (
                                                <div key={i} className="saved-basket-card">
                                                    <button
                                                        className="saved-basket-header"
                                                        onClick={() => toggleExpandBasket(saved.name)}
                                                        disabled={loadingExpanded === saved.name}
                                                    >
                                                        <span className="saved-basket-name">{saved.name}</span>
                                                        <span className="saved-basket-count">
                                                            {saved.totalItems} {lang === 'tr' ? 'ders' : 'courses'}
                                                        </span>
                                                        <span className="saved-basket-toggle">
                                                            {loadingExpanded === saved.name ? '...' : (expandedBasket === saved.name ? '▲' : '▼')}
                                                        </span>
                                                    </button>
                                                    {expandedBasket === saved.name && expandedBasketData[saved.name] && (
                                                        <div className="saved-basket-content">
                                                            {expandedBasketData[saved.name].courses?.map((course, j) => (
                                                                <div key={`sc-${j}`} className="basket-item">{course}</div>
                                                            ))}
                                                            {expandedBasketData[saved.name].sections?.map((sec, j) => (
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
                                ? 'DERS KAYITLARINIZI SIS ÜZERİNDEN YAPMALISINIZ.'
                                : 'YOU MUST REGISTER FOR YOUR COURSES THROUGH SIS.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceScreen;
