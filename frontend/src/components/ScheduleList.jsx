import { useState } from 'react';
import { exportAsImage, exportAsPDF, exportAsICS } from '../utils/exportSchedule';
import { translations, getDayName } from '../utils/translations';

function ScheduleList({ schedules, loading, language = 'tr' }) {
  const [selectedSchedule, setSelectedSchedule] = useState(0);
  const t = translations[language] || translations.tr;

  if (loading) {
    return <div className="loading">{t.generatingSchedules}</div>;
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="no-schedules">
        <p>{t.noSchedulesYet}</p>
        <p>{t.addCoursesFirst}</p>
      </div>
    );
  }

  const currentSchedule = schedules[selectedSchedule];

  return (
    <div className="schedules-container">
      <div className="schedules-header">
        <h2>{schedules.length} {t.schedulesFound}</h2>
      </div>

      {/* Schedule Selector */}
      <div className="schedule-selector">
        {schedules.map((schedule, index) => (
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
                      <strong>{lesson.course_name}</strong>
                      {lesson.description && (
                        <div className="course-description">{lesson.description}</div>
                      )}
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