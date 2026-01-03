import React, { useEffect, useRef } from 'react';
import { logPageView } from '../services/api';

const TermsOfService = ({ language, onNavigate }) => {
    const isTr = language === 'tr';
    const hasLogged = useRef(false);

    useEffect(() => {
        if (!hasLogged.current) {
            logPageView('terms');
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
                <h1>{isTr ? 'Kullanım Koşulları' : 'Terms of Service'}</h1>
                <p className="subtitle">
                    {isTr
                        ? 'Lütfen bu platformu kullanmadan önce aşağıdaki koşulları dikkatlice okuyun.'
                        : 'Please read these terms carefully before using this platform.'}
                </p>
            </div>

            {/* CRITICAL WARNING */}
            <div className="critical-warning-box">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                    <h3>
                        {isTr
                            ? 'BU PLATFORM RESMİ DERS KAYIT SİTESİ DEĞİLDİR!'
                            : 'THIS IS NOT OFFICIAL COURSE REGISTRATION SITE!'}
                    </h3>
                    <p>
                        {isTr
                            ? 'OzuPlanner sadece bir planlama aracıdır. Resmi ders kaydınızı mutlaka Özyeğin Üniversitesi SIS sistemi üzerinden yapmalısınız. Bu platform üzerinden yapılan hiçbir işlem resmi kayıt olarak kabul edilmez.'
                            : 'OzuPlanner is ONLY a planning tool. You MUST complete your official course registration through Özyeğin University\'s SIS system. No action taken on this platform constitutes official registration.'}
                    </p>
                </div>
            </div>

            {/* Affiliation Disclaimer */}
            <div className="terms-card">
                <h2>{isTr ? 'Bağımsızlık Bildirimi' : 'Independence Disclaimer'}</h2>
                <p>
                    {isTr
                        ? 'OzuPlanner, bir Özyeğin Üniversitesi öğrencisi tarafından geliştirilen tamamen bağımsız bir projedir. Özyeğin Üniversitesi ile resmi bir bağlantısı yoktur. Bu platform, üniversite yönetimi veya herhangi bir resmi birimi tarafından işletilmemektedir.'
                        : 'OzuPlanner is a completely independent project developed by a Özyeğin University student. It has NO official connection to Özyeğin University. This platform is NOT operated by the university administration or any official entity.'}
                </p>
            </div>

            {/* Data Source */}
            <div className="terms-card">
                <h2>{isTr ? 'Veri Kaynağı ve Doğruluk' : 'Data Source & Accuracy'}</h2>
                <p>
                    {isTr
                        ? 'Ders verileri, Özyeğin Üniversitesi\'nin halka açık Ders Kataloğu\'ndan alınmaktadır. Ancak, bu verilerin doğruluğu, güncelliği veya eksiksizliği garanti edilemez. Ders bilgileri, saatleri, öğretim üyeleri ve diğer detaylar değişebilir. Lütfen tüm bilgileri resmi SIS sistemi üzerinden doğrulayın.'
                        : 'Course data is sourced from Özyeğin University\'s publicly available Course Catalog. However, we do NOT guarantee the accuracy, currency, or completeness of this data. Course information, schedules, instructors, and other details may change. Please verify all information through the official SIS system.'}
                </p>
            </div>

            {/* Limitation of Liability */}
            <div className="terms-card">
                <h2>{isTr ? 'Sorumluluk Reddi' : 'Limitation of Liability'}</h2>
                <p>
                    {isTr
                        ? 'Bu araç "olduğu gibi" sunulmaktadır. Oluşturulan ders programlarının doğruluğu, uygunluğu veya herhangi bir amaç için uygunluğu konusunda hiçbir garanti verilmez. Bu platformun kullanımından kaynaklanan herhangi bir kayıp, hasar veya sorundan platform geliştiricileri sorumlu tutulamaz. Resmi ders kaydınızı yapmadan önce tüm bilgileri SIS üzerinden kontrol etmek sizin sorumluluğunuzdadır.'
                        : 'This tool is provided "AS IS" without any warranties. We make NO guarantees regarding the accuracy, suitability, or fitness for any purpose of the generated schedules. The platform developers cannot be held liable for any loss, damage, or issues arising from the use of this platform. It is YOUR responsibility to verify all information through SIS before completing your official course registration.'}
                </p>
            </div>

            {/* User Responsibility */}
            <div className="terms-card">
                <h2>{isTr ? 'Kullanıcı Sorumluluğu' : 'User Responsibility'}</h2>
                <p>
                    {isTr
                        ? 'Bu platformu kullanarak, yukarıdaki tüm koşulları kabul etmiş sayılırsınız. Ders seçiminiz ve kaydınızla ilgili tüm sorumluluk size aittir. Herhangi bir sorun yaşamanız durumunda, lütfen doğrudan Özyeğin Üniversitesi\'nin ilgili birimleriyle iletişime geçin.'
                        : 'By using this platform, you acknowledge and accept all the above terms. You bear full responsibility for your course selection and registration. If you encounter any issues, please contact the relevant departments at Özyeğin University directly.'}
                </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.6, fontSize: '0.9rem' }}>
                <p>{isTr ? 'Son Güncelleme: 28 Aralık 2025' : 'Last Updated: December 28, 2025'}</p>
            </div>
        </div>
    );
};

export default TermsOfService;
