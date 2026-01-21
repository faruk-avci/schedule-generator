import Analytics from '../utils/analytics';

function Footer({ onNavigate, language }) {
  const isTr = language === 'tr';

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>{isTr ? 'Dikkat' : 'Warning'}</h4>
          <p>
            {isTr
              ? 'OzuPlanner, Özyeğin Üniversitesi ile resmi bir bağlantısı olmayan bağımsız bir öğrenci projesidir.'
              : 'OzuPlanner is an independent student project and is NOT officially affiliated with Özyeğin University.'}
          </p>
        </div>

        <div className="footer-section">
          <h4>{isTr ? 'Veri Kaynağı' : 'Data Source'}</h4>
          <p>
            {isTr
              ? <>
                Ders bilgileri{' '}
                <a
                  target="_blank"
                  href="https://sis.ozyegin.edu.tr/OZU_GWT/WEB/CourseCatalogOfferUI?locale=tr"
                  className="footer-link"
                  onClick={() => Analytics.track('CLICK_SIS_LINK')}
                >
                  Özyeğin Üniversitesi Ders Kataloğu
                </a>
                'ndan alınan halka açık verilere dayanmaktadır.
              </>
              : <>
                Course data is based on publicly available information from{' '}
                <a
                  target="_blank"
                  href="https://sis.ozyegin.edu.tr/OZU_GWT/WEB/CourseCatalogOfferUI?locale=en"
                  className="footer-link"
                  onClick={() => Analytics.track('CLICK_SIS_LINK')}
                >
                  Özyeğin University Course Catalog
                </a>.
              </>
            }
          </p>
        </div>

        <div className="footer-section">
          <h4>{isTr ? 'Bağlantılar' : 'Links'}</h4>
          <p>
            <button onClick={() => onNavigate('terms')} className="footer-link">
              {isTr ? 'Kullanım Koşulları ve Gizlilik Politikası' : 'Terms of Service and Privacy Policy'}
            </button>
          </p>
          <p>
            <button onClick={() => onNavigate('how-to-use')} className="footer-link">
              {isTr ? 'Nasıl Kullanılır?' : 'How to Use'}
            </button>
          </p>
          <p>
            <button onClick={() => onNavigate('contact')} className="footer-link">
              {isTr ? 'İletişim' : 'Contact'}
            </button>
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-attribution">
          Designed and coded with <span>❤️</span> by{' '}
          <a
            href="https://github.com/faruk-avci"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link footer-author"
            onClick={() => Analytics.track(Analytics.Events.CLICK_GITHUB_AUTHOR)}
          >
            @faruk-avci
          </a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
