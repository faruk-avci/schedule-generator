import { useState } from 'react';
import { translations, getDayName } from '../utils/translations';

function SearchResults({ courses, onAddCourse, onAddSection, loading, language = 'tr', hasSearched = false }) {
  const t = translations[language] || translations.tr;
  const [expandedCourses, setExpandedCourses] = useState(new Set());

  const toggleCourse = (courseCode) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseCode)) {
      newExpanded.delete(courseCode);
    } else {
      newExpanded.add(courseCode);
    }
    setExpandedCourses(newExpanded);
  };

  const expandAll = () => {
    setExpandedCourses(new Set(courses.map(c => c.course_code)));
  };

  const collapseAll = () => {
    setExpandedCourses(new Set());
  };

  if (loading) {
    return <div className="loading">{t.searching}</div>;
  }

  if (!courses || courses.length === 0) {
    // Only show "no results" if user has actually performed a search
    if (!hasSearched) {
      return null; // Don't show anything if user hasn't searched yet
    }
    return <div className="no-results">{t.noResults}</div>;
  }

  return (
    <div className="results-container">
      {/* Expand/Collapse All Buttons */}
      {courses.length > 1 && (
        <div className="results-controls">
          <button className="control-btn" onClick={expandAll}>
            {language === 'tr' ? '📖 Tümünü Aç' : '📖 Expand All'}
          </button>
          <button className="control-btn" onClick={collapseAll}>
            {language === 'tr' ? '📕 Tümünü Kapat' : '📕 Collapse All'}
          </button>
        </div>
      )}

      <div className="results-list">
        {courses.map((course, index) => {
          const isExpanded = expandedCourses.has(course.course_code);

          return (
            <div key={index} className="course-card">
              <div className="course-header">
                <div className="course-title-section">
                  <div className="course-title-row">
                    <h3 className="course-code-display">{course.course_code}</h3>
                    <h4 className="course-name-display">{course.course_name}</h4>
                  </div>
                  {course.description && (
                    <p className="course-desc">{course.description}</p>
                  )}
                </div>
                <span className="credits">{course.credits} {t.credits}</span>
              </div>

              <div className="course-actions">
                <div className="course-actions-left">
                  <button
                    className="add-course-btn"
                    onClick={() => onAddCourse(course.course_code)}
                  >
                    + {t.addEntireCourse}
                  </button>
                </div>
                <div className="course-actions-right">
                  <button
                    className="add-course-btn"
                    onClick={() => toggleCourse(course.course_code)}
                  >
                    {expandedCourses.has(course.course_code)
                      ? (language === 'tr' ? 'Şubeleri Gizle' : 'Hide Sections')
                      : (language === 'tr' ? 'Şubeleri Göster' : 'Show Sections')
                    }
                  </button>
                  <span className="section-count">
                    {course.sections.length} {language === 'tr' ? 'şube' : 'sections'}
                  </span>
                </div>
              </div>

              {/* Collapsible Sections */}
              {isExpanded && (
                <div className="sections-list">
                  <h4>{t.sections}</h4>
                  {course.sections.map((section, idx) => (
                    <div key={idx} className="section-item">
                      <div className="section-info">
                        <strong>{section.section_name}</strong>
                        <span className="lecturer">{section.lecturer}</span>

                        {section.times && section.times.length > 0 && (
                          <div className="times">
                            {section.times.map((time, tIdx) => (
                              <span key={tIdx} className="time-slot">
                                {getDayName(time.day, language)}: {time.start} - {time.end}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        className="add-section-btn"
                        onClick={() => onAddSection(course.course_code, section.section_name)}
                      >
                        + {t.addSection}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SearchResults;