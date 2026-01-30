import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export schedule as PNG image
 */
export const exportAsImage = async (elementId, fileName = 'schedule') => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Schedule element not found');
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });

    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error exporting as image:', error);
    alert('Failed to export image');
  }
};

/**
 * Export schedule as PDF
 */
export const exportAsPDF = async (elementId, fileName = 'schedule') => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Schedule element not found');
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });

    // Use JPEG with compression (0.75 quality) to reduce file size significantly
    const imgData = canvas.toDataURL('image/jpeg', 0.75);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(
      imgData,
      'JPEG', // Changed from PNG to JPEG
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );

    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    alert('Failed to export PDF');
  }
};

/**
 * Export schedule as ICS (calendar file)
 */
export const exportAsICS = (schedule, semester = 'Spring 2025') => {
  // Days mapping
  const daysMap = {
    0: 'MO', // Monday
    1: 'TU', // Tuesday
    2: 'WE', // Wednesday
    3: 'TH', // Thursday
    4: 'FR'  // Friday
  };

  // Start date for semester (adjust as needed)
  const semesterStart = new Date('2025-02-03'); // Example: Feb 3, 2025

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Özyeğin University//Schedule Builder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:My OZU Schedule',
    'X-WR-TIMEZONE:Europe/Istanbul'
  ].join('\r\n') + '\r\n';

  // Process each lesson
  schedule.lessons.forEach(lesson => {
    // Get time slots from matrix
    const timeSlots = [];
    schedule.matrix.forEach((day, dayIndex) => {
      day.forEach((cellId, hourIndex) => {
        if (cellId === lesson.id) {
          timeSlots.push({ day: dayIndex, hour: hourIndex });
        }
      });
    });

    // Group by day
    const daySlots = {};
    timeSlots.forEach(slot => {
      if (!daySlots[slot.day]) {
        daySlots[slot.day] = [];
      }
      daySlots[slot.day].push(slot.hour);
    });

    // Create events for each day
    Object.entries(daySlots).forEach(([day, hours]) => {
      const startHour = Math.min(...hours) + 8;
      const endHour = Math.max(...hours) + 9;

      const dtstart = formatICSDate(semesterStart, parseInt(day), startHour, 40);
      const dtend = formatICSDate(semesterStart, parseInt(day), endHour, 40);

      icsContent += [
        'BEGIN:VEVENT',
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${lesson.course_name} - ${lesson.section_name}`,
        `DESCRIPTION:Lecturer: ${lesson.lecturer}\\nCredits: ${lesson.credits}`,
        `LOCATION:Özyeğin University`,
        `RRULE:FREQ=WEEKLY;BYDAY=${daysMap[day]};COUNT=14`,
        'END:VEVENT'
      ].join('\r\n') + '\r\n';
    });
  });

  icsContent += 'END:VCALENDAR';

  // Download file
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'ozu-schedule.ics';
  link.click();
};

/**
 * Format date for ICS file
 */
function formatICSDate(baseDate, dayOfWeek, hour, minute) {
  const date = new Date(baseDate);

  // Find first occurrence of the day
  const currentDay = date.getDay();
  const targetDay = dayOfWeek === 0 ? 1 : dayOfWeek + 1; // Adjust for Monday = 0
  const daysToAdd = (targetDay - currentDay + 7) % 7;
  date.setDate(date.getDate() + daysToAdd);

  date.setHours(hour, minute, 0, 0);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}00`;
}