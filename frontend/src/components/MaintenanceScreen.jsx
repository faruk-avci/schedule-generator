import './MaintenanceScreen.css';

const MaintenanceScreen = ({ language }) => {
    return (
        <div className="maintenance-screen">
            <div className="maintenance-content">
                <div className="maintenance-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                </div>

                <h1>
                    {language === 'tr' ? 'Bakım Modu' : 'Under Maintenance'}
                </h1>

                <p className="maintenance-message">
                    {language === 'tr'
                        ? 'Siteyi sizin için daha iyi hale getiriyoruz. Lütfen birkaç dakika içinde tekrar deneyin.'
                        : 'We\'re making things better for you. Please try again in a few minutes.'}
                </p>

                <div className="maintenance-eta">
                    <span className="pulse-dot"></span>
                    {language === 'tr' ? 'Kısa sürede geri döneceğiz' : 'We\'ll be back shortly'}
                </div>

                <button
                    className="refresh-button"
                    onClick={() => window.location.reload()}
                >
                    {language === 'tr' ? 'Sayfayı Yenile' : 'Refresh Page'}
                </button>
            </div>
        </div>
    );
};

export default MaintenanceScreen;
