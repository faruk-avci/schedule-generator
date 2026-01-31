import React, { useEffect, useRef } from 'react';
import { logPageView, logEvent } from '../services/api';

const SurveyPage = ({ language, onNavigate }) => {
    const isTr = language === 'tr';
    const hasLogged = useRef(false);

    useEffect(() => {
        if (!hasLogged.current) {
            logPageView('survey');
            hasLogged.current = true;
        }
    }, []);

    return (
        <div className="terms-page-container">
            <button
                onClick={() => onNavigate('home')}
                className="back-button"
            >
                ← {isTr ? 'Ana Sayfaya Dön' : 'Back to Home'}
            </button>

            <div className="terms-header">
                <h1>{isTr ? 'Anket ve Geri Bildirim' : 'Survey & Feedback'}</h1>
                <p className="subtitle">
                    {isTr
                        ? 'Deneyiminizi iyileştirmemize yardımcı olun.'
                        : 'Help us improve your experience.'}
                </p>
            </div>

            {/* Main Survey Card */}
            <div className="terms-card" style={{ textAlign: 'center', padding: '30px' }}>
                <h2>{isTr ? 'Görüşleriniz Önemli' : 'Your Feedback Matters'}</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                    {isTr
                        ? 'Uygulamayı geliştirmek için kısa anketimizi doldurursanız çok sevinirim.'
                        : 'I would appreciate it if you could fill out this short survey to help improve the application.'}
                </p>
                <a
                    href="https://forms.gle/zyrJEyniQTPZkfGn7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-submit-major"
                    onClick={() => logEvent('SURVEY_CLICK')}
                    style={{
                        display: 'inline-block',
                        textDecoration: 'none',
                        marginTop: '10px',
                        padding: '12px 24px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: 'bold'
                    }}
                >
                    {isTr ? 'Ankete Git' : 'Go to Survey'}
                </a>
            </div>
        </div>
    );
};

export default SurveyPage;
