import { useState } from 'react';

function Header({ language, setLanguage, theme, setTheme, onNavigate }) {
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Left: Logo + Title */}
        <div className="header-left">
          <svg width="40" height="40" viewBox="0 0 32 32" className="header-logo">
            <rect width="32" height="32" rx="4" fill="#FFFFFF"/>
            <rect x="5" y="6" width="22" height="20" rx="2" fill="#8B1538"/>
            <rect x="5" y="6" width="22" height="5" rx="2" fill="#FFFFFF"/>
            <circle cx="10" cy="8.5" r="1" fill="#8B1538"/>
            <circle cx="16" cy="8.5" r="1" fill="#8B1538"/>
            <circle cx="22" cy="8.5" r="1" fill="#8B1538"/>
            <line x1="6" y1="15" x2="26" y2="15" stroke="#FFFFFF" strokeWidth="1" opacity="0.3"/>
            <line x1="6" y1="19" x2="26" y2="19" stroke="#FFFFFF" strokeWidth="1" opacity="0.3"/>
            <rect x="7" y="13" width="2.5" height="1.5" rx="0.5" fill="#FFFFFF"/>
            <rect x="16" y="13" width="2.5" height="1.5" rx="0.5" fill="#FFFFFF"/>
          </svg>
          
          <div className="header-title">
            <h1>OzuPlanner</h1>
            <p className="subtitle">
              {language === 'tr' ? 'Özyeğin Üniversitesi - Ders Programı Oluşturucu' : 'Özyeğin University - Course Schedule Builder'}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="header-right">
          {/* How to Use Link */}
          <button 
            className="header-link"
            onClick={() => onNavigate('howto')}
          >
            {language === 'tr' ? 'Nasıl Kullanılır?' : 'How to Use?'}
          </button>

          {/* GitHub Link */}
          <a 
            href="https://github.com/faruk-avci/schedule-generator"
            target="_blank"
            rel="noopener noreferrer"
            className="header-link github-link"
            title="GitHub Repository"
          >
          
            GitHub
          </a>

          {/* Language Selector */}
          <div className="language-selector">
            <button 
              className="header-button"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              onBlur={() => setTimeout(() => setShowLangDropdown(false), 200)}
            >
              <span className="flag">{language === 'tr' ? '🇹🇷' : '🇬🇧'}</span>
              <span className="button-text">{language === 'tr' ? 'TR' : 'EN'}</span>
              <span className="arrow">▼</span>
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
                  🇹🇷 Türkçe
                </button>
                <button 
                  className={`dropdown-item ${language === 'en' ? 'active' : ''}`}
                  onClick={() => {
                    setLanguage('en');
                    setShowLangDropdown(false);
                  }}
                >
                  🇬🇧 English
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button 
            className="header-button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;