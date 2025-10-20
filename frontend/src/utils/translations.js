export const translations = {
  tr: {
    // Header
    darkMode: 'Karanlık Mod',
    lightMode: 'Aydınlık Mod',
    
    // Search Section
    searchTitle: 'Ders Ara',
    searchPlaceholder: 'Ders kodu girin (örn: CS, EE, MATH)',
    searchButton: 'Ara',
    clearButton: 'Temizle',
    searching: 'Aranıyor...',
    noResults: 'Ders bulunamadı. CS, EE veya MATH deneyin.',
    
    // Course Card
    credits: 'kredi',
    addEntireCourse: 'Tüm Dersi Ekle',
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
    entireCourses: 'Tüm Dersler:',
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
    confirmClearBasket: 'Tüm sepeti temizlemek istediğinizden emin misiniz?'
  },
  
  en: {
    // Header
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    
    // Search Section
    searchTitle: 'Search Courses',
    searchPlaceholder: 'Enter course code (e.g., CS, EE, MATH)',
    searchButton: 'Search',
    clearButton: 'Clear',
    searching: 'Searching...',
    noResults: 'No courses found. Try CS, EE, or MATH.',
    
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
    confirmClearBasket: 'Are you sure you want to clear the entire basket?'
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