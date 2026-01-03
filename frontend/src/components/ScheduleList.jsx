import { useState } from 'react';
import { exportAsImage, exportAsPDF, exportAsICS } from '../utils/exportSchedule';
import { translations, getDayName } from '../utils/translations';

function ScheduleList({ schedules, conflicts = [], loading, language = 'tr' }) {
  const [selectedSchedule, setSelectedSchedule] = useState(0);
  const [sortBy, setSortBy] = useState('default'); // default, morning, freeDays
  const t = translations[language] || translations.tr;

  if (loading) {
    return <div className="loading">{t.generatingSchedules}</div>;
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="no-schedules">
        {conflicts.length > 0 ? (
          <div className="conflicts-container">
            <h3 className="conflicts-title">
              {language === 'tr' ? 'Çakışan Dersler Tespit Edildi' : 'Course Conflicts Detected'}
            </h3>
            <p className="conflicts-subtitle">
              {language === 'tr'
                ? 'Aşağıdaki dersler/şubeler birbirleriyle çakıştığı için program oluşturulamadı:'
                : 'No schedules could be created because the following courses/sections conflict:'}
            </p>
            <div className="conflicts-list">
              {conflicts.map((conflict, idx) => (
                <div key={idx} className="conflict-item">
                  <div className="conflict-main">
                    <span className="conflict-icon">⚠️</span>
                    <span className="conflict-text"><strong>{conflict.courses.join(' & ')}</strong></span>
                  </div>
                  {conflict.suggestion && (
                    <div className="conflict-suggestion">
                      <span className="suggestion-label">💡 {language === 'tr' ? 'Öneri:' : 'Suggestion:'}</span>
                      <span className="suggestion-text">{conflict.suggestion}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <p>{t.noSchedulesYet}</p>
            <p>{t.addCoursesFirst}</p>
          </>
        )}
      </div>
    );
  }



  // Real implementation of sorting
  const getSortedSchedules = () => {
    const list = [...schedules];
    if (sortBy === 'default') return list; // Keep server order

    // Calculate morning load: slots filled in indices 0,1,2,3 (8:40 - 11:30)
    const getMorningLoad = (matrix) => {
      let load = 0;
      matrix.forEach(day => {
        if (day[0] !== 0) load += 4; // 8:40 (High weight)
        if (day[1] !== 0) load += 3; // 9:40
        if (day[2] !== 0) load += 2; // 10:40
        if (day[3] !== 0) load += 1; // 11:40
      });
      return load;
    };

    return list.sort((a, b) => {
      const scoreA = getMorningLoad(a.matrix);
      const scoreB = getMorningLoad(b.matrix);

      if (sortBy === 'morningDesc') {
        return scoreB - scoreA; // Max to Least (Lots of morning classes)
      }
      if (sortBy === 'morningAsc') {
        return scoreA - scoreB; // Least to Max (Few/No morning classes)
      }
      return 0;
    });
  };

  const sortedSchedules = getSortedSchedules();
  const currentSchedule = sortedSchedules[selectedSchedule] || sortedSchedules[0];

  return (
    <div className="schedules-container">
      <div className="schedules-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{schedules.length} {t.schedulesFound}</h2>

        <div className="sort-controls">
          <label style={{ marginRight: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {language === 'tr' ? 'Sıralama:' : 'Sort By:'}
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setSelectedSchedule(0); // Reset to first when sorting changes
            }}
            className="sort-select"
          >
            <option value="default">{language === 'tr' ? 'Varsayılan (Sunucu)' : 'Default (Server)'}</option>
            <option value="morningDesc">{language === 'tr' ? 'En Çok Sabah (Erken)' : 'Most Morning (Early)'}</option>
            <option value="morningAsc">{language === 'tr' ? 'En Az Sabah (Geç)' : 'Least Morning (Late)'}</option>
          </select>
        </div>
      </div>

      {/* Schedule Selector */}
      <div className="schedule-selector">
        {sortedSchedules.map((_, index) => (
          <button
            key={index}
            className={`schedule-tab ${selectedSchedule === index ? 'active' : ''}`}
            onClick={() => setSelectedSchedule(index)}
          >
            {t.schedule} {index + 1}
          </button>
        ))}
      </div>

      {/* Current Schedule Details */}
      <div className="schedule-details" id={`schedule-${selectedSchedule}`}>
        <div className="schedule-info-row">
          <div className="schedule-title">
            <h3>{t.schedule} {selectedSchedule + 1}</h3>
            <p className="total-credits">{t.totalCredits}: {currentSchedule.totalCredits}</p>
          </div>
          <div className="export-buttons">
            <button
              className="export-btn export-pdf"
              onClick={() => exportAsPDF(`schedule-${selectedSchedule}`, `OZU-${t.schedule}-${selectedSchedule + 1}`)}
            >
              📄 {t.exportPDF}
            </button>
            <button
              className="export-btn export-image"
              onClick={() => exportAsImage(`schedule-${selectedSchedule}`, `OZU-${t.schedule}-${selectedSchedule + 1}`)}
            >
              🖼️ {t.exportImage}
            </button>
            <button
              className="export-btn export-calendar"
              onClick={() => exportAsICS(currentSchedule, 'Spring 2025')}
            >
              📅 {t.exportCalendar}
            </button>
          </div>
        </div>

        {/* Course List */}
        <div className="courses-table">
          <table>
            <thead>
              <tr>
                <th>{t.course}</th>
                <th>{t.section}</th>
                <th>{t.lecturer}</th>
                <th>{t.credits}</th>
              </tr>
            </thead>
            <tbody>
              {currentSchedule.lessons.map((lesson, idx) => {
                const sectionLetter = lesson.section_name.replace(lesson.course_name, '');

                return (
                  <tr key={idx} style={{ color: 'black' }}>
                    <td>
                      <div className="course-cell-main">
                        <strong>{lesson.course_name}</strong>
                        {lesson.faculty && (
                          <div className="course-faculty">{lesson.faculty}</div>
                        )}
                        {lesson.description && lesson.description !== lesson.course_name && (
                          <div className="course-description">{lesson.description}</div>
                        )}
                      </div>
                    </td>
                    <td>{sectionLetter}</td>
                    <td>{lesson.lecturer}</td>
                    <td>{lesson.credits}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Weekly Calendar View */}
        <div className="calendar-view">
          <h4>{t.weeklySchedule}</h4>
          <WeeklyCalendar
            matrix={currentSchedule.matrix}
            lessons={currentSchedule.lessons}
            language={language}
          />
        </div>
      </div>
    </div>
  );
}

// Weekly Calendar Component
function WeeklyCalendar({ matrix, lessons, language = 'tr' }) {
  const t = translations[language] || translations.tr;

  const days = language === 'tr'
    ? ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const hours = [];
  for (let h = 8; h <= 20; h++) {
    hours.push(`${h}:40`);
  }

  // Create a color map for courses
  const colorMap = {};
  lessons.forEach((lesson, idx) => {
    if (!colorMap[lesson.id]) {
      const hue = (idx * 137.5) % 360;
      colorMap[lesson.id] = `hsl(${hue}, 70%, 85%)`;
    }
  });

  return (
    <div className="calendar-grid">
      <table className="calendar-table">
        <thead>
          <tr>
            <th className="time-header">
              {language === 'tr' ? 'Saat' : 'Time'}
            </th>
            {days.map((day, idx) => (
              <th key={idx}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour, hourIdx) => (
            <tr key={hourIdx}>
              <td className="time-cell">{hour}</td>
              {matrix.map((day, dayIdx) => {
                const cellId = day[hourIdx];
                if (cellId === 0) {
                  return <td key={dayIdx} className="empty-cell"></td>;
                }

                const lesson = lessons.find(l => l.id === cellId);
                return (
                  <td
                    key={dayIdx}
                    className="course-cell"
                    style={{ backgroundColor: colorMap[cellId] }}
                  >
                    <div className="course-cell-content">
                      <strong>{lesson?.section_name}</strong>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ScheduleList;