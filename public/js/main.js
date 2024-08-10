function searchLessons() {
    const courseName = document.getElementById('searchInput').value.trim();

    if (!courseName) {
        showToast('Lütfen ders adı girin!', 'error');
        return;
    }

    fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseName })
    })
        .then(response => response.json())
        .then(data => displayResultCourses(data.courses))
        .catch(error => {
            console.error('Error:', error);
            showToast('Arama sırasında bir hata oluştu', 'error');
        });
}

function displayResultCourses(courses) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (courses.length === 0) {
        resultsDiv.innerHTML = '<p>Sonuç Bulunamadı</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    courses.forEach(course => {
        const courseDiv = document.createElement('div');
        courseDiv.classList.add('course-item');

        const courseText = document.createElement('span');
        courseText.textContent = `${course.course_name} Kredi: ${course.credits} `;
        courseDiv.appendChild(courseText);

        const addButton = document.createElement('button');
        addButton.textContent = 'Ekle';
        addButton.onclick = () => addCourse(course);
        courseDiv.appendChild(addButton);

        fragment.appendChild(courseDiv);
    });

    resultsDiv.appendChild(fragment);
}

function clearResults() {
    document.getElementById('results').innerHTML = '';
    document.getElementById('searchInput').value = '';
}

// Add/Remove Course And Display
function calculateTotalCreditAndLesson() {
    fetch('/get-total-credit-lesson', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalCredits').textContent = data.totalCredits || 0;
            document.getElementById('totalLessons').textContent = data.totalLesson || 0;
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Toplam kredi ve ders hesaplanamadı', 'error');
        });
}

function addCourse(course) {
    fetch('/add-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName: course.course_name, credits: course.credits })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast(`${course.course_name} başarıyla eklendi!`, 'added');
                updateAddedCourses();
            } else {
                showToast(data.error || 'Hata', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Ders eklenirken bir hata oluştu', 'error');
        });
}

function removeCourse(course) {
    fetch('/remove-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName: course.course_name, credits: course.credits })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast(`${course.course_name} başarıyla çıkarıldı!`, 'error');
                updateAddedCourses();
            } else {
                showToast(data.error || 'Hata.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Ders çıkarılırken bir hata oluştu', 'error');
        });
}

function updateAddedCourses() {
    fetch('/get-added-courses', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(data => displayAddedCourses(data.courses))
        .catch(error => {
            console.error('Error:', error);
            showToast('Eklenen dersler getirilemedi', 'error');
        });
}

function displayAddedCourses(courses) {
    calculateTotalCreditAndLesson();
    const addedCoursesDiv = document.getElementById('addedCourses');
    addedCoursesDiv.innerHTML = '';

    if (courses.length === 0) {
        addedCoursesDiv.innerHTML = '<p>Hiç ders eklenmemiş</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    courses.forEach(course => {
        const courseDiv = document.createElement('div');
        courseDiv.classList.add('course-item');

        const courseText = document.createElement('span');
        courseText.textContent = `${course.course_name} Kredi: ${course.credits} `;
        courseDiv.appendChild(courseText);

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Kaldır';
        removeButton.onclick = () => removeCourse(course);
        courseDiv.appendChild(removeButton);

        fragment.appendChild(courseDiv);
    });

    addedCoursesDiv.appendChild(fragment);
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    const container = document.getElementById('toastContainer');
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.add('fadeOut');
        setTimeout(() => container.removeChild(toast), 400);
    }, 3000);
}

window.onload = function () {
    updateAddedCourses();
    calculateTotalCreditAndLesson();
};

function generateSchedules() {
    fetch('/get-added-courses', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(data => {
            const addedCourses = data.courses;
            return fetch('/generate-schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessons: addedCourses.map(course => course.course_name) })
            });
        })
        .then(response => response.json())
        .then(schedules => {
            localStorage.setItem('schedules', JSON.stringify(schedules));
            window.location.href = '/schedules.html';
        })
        .catch(error => {
            console.error('Error generating schedules:', error);
            showToast('Error generating schedules', 'error');
        });
}