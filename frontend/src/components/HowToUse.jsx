import { useEffect, useRef } from 'react';
import { logPageView } from '../services/api';

function HowToUse({ language, onNavigate }) {
  const isTr = language === 'tr';
  const hasLogged = useRef(false);

  useEffect(() => {
    if (!hasLogged.current) {
      logPageView('how-to-use');
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
        <h1>{isTr ? 'Nasıl Kullanılır?' : 'How to Use?'}</h1>
        <p className="subtitle">
          {isTr
            ? 'OzuPlanner ile ders programınızı oluşturmanın ve yönetmenin en kolay yolu.'
            : 'The easiest way to create and manage your course schedule with OzuPlanner.'}
        </p>
      </div>

      {/* Step 1: Search & Add */}
      <div className="terms-card">
        <h2>1. {isTr ? 'Ders Arama ve Ekleme' : 'Searching & Adding Courses'}</h2>
        <p>
          {isTr
            ? 'Arama çubuğunu kullanarak ders kodunu (örn: BUS101, CS 101) yazın. Sonuçlarda dersin genelini veya belirli şubelerini görebilirsiniz.'
            : 'Type the course code (e.g., BUS101, CS 101) in the search bar. In the results, you can see the course generally or specific sections.'}
        </p>
        <ul style={{ marginTop: '15px', paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>
            <strong>{isTr ? 'Dersi Ekle' : 'Add Course'}:</strong> {isTr
              ? 'Dersin tüm açık şubelerini sepetinize ekler. Sistem, bu şubelerden sizin programınıza en uygun olanını otomatik olarak seçer.'
              : 'Adds all open sections of the course to your basket. The system automatically selects the one that fits your schedule best.'}
          </li>
          <li>
            <strong>{isTr ? 'Şube Ekle (Bölümleri Göster)' : 'Add Section (Show Sections)'}:</strong> {isTr
              ? 'Eğer sadece belirli bir hocadan veya saatte ders almak istiyorsanız, şubeleri açıp sadece istediğiniz "Section"ları ekleyebilirsiniz.'
              : 'If you only want to take a course from a specific professor or at a specific time, you can expand sections and add only the specific "Sections" you want.'}
          </li>
        </ul>
      </div>

      {/* Step 2: Curriculum Integration */}
      <div className="terms-card">
        <h2>2. {isTr ? 'Ders Planım ve Seçmeli Dersler' : 'My Curriculum & Elective Courses'}</h2>
        <p>
          {isTr
            ? '"Ders Planım" sayfasını kullanarak bölümünüzü seçebilir ve dönemlik ders programınızı görüntüleyebilirsiniz.'
            : 'You can use the "Curriculum" page to select your major and view your semester-by-semester course plan.'}
        </p>
        <ul style={{ marginTop: '15px', paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>
            <strong>{isTr ? 'Otomatik Ekleme' : 'Automatic Adding'}:</strong> {isTr
              ? 'Döneminizdeki zorunlu dersleri tek tıkla sepetinize ekleyebilirsiniz.'
              : 'You can add required courses from your semester to your basket with a single click.'}
          </li>
          <li>
            <strong>{isTr ? 'Seçmeli Dersler' : 'Elective Courses'}:</strong> {isTr
              ? 'Müfredatınızdaki "Alan Seçmeli" veya "Serbest Seçmeli" kutucuklarına tıklayarak, o kategoriye uygun açılan derslerin listesini görebilir ve beğendiğinizi ekleyebilirsiniz.'
              : 'By clicking on "Area Elective" or "Free Elective" boxes in your curriculum, you can see the list of available courses for that category and add the one you prefer.'}
          </li>
        </ul>
      </div>

      {/* Step 3: Basket Management */}
      <div className="terms-card">
        <h2>3. {isTr ? 'Sepet Yönetimi ve Kaydetme' : 'Basket Management & Saving'}</h2>
        <p>
          {isTr
            ? 'Sepetinizdeki dersleri görüntüleyebilir, istemediklerinizi silebilirsiniz. Ayrıca "Sepet Kaydetme" özelliği ile farklı senaryoları saklayabilirsiniz.'
            : 'You can view courses in your basket and remove unwanted ones. With the "Save Basket" feature, you can also store different scenarios.'}
        </p>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
          <strong>💡 {isTr ? 'İpucu: Sepet Kaydetme' : 'Tip: Saving Baskets'}</strong>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.95rem' }}>
            {isTr
              ? 'Birden fazla planınız mı var? Sepetinize bir isim verip "Kaydet" butonuna basarak mevcut derslerinizi saklayın. Daha sonra tek tıkla geri yükleyebilirsiniz.'
              : 'Do you have multiple plans? Name your basket and click "Save" to store your current courses. You can restore them later with a single click.'}
          </p>
        </div>
      </div>

      {/* Step 4: Preferences */}
      <div className="terms-card">
        <h2>4. {isTr ? 'Program Oluşturma Tercihleri' : 'Schedule Generation Preferences'}</h2>
        <p>
          {isTr
            ? 'Sepetiniz hazır olduğunda, sistemin size en uygun programı bulması için tercihlerinizi belirleyebilirsiniz:'
            : 'Once your basket is ready, you can set your preferences for the system to find the best schedule for you:'}
        </p>
        <ul style={{ marginTop: '15px', paddingLeft: '20px', lineHeight: '1.6' }}>
          <li><strong>{isTr ? 'Morning Person (Sabah)' : 'Morning Person'}:</strong> {isTr ? 'Dersleri mümkün olduğunca sabah saatlerine yığar.' : 'Concentrates classes in the morning hours as much as possible.'}</li>
          <li><strong>{isTr ? 'Evening Person (Akşam)' : 'Evening Person'}:</strong> {isTr ? 'Dersleri mümkün olduğunca öğleden sonraya ve akşama yığar.' : 'Concentrates classes in the afternoon and evening as much as possible.'}</li>
          <li><strong>{isTr ? 'Balanced (Dengeli)' : 'Balanced'}:</strong> {isTr ? 'Dersleri gün içine yayarak daha dengeli bir program sunar.' : 'Spreads classes throughout the day for a more balanced schedule.'}</li>
        </ul>
      </div>

      {/* Step 5: Results */}
      <div className="terms-card">
        <h2>5. {isTr ? 'Sonuçları İnceleme' : 'Reviewing Results'}</h2>
        <p>
          {isTr
            ? '"Program Oluştur" butonuna bastıktan sonra sistem olası tüm çakışmasız programları listeler. Sonuçlar arasında gezinebilir, beğendiğiniz programın görselini indirebilirsiniz.'
            : 'After clicking "Generate Schedule", the system lists all possible conflict-free schedules. You can browse results and download the image of the schedule you like.'}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="critical-warning-box" style={{ marginTop: '40px' }}>
        <div className="warning-icon">⚠️</div>
        <div className="warning-content">
          <h3>
            {isTr
              ? 'UNUTMAYIN: BU RESMİ KAYIT DEĞİLDİR'
              : 'REMEMBER: THIS IS NOT OFFICIAL REGISTRATION'}
          </h3>
          <p>
            {isTr
              ? 'Burada oluşturduğunuz program sadece planlama amaçlıdır. Ders kayıtlarınızı mutlaka Özyeğin Üniversitesi SIS sistemi üzerinden, belirtilen kayıt saatlerinde yapmanız gerekmektedir.'
              : 'The schedule you create here is for planning purposes only. You MUST complete your course registration through the Özyeğin University SIS system during the specified registration times.'}
          </p>
        </div>
      </div>

      <div style={{ height: '40px' }}></div>
    </div>
  );
}

export default HowToUse;