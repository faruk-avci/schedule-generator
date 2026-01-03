import React, { useEffect, useRef } from 'react';
import { logPageView } from '../services/api';

const Contact = ({ language, onNavigate }) => {
    const isTr = language === 'tr';
    const hasLogged = useRef(false);

    useEffect(() => {
        if (!hasLogged.current) {
            logPageView('contact');
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
                <h1>{isTr ? 'İletişim & Geri Bildirim' : 'Contact & Feedback'}</h1>
                <p className="subtitle">
                    {isTr
                        ? 'OzuPlanner\'ı geliştirmeme yardımcı olun! Her türlü öneri ve görüşe açığım.'
                        : 'Help me improve OzuPlanner! I am open to all suggestions and feedback.'}
                </p>
            </div>

            {/* Main Contact Card */}
            <div className="terms-card" style={{ textAlign: 'center', padding: '30px' }}>
                <h2>{isTr ? 'Bana Ulaşın' : 'Reach Out to Me'}</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                    {isTr
                        ? 'Herhangi bir hata bildirimi, özellik önerisi veya genel düşünceleriniz için bana e-posta gönderebilirsiniz.'
                        : 'Feel free to send me an email for any bug reports, feature suggestions, or general thoughts.'}
                </p>
                <a
                    href="mailto:faruk.avci@ozu.edu.tr"
                    className="btn-submit-major"
                    style={{
                        display: 'inline-block',
                        textDecoration: 'none',
                        marginTop: '10px'
                    }}
                >
                    faruk.avci@ozu.edu.tr
                </a>
            </div>


            {/* Contribution Disclaimer */}
            <div className="terms-card">
                <h2>{isTr ? 'Geliştiriciden Not' : 'A Note from the Developer'}</h2>
                <p>
                    {isTr
                        ? 'Bu proje, öğrenci hayatını biraz daha kolaylaştırmak amacıyla boş zamanlarımda geliştirilmektedir. Sabrınız ve desteğiniz için teşekkürler!'
                        : 'This project is being developed in my spare time with the aim of making student life a bit easier. Thank you for your patience and support!'}
                </p>
            </div>

        </div>
    );
};

export default Contact;
