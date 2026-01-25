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
                        ? 'Lütfen bu platformu kullanmadan önce aşağıdaki koşulları dikkatlice okuyunuz.'
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
                            ? 'OzuPlanner yalnızca bir planlama aracıdır. Resmi ders kaydınızı mutlaka Özyeğin Üniversitesi SIS sistemi üzerinden yapmalısınız. Bu platform üzerinden yapılan hiçbir işlem resmi kayıt olarak kabul edilmez.'
                            : 'OzuPlanner is ONLY a planning tool. You MUST complete your official course registration through Özyeğin University\'s SIS system. No action taken on this platform constitutes official registration.'}
                    </p>
                </div>
            </div>

            {/* Affiliation Disclaimer */}
            <div className="terms-card">
                <h2>{isTr ? 'Bağımsızlık Bildirimi' : 'Independence Disclaimer'}</h2>
                <p>
                    {isTr
                        ? 'OzuPlanner, bir Özyeğin Üniversitesi öğrencisi tarafından geliştirilen tamamen bağımsız bir projedir. Özyeğin Üniversitesi ile herhangi bir resmi bağlantısı yoktur. Üniversite yönetimi veya resmi bir birim tarafından işletilmemektedir.'
                        : 'OzuPlanner is a completely independent project developed by a Özyeğin University student. It has NO official connection to Özyeğin University. This platform is NOT operated by the university administration or any official entity.'}
                </p>
            </div>

            {/* Data Source */}
            <div className="terms-card">
                <h2>{isTr ? 'Veri Kaynağı ve Doğruluk' : 'Data Source & Accuracy'}</h2>
                <p>
                    {isTr
                        ? 'Ders verileri, Özyeğin Üniversitesi’nin halka açık Ders Kataloğu’ndan alınmaktadır. Bu verilerin doğruluğu, güncelliği veya eksiksizliği garanti edilmez. Ders bilgileri, saatleri ve öğretim üyeleri zaman içinde değişebilir. Tüm bilgilerin resmi SIS sistemi üzerinden doğrulanması kullanıcının sorumluluğundadır.'
                        : 'Course data is sourced from Özyeğin University\'s publicly available Course Catalog. However, we do NOT guarantee the accuracy, currency, or completeness of this data. Course information, schedules, instructors, and other details may change. Please verify all information through the official SIS system.'}
                </p>
            </div>

            {/* Curriculum and Electives Disclaimer */}
            <div className="terms-card">
                <h2>{isTr ? 'Ders Planları ve Seçmeli Ders Listeleri Hakkında' : 'About Course Plans and Elective Course Lists'}</h2>
                <p>
                    {isTr
                        ? 'OzuPlanner üzerinde sunulan ders planları, program müfredatları ve seçmeli ders listeleri Özyeğin Üniversitesi’nin resmi web sitesinde kamuya açık olarak paylaşılan bilgilerden derlenmiştir. Bu bilgiler bilgilendirme amaçlıdır ve resmi akademik geçerliliğe sahip değildir.'
                        : 'The course plans, program curriculums, and elective course lists presented on OzuPlanner are compiled from publicly available information on Özyeğin University\'s official website. This information is for informational purposes only and does not have official academic validity.'}
                </p>
                <p>
                    {isTr
                        ? 'Üniversite, ders içerikleri, müfredatlar ve seçmeli ders listelerinde zaman zaman değişiklik yapabilir. OzuPlanner bu değişiklikleri anlık olarak yansıtmayabilir.'
                        : 'The University may make changes to course content, curriculums, and elective course lists from time to time. OzuPlanner may not reflect these changes instantly.'}
                </p>
                <p>
                    {isTr
                        ? 'Öğrenciler, mezuniyet koşulları, ders uygunlukları ve seçmeli ders geçerlilikleri için mutlaka SIS ve üniversitenin resmi kaynaklarını esas almalıdır.'
                        : 'Students must strictly rely on SIS and the university\'s official resources for graduation requirements, course eligibility, and elective course validity.'}
                </p>
            </div>

            {/* Limitation of Liability */}
            <div className="terms-card">
                <h2>{isTr ? 'Sorumluluk Reddi' : 'Limitation of Liability'}</h2>
                <p>
                    {isTr
                        ? 'Bu platform “olduğu gibi” sunulmaktadır. Oluşturulan ders programlarının doğruluğu, uygunluğu veya herhangi bir amaç için uygunluğu konusunda açık veya zımni hiçbir garanti verilmez. Platformun kullanımından doğabilecek doğrudan veya dolaylı hiçbir zarardan geliştirici sorumlu tutulamaz.'
                        : 'This tool is provided "AS IS" without any warranties. We make NO guarantees regarding the accuracy, suitability, or fitness for any purpose of the generated schedules. The platform developers cannot be held liable for any loss, damage, or issues arising from the use of this platform.'}
                </p>
            </div>

            {/* Technical Records */}
            <div className="terms-card">
                <h2>{isTr ? 'Teknik Kayıtlar ve Loglama' : 'Technical Records and Logging'}</h2>
                <p>
                    {isTr
                        ? 'Platformun güvenliğini sağlamak, hataları tespit etmek ve kötüye kullanımı önlemek amacıyla kullanıcıların IP adresleri, tarayıcı bilgileri ve işlem kayıtları (loglar) tutulabilir.'
                        : 'IP addresses, browser information, and transaction logs may be kept to ensure platform security, detect errors, and prevent misuse.'}
                </p>
            </div>

            {/* Service Continuity */}
            <div className="terms-card">
                <h2>{isTr ? 'Hizmet Sürekliliği' : 'Service Continuity'}</h2>
                <p>
                    {isTr
                        ? 'Platformun kesintisiz veya hatasız çalışacağı garanti edilmez. Teknik arızalar, bakım çalışmaları veya üçüncü taraf hizmetlerinden kaynaklanan kesintilerden geliştirici sorumlu değildir.'
                        : 'It is not guaranteed that the platform will work uninterrupted or without errors. The developer is not responsible for interruptions caused by technical malfunctions, maintenance work, or third-party services.'}
                </p>
            </div>

            {/* User Responsibility */}
            <div className="terms-card">
                <h2>{isTr ? 'Kullanıcı Sorumluluğu' : 'User Responsibility'}</h2>
                <p>
                    {isTr
                        ? 'Bu platformu kullanarak yukarıdaki tüm koşulları kabul etmiş sayılırsınız. Ders seçiminiz ve resmi kayıt işlemlerinizle ilgili tüm sorumluluk size aittir.'
                        : 'By using this platform, you acknowledge and accept all the above terms. You bear full responsibility for your course selection and official registration procedures.'}
                </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '40px', opacity: 0.6, fontSize: '0.9rem' }}>
                <p>{isTr ? 'Son Güncelleme: 25 Ocak 2026' : 'Last Updated: January 25, 2026'}</p>
            </div>

            {/* Privacy Policy Section */}
            <div className="terms-header" style={{ marginTop: '60px' }}>
                <h1>{isTr ? 'Gizlilik Politikası' : 'Privacy Policy'}</h1>
                <p className="subtitle">
                    {isTr
                        ? 'Bu platform, kullanıcı deneyimini iyileştirmek, sistem güvenliğini sağlamak ve kötüye kullanımı önlemek amacıyla sınırlı ölçüde veri toplamaktadır.'
                        : 'This platform collects limited data to improve user experience, ensure system security, and prevent misuse.'}
                </p>
            </div>

            <div className="terms-card">
                <h2>{isTr ? 'Toplanan Veriler' : 'Collected Data'}</h2>
                {isTr ? (
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li>IP adresi</li>
                        <li>Tarayıcı ve cihaz bilgileri (User-Agent)</li>
                        <li>Sayfa görüntüleme ve kullanım istatistikleri</li>
                        <li>Güvenlik ve hata ayıklama amaçlı işlem kayıtları (loglar)</li>
                    </ul>
                ) : (
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li>IP address</li>
                        <li>Browser and device information (User-Agent)</li>
                        <li>Page viewing and usage statistics</li>
                        <li>Transaction logs for security and debugging purposes</li>
                    </ul>
                )}
            </div>

            <div className="terms-card">
                <h2>{isTr ? 'Çerezler (Cookies)' : 'Cookies'}</h2>
                <p>
                    {isTr
                        ? 'Platform, temel işlevlerin çalışması ve anonim kullanım istatistikleri oluşturmak amacıyla çerezler kullanabilir. Çerezler kimlik belirleyici kişisel bilgiler içermez.'
                        : 'The platform may use cookies to enable basic functions and create anonymous usage statistics. Cookies do not contain personally identifiable information.'}
                </p>
            </div>

            <div className="terms-card">
                <h2>{isTr ? 'Amaç' : 'Purpose'}</h2>
                {isTr ? (
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li>Platform güvenliğini sağlamak</li>
                        <li>Hataları tespit etmek ve gidermek</li>
                        <li>Kötüye kullanımı ve otomatik saldırıları önlemek</li>
                        <li>Anonim kullanım istatistikleri oluşturmak</li>
                    </ul>
                ) : (
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li>To ensure platform security</li>
                        <li>To detect and fix errors</li>
                        <li>To prevent misuse and automated attacks</li>
                        <li>To create anonymous usage statistics</li>
                    </ul>
                )}
            </div>

            <div className="terms-card">
                <h2>{isTr ? 'Veri Paylaşımı' : 'Data Sharing'}</h2>
                <p>
                    {isTr
                        ? 'Toplanan veriler hiçbir üçüncü tarafla paylaşılmaz, satılmaz ve ticari amaçla kullanılmaz.'
                        : 'Collected data is not shared with, sold to, or used for commercial purposes by any third party.'}
                </p>
            </div>

            <div className="terms-card">
                <h2>{isTr ? 'Saklama Süresi' : 'Storage Period'}</h2>
                <p>
                    {isTr
                        ? 'Teknik log kayıtları ve güvenlik verileri makul süre boyunca saklanır ve amacı ortadan kalktığında silinir.'
                        : 'Technical log records and security data are stored for a reasonable period and deleted when their purpose ceases to exist.'}
                </p>
            </div>

            <div className="terms-card">
                <h2>{isTr ? 'Kullanıcı Hakları' : 'User Rights'}</h2>
                <p>
                    {isTr
                        ? 'Kullanıcılar, kendileriyle ilgili verilerin işlenmesine ilişkin bilgi talep edebilir. İletişim için privacy@ozuplanner.com adresine ulaşabilirsiniz.'
                        : 'Users may request information regarding the processing of data concerning them. You can reach us at privacy@ozuplanner.com.'}
                </p>
            </div>

            <div className="terms-card" style={{ marginTop: '40px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                <p style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {isTr
                        ? 'Bu platform ticari bir hizmet değildir ve bir öğrenci projesi kapsamında sunulmaktadır.'
                        : 'This platform is not a commercial service and is offered as part of a student project.'}
                </p>
            </div>

            <div style={{ height: '40px' }}></div>
        </div>
    );
};

export default TermsOfService;
