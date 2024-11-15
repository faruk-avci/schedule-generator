// Search and Display
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
        showToast('Sonuç bulunamadı', 'error');
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
        addButton.onclick = () => add(course.course_name, null);

        const showSectionButton = document.createElement('button');
        showSectionButton.textContent = "Şuebeleri Göster";
        showSectionButton.onclick = () => toggleSectionDisplay(courseDiv, course);
        const buttondDiv = document.createElement('div');
        buttondDiv.classList.add('button-div');
        buttondDiv.append(showSectionButton);
        buttondDiv.append(addButton);
        courseDiv.appendChild(buttondDiv);

        // Create a hidden section container to show sections when the button is clicked
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('sections-container');
        sectionDiv.style.display = 'none'; // Start hidden
        courseDiv.appendChild(sectionDiv);

        fragment.appendChild(courseDiv);
    });

    resultsDiv.appendChild(fragment);
}

function toggleSectionDisplay(courseDiv, course) {
    const sectionDiv = courseDiv.querySelector('.sections-container');

    // If the sectionDiv is not already populated, add the sections
    if (sectionDiv.innerHTML === '') {
        const fragment = document.createDocumentFragment();

        course.sections.forEach(section => {
            const sectionItem = document.createElement('div');
            sectionItem.classList.add('section-item');

            const sectionText = document.createElement('span');
            sectionText.textContent = section;
            sectionItem.appendChild(sectionText);

            const addButton = document.createElement('button');
            addButton.textContent = 'Ekle';
            addButton.onclick = () => add(course.course_name, section);
            sectionItem.appendChild(addButton);

            fragment.appendChild(sectionItem);
        });

        sectionDiv.appendChild(fragment);
    }

    // Toggle visibility
    if (sectionDiv.style.display === 'none') {
        sectionDiv.style.display = 'block';
    } else {
        sectionDiv.style.display = 'none';
    }
}

function clearResults() {
    document.getElementById('results').innerHTML = '';
    document.getElementById('searchInput').value = '';
}

function add(course, section) {
    fetch('/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            course: course,
            section: section
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Display success message
            showToast(data.message, 'success');
            displayAddeds();
        } else {
            // Display error message
            showToast(data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Ekleme sırasında bir hata oluştu', 'error');
    });
}

function displayAddeds() {
    fetch('/get-courses-sections')
        .then(response => response.json())
        .then(data => {
            const courses = data.addedCourses || [];
            const sections = data.addedSections || [];

            const coursesContainer = document.getElementById('courses');
            const sectionsContainer = document.getElementById('sections');

            coursesContainer.innerHTML = '';
            sectionsContainer.innerHTML = '';            
            const h3C = document.createElement('h3');
            h3C.textContent = "Added Courses"
            coursesContainer.appendChild(h3C);
            courses.forEach((course, index) => {
                const courseDiv = document.createElement('div');
                courseDiv.classList.add('course-item');

                const courseText = document.createElement('span');
                courseText.textContent = course;
                courseDiv.appendChild(courseText);

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Kaldır';
                removeButton.onclick = () => removeCourse(course, null);
                courseDiv.appendChild(removeButton);

                coursesContainer.appendChild(courseDiv);
            });

            const h3S = document.createElement('h3');
            h3S.textContent = "Added Sections"
            sectionsContainer.appendChild(h3S);
            // Display added sections
            sections.forEach((section, index) => {
                const sectionDiv = document.createElement('div');
                sectionDiv.classList.add('course-item');

                const sectionText = document.createElement('span');
                sectionText.textContent = `${section.section}`;
                sectionDiv.appendChild(sectionText);

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Kaldır';
                removeButton.onclick = () => removeCourse(section.course, section.section);
                sectionDiv.appendChild(removeButton);

                sectionsContainer.appendChild(sectionDiv);
            });
        })
        .catch(error => {
            console.error('Error fetching added courses and sections:', error);
            showToast('Arama sırasında bir hata oluştu', 'error');
        });
}

function removeCourse(course, section) {
    fetch('/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            course: course,
            section: section
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message || 'Başarıyla kaldırıldı', 'success');
                displayAddeds();
        } else {
            showToast(data.error || 'Kaldırma işlemi başarısız oldu', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Kaldırma sırasında bir hata oluştu', 'error');
    });
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

