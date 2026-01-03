import { useState } from 'react';
import { translations } from '../utils/translations';

function Basket({
  basket,
  onRemoveCourse,
  onRemoveSection,
  onClearBasket,
  onGenerate,
  language,
  savedBaskets = [],
  onSaveBasket,
  onLoadBasket,
  onRemoveSavedBasket
}) {
  const t = translations[language];
  const totalItems = basket.courses.length + basket.sections.length;
  const [preferences, setPreferences] = useState({
    morning: 0, // 1: Morning, 0: Balanced, -1: Afternoon
    freeDays: false
  });
  const [basketName, setBasketName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const handleSave = () => {
    if (basketName.trim()) {
      onSaveBasket(basketName);
      setBasketName('');
      setShowSaveInput(false);
    }
  };

  return (
    <div className="basket-section">
      <div className="basket-header">
        <h2>{t.myBasket} ({totalItems})</h2>
        {totalItems > 0 && (
          <button className="clear-basket-btn" onClick={onClearBasket}>
            {t.clearAll}
          </button>
        )}
      </div>

      {totalItems === 0 && savedBaskets.length === 0 ? (
        <p className="empty-basket">{t.emptyBasket}</p>
      ) : (
        <div className="basket-content">
          {/* Current Basket Items */}
          {basket.courses.length > 0 && (
            <div className="basket-group">
              <h3>{t.entireCourses}</h3>
              <ul className="basket-list">
                {basket.courses.map((course, idx) => (
                  <li key={idx} className="basket-item">
                    <span>{course}</span>
                    <button
                      className="remove-btn"
                      onClick={() => onRemoveCourse(course)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {basket.sections.length > 0 && (
            <div className="basket-group">
              <h3>{t.specificSections}</h3>
              <ul className="basket-list">
                {basket.sections.map((section, idx) => (
                  <li key={idx} className="basket-item">
                    <span>{section.course} - {section.section}</span>
                    <button
                      className="remove-btn"
                      onClick={() => onRemoveSection(section.course, section.section)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Save Basket UI */}
          {totalItems > 0 && (
            <div className="save-basket-container">
              {!showSaveInput ? (
                <button
                  className="show-save-btn"
                  onClick={() => setShowSaveInput(true)}
                >
                  {t.saveThisBasket}
                </button>
              ) : (
                <div className="save-basket-input-group">
                  <input
                    type="text"
                    placeholder={t.basketNamePlaceholder}
                    value={basketName}
                    onChange={(e) => setBasketName(e.target.value)}
                    autoFocus
                  />
                  <button className="confirm-save-btn" onClick={handleSave}>
                    {t.save}
                  </button>
                  <button className="cancel-save-btn" onClick={() => setShowSaveInput(false)}>
                    {t.cancel}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Saved Baskets List */}
          {savedBaskets.length > 0 && (
            <div className="saved-baskets-section">
              <h3>{t.yourSavedBaskets}</h3>
              <div className="saved-baskets-list">
                {savedBaskets.map((b, idx) => (
                  <div key={idx} className="saved-basket-item">
                    <div className="saved-basket-info">
                      <span className="saved-basket-name">{b.name}</span>
                      <span className="saved-basket-meta">{b.totalItems} {t.totalItems}</span>
                    </div>
                    <div className="saved-basket-actions">
                      <button
                        className="load-basket-btn-text"
                        onClick={() => onLoadBasket(b.name)}
                      >
                        {t.load}
                      </button>
                      <button
                        className="remove-saved-btn-text"
                        onClick={() => onRemoveSavedBasket(b.name)}
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {totalItems > 0 && (
            <>
              <div className="preferences-panel">
                <div className="pref-header">
                  <span className="pref-title">{language === 'tr' ? 'Tercihler' : 'Preferences'}</span>
                </div>

                <div className="pref-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.freeDays}
                      onChange={(e) => setPreferences({ ...preferences, freeDays: e.target.checked })}
                    />
                    {language === 'tr' ? 'Boş Günleri Maksimize Et' : 'Maximize Free Days'}
                  </label>
                </div>

                <div className="pref-item">
                  <label>{language === 'tr' ? 'Zaman Tercihi:' : 'Time Preference:'}</label>
                  <div className="time-pref-controls">
                    <button
                      className={`time-btn ${preferences.morning === 1 ? 'active' : ''}`}
                      onClick={() => setPreferences({ ...preferences, morning: 1 })}
                      title={language === 'tr' ? 'Sabah Derslerini Önceliklendir' : 'Prefer Morning Classes'}
                    >
                      {language === 'tr' ? 'Sabah' : 'Morning'}
                    </button>
                    <button
                      className={`time-btn ${preferences.morning === 0 ? 'active' : ''}`}
                      onClick={() => setPreferences({ ...preferences, morning: 0 })}
                      title={language === 'tr' ? 'Dengeli' : 'Balanced'}
                    >
                      {language === 'tr' ? 'Dengeli' : 'Balanced'}
                    </button>
                    <button
                      className={`time-btn ${preferences.morning === -1 ? 'active' : ''}`}
                      onClick={() => setPreferences({ ...preferences, morning: -1 })}
                      title={language === 'tr' ? 'Öğleden Sonrayı Önceliklendir' : 'Prefer Afternoon'}
                    >
                      {language === 'tr' ? 'Öğlen' : 'Afternoon'}
                    </button>
                  </div>
                </div>
              </div>

              <button
                className="generate-button-basket"
                onClick={() => onGenerate(preferences)}
              >
                {t.generateSchedules}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Basket;