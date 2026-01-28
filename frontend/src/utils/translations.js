export const translations = {
  tr: {
    // Header
    darkMode: 'Karanlık Mod',
    lightMode: 'Aydınlık Mod',
    academicTerm: 'Akademik Dönem:',

    // Search Section
    searchTitle: 'Ders Ara',
    searchPlaceholder: 'Ders kodu girin (örn: BUS101, MATH101)',
    searchButton: 'Ara',
    clearButton: 'Temizle',
    searching: 'Aranıyor...',
    noResults: 'Ders bulunamadı. BUS101 veya MATH101 deneyin.',

    // Course Card
    credits: 'Kredi',
    addEntireCourse: 'Dersi Ekle',
    sections: 'Şubeler:',
    addSection: 'Ekle',

    // Days
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',

    // Basket
    myBasket: 'Sepetim',
    clearAll: 'Tümünü Temizle',
    emptyBasket: 'Henüz ders eklenmedi. Arama yapıp ders ekleyerek başlayın!',
    entireCourses: 'Dersler:',
    specificSections: 'Belirli Şubeler:',
    generateSchedules: 'Program Oluştur',
    totalItems: 'toplam',

    // Messages
    courseAdded: 'eklendi',
    sectionAdded: 'bölümü eklendi',
    courseRemoved: 'kaldırıldı',
    sectionRemoved: 'bölümü kaldırıldı',
    basketCleared: 'Sepet temizlendi',
    courseAlreadyAdded: 'zaten sepetinizde',
    sectionAlreadyAdded: 'bölümü zaten sepetinizde',
    entireCourseAdded: 'tüm dersi zaten eklediniz',
    sectionExistsRemoveFirst: 'bölümü zaten sepetinizde. Önce bölümü kaldırın.',
    cannotAddSection: 'Tüm ders eklendiği için şube eklenemez.',
    pleaseEnterCourseName: 'Lütfen bir ders adı girin',
    minTwoCharacters: 'En az 2 karakter girmelisiniz',
    noResults: 'Ders bulunamadı. BUS101 veya MATH101 deneyin.',
    errorSearching: 'Arama hatası. Backend çalıştığından emin olun.',

    // Schedule Generation
    generatingSchedules: 'Programlar oluşturuluyor... Lütfen bekleyin...',
    noSchedulesYet: 'Henüz program oluşturulmadı.',
    addCoursesFirst: 'Sepetinize ders ekleyin ve "Program Oluştur" butonuna tıklayın',
    schedulesGenerated: 'program oluşturuldu!',
    schedulesFound: 'program bulundu',
    noValidSchedules: 'Geçerli program bulunamadı (tüm kombinasyonlarda çakışma var)',
    scheduleGenerationError: 'Program oluştururken hata',
    basketEmpty: 'Sepet boş. Lütfen önce ders ekleyin.',

    // Schedule Display
    schedule: 'Program',
    totalCredits: 'Toplam Kredi',
    course: 'Ders',
    section: 'Şube',
    lecturer: 'Öğretim Üyesi',
    weeklySchedule: 'Haftalık Program',

    // Export
    exportPDF: 'PDF İndir',
    exportImage: 'Resim İndir',
    exportCalendar: 'Takvime Ekle',

    // Confirmation
    confirmClearBasket: 'Tüm sepeti temizlemek istediğinizden emin misiniz?',

    // Curriculum Info Banner
    curriculumInfo: 'Bölüm Müfredatları sayfasına giderek ders planınızı görebilir, zorunlu ve seçmeli derslerinizi görüntüleyebilir ve  açık derslerinizi kolayca sepetinize ekleyebilirsiniz.',
    goToCurriculum: 'Bölüm Müfredatları Sayfasına Git',

    // Saved Baskets
    yourSavedBaskets: 'Kayıtlı Sepetlerim',
    saveThisBasket: 'Bu Sepeti Kaydet',
    basketNamePlaceholder: 'Sepet adı...',
    load: 'Yükle',
    delete: 'Sil',
    save: 'Kaydet',
    cancel: 'İptal'
  },

  en: {
    // Header
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    academicTerm: 'Academic Term:',

    // Curriculum Info Banner
    curriculumInfo: 'You can view your curriculum, see required and elective courses, and add open courses to your basket by visiting the Curriculum page.',
    goToCurriculum: 'Go to Curriculum Page',

    // Search Section
    searchTitle: 'Search Courses',
    searchPlaceholder: 'Enter course code (e.g. BUS101, MATH101)',
    searchButton: 'Search',
    clearButton: 'Clear',
    searching: 'Searching...',
    noResults: 'No courses found. Try BUS101 or MATH101.',

    // Course Card
    credits: 'credits',
    addEntireCourse: 'Add Entire Course',
    sections: 'Sections:',
    addSection: 'Add',

    // Days
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',

    // Basket
    myBasket: 'My Basket',
    clearAll: 'Clear All',
    emptyBasket: 'No courses added yet. Search and add courses to get started!',
    entireCourses: 'Entire Courses:',
    specificSections: 'Specific Sections:',
    generateSchedules: 'Generate Schedules',
    totalItems: 'items',

    // Messages
    courseAdded: 'added',
    sectionAdded: 'section added',
    courseRemoved: 'removed',
    sectionRemoved: 'section removed',
    basketCleared: 'Basket cleared',
    courseAlreadyAdded: 'is already in your basket',
    sectionAlreadyAdded: 'section is already in your basket',
    entireCourseAdded: 'entire course is already added',
    sectionExistsRemoveFirst: 'section is already in your basket. Remove the section first.',
    cannotAddSection: 'Cannot add section when entire course is added.',
    pleaseEnterCourseName: 'Please enter a course name',
    minTwoCharacters: 'Please enter at least 2 characters',
    noResults: 'No courses found. Try BUS101 or MATH101.',
    errorSearching: 'Search error. Make sure backend is running.',

    // Schedule Generation
    generatingSchedules: 'Generating schedules... Please wait...',
    noSchedulesYet: 'No schedules generated yet.',
    addCoursesFirst: 'Add courses to your basket and click "Generate Schedules"',
    schedulesGenerated: 'schedules generated!',
    schedulesFound: 'schedules found',
    noValidSchedules: 'No valid schedules found (all combinations have time conflicts)',
    scheduleGenerationError: 'Error generating schedules',
    basketEmpty: 'Basket is empty. Please add courses first.',

    // Schedule Display
    schedule: 'Schedule',
    totalCredits: 'Total Credits',
    course: 'Course',
    section: 'Section',
    lecturer: 'Lecturer',
    weeklySchedule: 'Weekly Schedule',

    // Export
    exportPDF: 'Export PDF',
    exportImage: 'Export Image',
    exportCalendar: 'Add to Calendar',

    // Confirmation
    confirmClearBasket: 'Are you sure you want to clear the entire basket?',

    // Saved Baskets
    yourSavedBaskets: 'My Saved Baskets',
    saveThisBasket: 'Save This Basket',
    basketNamePlaceholder: 'Basket name...',
    load: 'Load',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel'
  }
};

// Helper function to get day name in selected language
export const getDayName = (turkishDay, language) => {
  const dayMap = {
    'Pazartesi': { tr: 'Pazartesi', en: 'Monday' },
    'Salı': { tr: 'Salı', en: 'Tuesday' },
    'Çarşamba': { tr: 'Çarşamba', en: 'Wednesday' },
    'Perşembe': { tr: 'Perşembe', en: 'Thursday' },
    'Cuma': { tr: 'Cuma', en: 'Friday' }
  };

  return dayMap[turkishDay]?.[language] || turkishDay;
};