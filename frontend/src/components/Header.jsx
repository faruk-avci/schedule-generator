import { useState } from 'react';
import { translations } from '../utils/translations';
import Analytics from '../utils/analytics';

function Header({ language, setLanguage, theme, setTheme, onNavigate, term }) {
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isTr = language === 'tr';
  const t = translations[language] || translations.tr;

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Left: Logo + Title */}
        <div
          className="header-left"
          onClick={() => onNavigate('home')}
          style={{ cursor: 'pointer' }}
        >
          <svg width="36" height="36" viewBox="0 0 32 32" className="header-logo">
            <rect width="32" height="32" rx="6" fill="#8B1538" />
            <path d="M7 10h18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M7 16h18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M7 22h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          <div className="header-title">
            <h1>OzuPlanner</h1>
            <p className="subtitle">
              {isTr ? 'Ders Programı Oluşturucu' : 'Course Schedule Builder'}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="header-right">
          <div className={`header-links-desktop ${showMobileMenu ? 'show' : ''}`}>
            {/* How to Use Link */}
            <button
              className="header-link"
              onClick={() => {
                onNavigate('how-to-use');
                setShowMobileMenu(false);
              }}
            >
              {language === 'tr' ? 'Nasıl Kullanılır?' : 'How to Use'}
            </button>

            <button
              className="header-link"
              onClick={() => {
                onNavigate('curriculum');
                setShowMobileMenu(false);
              }}
            >
              {language === 'tr' ? 'Bölüm Müfredatları' : 'Curriculums'}
            </button>

            <button
              className="header-link"
              onClick={() => {
                window.open('https://docs.google.com/forms/d/e/1FAIpQLSeCaXzVr8tFIQzHJdqCrxNq95NwGIQFU8UvllBFlqvSfaOOhA/viewform', '_blank');
                setShowMobileMenu(false);
              }}
            >
              {language === 'tr' ? 'Anket' : 'Survey'}
            </button>

            <button
              className="header-link"
              onClick={() => {
                onNavigate('contact');
                setShowMobileMenu(false);
              }}
            >
              {language === 'tr' ? 'İletişim' : 'Contact'}
            </button>


          </div>

          <div className="header-divider"></div>

          {/* Language Selector */}
          <div className="language-selector">
            <button
              className="header-button"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              onBlur={() => setTimeout(() => setShowLangDropdown(false), 200)}
              title="Change Language"
            >
              <span className="button-text">{language === 'tr' ? 'TR' : 'EN'}</span>
            </button>

            {showLangDropdown && (
              <div className="dropdown-menu">
                <button
                  className={`dropdown-item ${language === 'tr' ? 'active' : ''}`}
                  onClick={() => {
                    setLanguage('tr');
                    setShowLangDropdown(false);
                  }}
                >
                  Türkçe
                </button>
                <button
                  className={`dropdown-item ${language === 'en' ? 'active' : ''}`}
                  onClick={() => {
                    setLanguage('en');
                    setShowLangDropdown(false);
                  }}
                >
                  English
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`mobile-menu-toggle ${showMobileMenu ? 'active' : ''}`}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle Navigation"
          >
            <span className="hamburger-box">
              <span className="hamburger-inner"></span>
            </span>
          </button>
        </div>
      </div>

      {showMobileMenu && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </header>
  );
}

export default Header;