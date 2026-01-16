import { useState } from 'react';
import { translations } from '../utils/translations';

function Basket({
  basket,
  onRemoveCourse,
  onRemoveSection,
  onClearBasket,
  onGenerate,
  loading,
  language,
  savedBaskets = [],
  onSaveBasket,
  onLoadBasket,
  onRemoveSavedBasket,
  preference,
  setPreference
}) {
  const t = translations[language];
  const totalItems = basket.courses.length + basket.sections.length;
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
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {language === 'tr' ? 'Sıralama Tercihi' : 'Sorting Preference'}
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={preference}
                    onChange={(e) => setPreference(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'white',
                      fontSize: '15px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      appearance: 'none',
                      fontWeight: '500',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <option value="morning">{language === 'tr' ? '☀️ Sabah Ağırlıklı (Erken Bitir)' : '☀️ More Morning (Finish Early)'}</option>
                    <option value="evening">{language === 'tr' ? '🌙 Öğlen Ağırlıklı (Geç Başla)' : '🌙 More Afternoon (Start Late)'}</option>
                    <option value="balanced">{language === 'tr' ? '⚖️ Dengeli / Karışık' : '⚖️ Balanced / Mixed'}</option>
                  </select>
                  <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>▼</div>
                </div>
              </div>

              <button
                className="generate-button-basket"
                onClick={() => onGenerate()}
                disabled={loading}
              >
                {loading ? (language === 'tr' ? 'Oluşturuluyor...' : 'Generating...') : t.generateSchedules}
              </button>
          )}
            </div>
      )}
        </div>
      );
}

      export default Basket;