
document.addEventListener('DOMContentLoaded', function () {
    const schedules = JSON.parse(localStorage.getItem('schedules'));

    if (schedules && schedules.length > 0) {
        const container = document.getElementById('schedules-container');
        schedules.forEach((schedule) => {
            const scheduleElement = document.createElement('div');
            scheduleElement.classList.add('schedule');
            scheduleElement.dataset.scheduleId = schedule.id; // Add a data attribute
            scheduleElement.innerHTML = `
                        <h2>Schedule ID: ${schedule.id}</h2>
                        <button class="download" data-id="${schedule.id}">İndir</button>
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Pazartesi</th>
                                    <th>Salı</th>
                                    <th>Çarşamba</th>
                                    <th>Perşembe</th>
                                    <th>Cuma</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${generateTableRows(schedule.schedule)}
                            </tbody>
                        </table>
                    `;
            container.appendChild(scheduleElement);
        });

        // Handle download button clicks
        document.querySelectorAll('.download').forEach((button) => {
            button.addEventListener('click', function () {
                const scheduleId = this.getAttribute('data-id');
                const scheduleElement = document.querySelector(`.schedule[data-schedule-id="${scheduleId}"]`);
                if (scheduleElement) {
                    html2canvas(scheduleElement).then(canvas => {
                        const link = document.createElement('a');
                        link.href = canvas.toDataURL('image/png');
                        link.download = 'schedule.png';
                        link.click();
                    });
                }
            });
        });
    } else {
        const container = document.getElementById('schedules-container');
        const error_p = document.createElement('p');
        error_p.classList.add('error');
        error_p.innerText = 'Seçtiğiniz derslerin saatleri uyuşmadığı için hernagi bir program oluşturulamadı.';
        container.appendChild(error_p);
    }

    // Fetch and display selected lessons
    displaySelectedLessons();
    displayCreditLesson();
});

function generateTableRows(schedule) {
    // Define time slots from 8:40 to 20:40
    const timeSlots = [
        '08:40', '09:40', '10:40', '11:40', '12:40', '13:40',
        '14:40', '15:40', '16:40', '17:40', '18:40', '19:40', '20:40'
    ];

    // Transpose the schedule data
    const transposedSchedule = timeSlots.map((_, colIndex) =>
        schedule.map(row => row[colIndex])
    );

    // Generate table rows
    return transposedSchedule.map((row, index) => `
            <tr>
                <td>${timeSlots[index]}</td>
                ${row.map(cell => `<td>${cell === '-' ? '' : cell}</td>`).join('')}
            </tr>
        `).join('');
}

function displaySelectedLessons() {
    const selectedLessonsCon = document.getElementById('selected-lessons');

    fetch('/get-added-courses', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            // Use 'courses' property directly from response
            const lessons = data.courses || [];

            if (lessons.length > 0) {
                lessons.forEach(lesson => {
                    const lessonElement = document.createElement('p');
                    lessonElement.classList.add('selected-lessons-alt');

                    lessonElement.innerHTML = `
                            ${lesson.course_name} - ${lesson.credits}
                        `;

                    selectedLessonsCon.appendChild(lessonElement);

                });

            } else {
                selectedLessonsCon.innerHTML = `
                        <p>No lessons selected.</p>
                    `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function displayCreditLesson() {
    const creditLessonCon = document.getElementById('credit-lesson');

    fetch('/get-total-credit-lesson', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {

            const totalCredit = document.createElement('p');

            const totalLesson = document.createElement('p');

            const totalSchedule = document.createElement('p');

            const schedulesLength = JSON.parse(localStorage.getItem('schedules')).length;

            totalCredit.innerHTML = `
                Toplam Kredi: ${data.totalCredits}
            `;
            totalLesson.innerHTML = `
                Toplam Ders: ${data.totalLesson}
            `;

            totalSchedule.innerHTML = `
                Toplam Program: ${schedulesLength}
            `;

            creditLessonCon.appendChild(totalCredit);
            creditLessonCon.appendChild(totalLesson);
            creditLessonCon.appendChild(totalSchedule);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
