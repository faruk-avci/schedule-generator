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
            <button
              className="generate-button-basket"
              onClick={() => onGenerate()}
            >
              {t.generateSchedules}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Basket;