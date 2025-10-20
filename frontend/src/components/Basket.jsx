import { translations } from '../utils/translations';

function Basket({ basket, onRemoveCourse, onRemoveSection, onClearBasket, onGenerate, language }) {
  const t = translations[language];
  const totalItems = basket.courses.length + basket.sections.length;

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
      
      {totalItems === 0 ? (
        <p className="empty-basket">{t.emptyBasket}</p>
      ) : (
        <div className="basket-content">
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

          <button 
            className="generate-button-basket"
            onClick={onGenerate}
          >
            🎯 {t.generateSchedules}
          </button>
        </div>
      )}
    </div>
  );
}

export default Basket;