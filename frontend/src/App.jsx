import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import SearchResults from './components/SearchResults'
import Basket from './components/Basket'
import ScheduleList from './components/ScheduleList'
import ScrollToTop from './components/ScrollToTop'
import HowToUse from './components/HowToUse';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import TermsOfService from './components/TermsOfService';
import NotFound from './components/NotFound';
import ResultsPage from './components/ResultsPage';
import CoreqWarningModal from './components/CoreqWarningModal';
import CurriculumPage from './components/CurriculumPage';
import SurveyPage from './components/SurveyPage';
import MaintenanceScreen from './components/MaintenanceScreen';
import { translations } from './utils/translations'
import { searchCourses, addCourse, removeCourse, clearBasket, getBasket, generateSchedule, getTermInfo, setMajor as apiSetMajor, saveBasket as apiSaveBasket, getSavedBaskets as apiGetSavedBaskets, loadBasket as apiLoadSavedBasket, removeSavedBasket as apiRemoveSavedBasket } from './services/api'
import Analytics from './utils/analytics';
import grain from './analytics';

import InfoBanner from './components/InfoBanner';
import WarningBanner from './components/WarningBanner';

const MAJORS = [
  {
    category: { tr: 'Mühendislik Fakültesi', en: 'Faculty of Engineering' },
    items: [
      { id: 'cs', en: 'Computer Engineering', tr: 'Bilgisayar Mühendisliği' },
      { id: 'ee', en: 'Electrical - Electronics Engineering', tr: 'Elektrik - Elektronik Mühendisliği' },
      { id: 'ie', en: 'Industrial Engineering', tr: 'Endüstri Mühendisliği' },
      { id: 'ce', en: 'Civil Engineering', tr: 'İnşaat Mühendisliği' },
      { id: 'me', en: 'Mechanical Engineering', tr: 'Makina Mühendisliği' },
      { id: 'ai', en: 'Artificial Intelligence and Data Engineering', tr: 'Yapay Zeka ve Veri Mühendisliği' }
    ]
  },
  {
    category: { tr: 'İşletme Fakültesi', en: 'Faculty of Business' },
    items: [
      { id: 'econ', en: 'Economics', tr: 'Ekonomi' },
      { id: 'ent', en: 'Entrepreneurship', tr: 'Girişimcilik' },
      { id: 'ba', en: 'Business Administration', tr: 'İşletme' },
      { id: 'fin', en: 'International Finance', tr: 'Uluslararası Finans' },
      { id: 'itb', en: 'International Trade and Business Management', tr: 'Uluslararası Ticaret ve İşletmecilik' },
      { id: 'mis', en: 'Management Information Systems', tr: 'Yönetim Bilişim Sistemleri' }
    ]
  },
  {
    category: { tr: 'Mimarlık ve Tasarım Fakültesi', en: 'Faculty of Architecture and Design' },
    items: [
      { id: 'id', en: 'Industrial Design', tr: 'Endüstriyel Tasarım' },
      { id: 'int', en: 'Interior Architecture and Environmental Design', tr: 'İç Mimarlık ve Çevre Tasarımı' },
      { id: 'com', en: 'Communication and Design', tr: 'İletişim ve Tasarımı' },
      { id: 'arch-en', en: 'Architecture (English)', tr: 'Mimarlık (İngilizce)' },
      { id: 'arch-tr', en: 'Architecture (Turkish)', tr: 'Mimarlık (Türkçe)' }
    ]
  },
  {
    category: { tr: 'Havacılık ve Uzay Bilimleri Fakültesi', en: 'Faculty of Aviation and Aeronautical Sciences' },
    items: [
      { id: 'avm', en: 'Aviation Management', tr: 'Havacılık Yönetimi' },
      { id: 'pilot', en: 'Pilot Training', tr: 'Pilotaj' }
    ]
  },
  {
    category: { tr: 'Sosyal Bilimler Fakültesi', en: 'Faculty of Social Sciences' },
    items: [
      { id: 'psych', en: 'Psychology', tr: 'Psikoloji' },
      { id: 'ir', en: 'International Relations', tr: 'Uluslararası İlişkiler' },
      { id: 'anth', en: 'Anthropology', tr: 'Antropoloji' }
    ]
  },
  {
    category: { tr: 'Uygulamalı Bilimler Fakültesi', en: 'Faculty of Applied Sciences' },
    items: [
      { id: 'gast', en: 'Gastronomy and Culinary Arts', tr: 'Gastronomi ve Mutfak Sanatları' },
      { id: 'hotel', en: 'Hotel Management', tr: 'Otel Yöneticiliği' }
    ]
  },
  {
    category: { tr: 'Hukuk Fakültesi', en: 'Faculty of Law' },
    items: [
      { id: 'law', en: 'Law', tr: 'Hukuk' }
    ]
  },
  {
    category: { tr: 'Diğer', en: 'Other' },
    items: [
      { id: 'master', en: 'Master / PhD', tr: 'Yüksek Lisans / Doktora' },
      { id: 'skip', en: 'Prefer not to share', tr: 'Paylaşmak istemiyorum' }
    ]
  }
];

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [basket, setBasket] = useState({ courses: [], sections: [] });
  const [message, setMessage] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [generatingSchedules, setGeneratingSchedules] = useState(false);
  const [preference, setPreference] = useState('morning');
  const [overload, setOverload] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [term, setTerm] = useState('');
  const [major, setMajor] = useState(null);
  const [showMajorModal, setShowMajorModal] = useState(false);
  const [savedBaskets, setSavedBaskets] = useState([]);
  const [isLimited, setIsLimited] = useState(false);
  const [coreqWarning, setCoreqWarning] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const schedulesRef = useRef(null);

  const [language, setLanguage] = useState('tr');
  const [theme, setTheme] = useState('light');
  const t = translations[language];
  const navigate = useNavigate();

  // Load saved preferences
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'tr';
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedMajor = localStorage.getItem('student_major');

    setLanguage(savedLanguage);
    setTheme(savedTheme);
    if (savedMajor) setMajor(savedMajor);

    // Apply theme to body
    document.body.className = savedTheme === 'dark' ? 'dark-mode' : '';
  }, []);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Save and apply theme preference
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.className = theme === 'dark' ? 'dark-mode' : '';
  }, [theme]);

  // Load basket and term info on mount
  useEffect(() => {
    Analytics.initGlobalErrorTracking();
    Analytics.track('APP_START');

    // Check for maintenance mode on load
    const checkMaintenance = async () => {
      try {
        await getTermInfo();
      } catch (error) {
        // 503 with maintenance flag will be caught by interceptor
        if (error.response?.status === 503 && error.response?.data?.maintenance) {
          setMaintenanceMode(true);
          return; // Don't load other data if in maintenance
        }
      }
    };

    checkMaintenance();
    refreshBasket();
    loadTermInfo();
    loadSavedBaskets();

    // Listen for updates from other components
    const handleBasketUpdate = () => {
      refreshBasket();
      loadSavedBaskets();
    };
    const handleMajorUpdate = () => {
      const stored = localStorage.getItem('student_major');
      if (stored) setMajor(stored);
    };

    window.addEventListener('basketUpdated', handleBasketUpdate);
    window.addEventListener('majorUpdated', handleMajorUpdate);

    // Listen for maintenance mode
    const handleMaintenance = (e) => {
      if (e.detail?.active) {
        setMaintenanceMode(true);
      }
    };
    window.addEventListener('maintenanceMode', handleMaintenance);

    return () => {
      window.removeEventListener('basketUpdated', handleBasketUpdate);
      window.removeEventListener('majorUpdated', handleMajorUpdate);
      window.removeEventListener('maintenanceMode', handleMaintenance);
    };
  }, []);

  // Track page navigation (simplified since we use routes)
  useEffect(() => {
    const page = window.location.pathname === '/' ? 'Home' : window.location.pathname.substring(1);
    Analytics.track('PAGE_VIEW', { page });
  }, [navigate]);

  const loadTermInfo = async () => {
    try {
      const data = await getTermInfo();
      if (data.success) {
        setTerm(data.term);
      }
    } catch (error) {
      console.error('Error loading term info:', error);
    }
  };

  const loadSavedBaskets = async () => {
    try {
      const data = await apiGetSavedBaskets();
      if (data.success) {
        setSavedBaskets(data.baskets);
      }
    } catch (error) {
      console.error('Error loading saved baskets:', error);
    }
  };


  const showMessage = (key, type = 'success', customText = null) => {
    const text = customText || t[key];
    setMessage({ text, type });
  };

  // Better backend error translator
  const translateBackendError = (errorMessage) => {
    if (!errorMessage) return t.errorSearching;

    // Extract course/section names from error messages
    const courseMatch = errorMessage.match(/"([^"]+)"/g);
    const courseName = courseMatch ? courseMatch[0] : '';
    const sectionName = courseMatch && courseMatch[1] ? courseMatch[1] : '';

    // Full message translations based on patterns
    if (errorMessage.includes('already in your basket') && errorMessage.includes('section')) {
      return language === 'tr'
        ? `${courseName} bölümü zaten sepetinizde`
        : errorMessage;
    }

    if (errorMessage.includes('already in your basket') && errorMessage.includes('Course')) {
      return language === 'tr'
        ? `${courseName} dersi zaten sepetinizde`
        : errorMessage;
    }

    if (errorMessage.includes('A section of') && errorMessage.includes('Remove the section first')) {
      return language === 'tr'
        ? `${courseName} dersinin bir şubesi zaten sepetinizde. Önce şubesi kaldırın.`
        : errorMessage;
    }

    if (errorMessage.includes('entire course') && errorMessage.includes('already in your basket')) {
      return language === 'tr'
        ? `${courseName} dersinin tamamı zaten sepetinizde. Bireysel şube ekleyemezsiniz.`
        : errorMessage;
    }

    if (errorMessage.includes('Cannot add individual sections')) {
      return language === 'tr'
        ? `${courseName} dersinin tamamı zaten eklendiği için şube ekleyemezsiniz.`
        : errorMessage;
    }

    if (errorMessage.includes('not found in basket') || errorMessage.includes('not in your basket')) {
      return language === 'tr'
        ? `${courseName} sepetinizde bulunamadı`
        : errorMessage;
    }

    if (errorMessage.includes('is already added')) {
      return language === 'tr'
        ? `${courseName} zaten eklendi`
        : errorMessage;
    }

    // Default: return as-is
    return errorMessage;
  };

  // Auto-dismiss message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 4000); // Dismiss after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Search for courses
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      showMessage('pleaseEnterCourseName', 'error');
      return;
    }

    if (searchTerm.trim().length < 2) {
      showMessage('minTwoCharacters', 'error');
      return;
    }

    setLoading(true);
    setMessage(null);
    setHasSearched(true);
    grain.track('search', { query: searchTerm });

    try {
      const data = await searchCourses(searchTerm);
      setSearchResults(data.courses || []);
      if (data.courses.length === 0) {
        showMessage('noResults', 'error');
      }
    } catch (error) {
      console.error('Search error:', error);
      showMessage('errorSearching', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setMessage(null);
    setHasSearched(false);
    grain.track('clear_search');
  };

  // OPTIMISTIC UI: Update handleAddCourse
  const handleAddCourse = async (courseName) => {
    // Check locally first - already added?
    if (basket.courses.includes(courseName)) {
      showMessage(null, 'error', translateBackendError(`Course "${courseName}" is already in your basket`));
      return;
    }

    // Has a section of this course? 
    if (basket.sections.some(s => s.course === courseName)) {
      showMessage(null, 'error', translateBackendError(`A section of "${courseName}" is already in your basket. Remove the section first.`));
      return;
    }

    // OPTIMISTIC: Update UI instantly
    const prevBasket = { ...basket };
    setBasket(prev => ({
      ...prev,
      courses: [...prev.courses, courseName]
    }));
    showMessage(null, 'success', `${courseName} ${t.courseAdded}`);
    grain.track('add_course', { course_id: courseName, source: 'search' });

    // Sync with backend in background
    try {
      const data = await addCourse(courseName, null);
      if (!data.success) {
        // Rollback on error
        setBasket(prevBasket);
        showMessage(null, 'error', translateBackendError(data.error));
      }
    } catch (error) {
      // Rollback on network error
      setBasket(prevBasket);
      const errorMsg = error.response?.data?.error || t.errorSearching;
      showMessage(null, 'error', translateBackendError(errorMsg));
    }
  };

  // OPTIMISTIC UI: Update handleAddSection
  const handleAddSection = async (courseName, sectionName) => {
    // Check locally - already added?
    if (basket.sections.some(s => s.course === courseName && s.section === sectionName)) {
      showMessage(null, 'error', translateBackendError(`Section "${sectionName}" of "${courseName}" is already in your basket`));
      return;
    }

    // Entire course already added?
    if (basket.courses.includes(courseName)) {
      showMessage(null, 'error', translateBackendError(`The entire course "${courseName}" is already in your basket. Cannot add individual sections.`));
      return;
    }

    // OPTIMISTIC: Update UI instantly
    const prevBasket = { ...basket };
    setBasket(prev => ({
      ...prev,
      sections: [...prev.sections, { course: courseName, section: sectionName }]
    }));
    showMessage(null, 'success', `${courseName} ${sectionName} ${t.sectionAdded}`);
    grain.track('add_section', { course_id: courseName, section_id: sectionName });

    // Sync with backend in background
    try {
      const data = await addCourse(courseName, sectionName);
      if (!data.success) {
        setBasket(prevBasket);
        showMessage(null, 'error', translateBackendError(data.error));
      }
    } catch (error) {
      setBasket(prevBasket);
      const errorMsg = error.response?.data?.error || t.errorSearching;
      showMessage(null, 'error', translateBackendError(errorMsg));
    }
  };

  // OPTIMISTIC UI: Update handleRemoveCourse
  const handleRemoveCourse = async (courseName) => {
    // OPTIMISTIC: Update UI instantly
    const prevBasket = { ...basket };
    setBasket(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c !== courseName)
    }));
    showMessage(null, 'success', `${courseName} ${t.courseRemoved}`);
    grain.track('remove_course', { course_id: courseName });

    // Sync with backend in background
    try {
      const data = await removeCourse(courseName, null);
      if (!data.success) {
        setBasket(prevBasket);
        showMessage(null, 'error', translateBackendError(data.error));
      }
    } catch (error) {
      setBasket(prevBasket);
      const errorMsg = error.response?.data?.error || t.errorSearching;
      showMessage(null, 'error', translateBackendError(errorMsg));
    }
  };

  // OPTIMISTIC UI: Update handleRemoveSection
  const handleRemoveSection = async (courseName, sectionName) => {
    // OPTIMISTIC: Update UI instantly
    const prevBasket = { ...basket };
    setBasket(prev => ({
      ...prev,
      sections: prev.sections.filter(s => !(s.course === courseName && s.section === sectionName))
    }));
    showMessage(null, 'success', `${courseName} ${sectionName} ${t.sectionRemoved}`);
    grain.track('remove_section', { course_id: courseName, section_id: sectionName });

    // Sync with backend in background
    try {
      const data = await removeCourse(courseName, sectionName);
      if (!data.success) {
        setBasket(prevBasket);
        showMessage(null, 'error', translateBackendError(data.error));
      }
    } catch (error) {
      setBasket(prevBasket);
      const errorMsg = error.response?.data?.error || t.errorSearching;
      showMessage(null, 'error', translateBackendError(errorMsg));
    }
  };

  // Update handleClearBasket
  const handleClearBasket = async () => {
    if (!window.confirm(t.confirmClearBasket)) {
      return;
    }

    try {
      const data = await clearBasket();
      if (data.success) {
        showMessage('basketCleared', 'success');
        grain.track('clear_basket');
      }
      refreshBasket();
    } catch (error) {
      const errorMsg = error.response?.data?.error || t.errorSearching;
      showMessage(null, 'error', translateBackendError(errorMsg));
    }
  };
  // Load basket
  // Helper to sync basket from backend
  const refreshBasket = async () => {
    try {
      const data = await getBasket();
      if (data.success) {
        setBasket(data.basket);
        if (data.basket.major) {
          setMajor(data.basket.major);
        }
      }
    } catch (error) {
      console.error('Error loading basket:', error);
    }
  };

  // Search on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };




  // Generate schedules
  const handleGenerate = async (ignoreMajorGuard = false, ignoreCoreqs = false) => {
    if (!major && !ignoreMajorGuard) {
      setShowMajorModal(true);
      return;
    }

    setGeneratingSchedules(true);
    setConflicts([]);
    setOverload(null);
    if (!ignoreCoreqs) setCoreqWarning(null); // Reset checking warning only if new start
    setMessage(null);
    grain.track('generate_schedule', {
      ignore_major_guard: ignoreMajorGuard,
      ignore_coreqs: ignoreCoreqs,
      preference: preference
    });

    try {
      const data = await generateSchedule(120, preference, ignoreCoreqs);
      if (data.success) {
        setSchedules(data.schedules);
        setConflicts(data.conflicts || []);

        if (data.totalSchedules === 0) {
          showMessage('noValidSchedules', 'error');
        } else {
          showMessage(null, 'success', `✨ ${data.totalSchedules} ${t.schedulesGenerated}`);

          if (data.limited) {
            setIsLimited(true);
            showMessage(null, 'success',
              `✨ ${data.totalSchedules} ${t.schedulesGenerated} (${language === 'tr' ? 'sınırlandırıldı' : 'limited from'} ${data.totalGenerated})`
            );
          } else {
            setIsLimited(false);
          }
        }

        // Auto-scroll to results
        setTimeout(() => {
          schedulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

      } else {
        if (data.error === 'COMBINATION_OVERLOAD') {
          setOverload({
            count: data.message.match(/\(([^)]+)\)/)?.[1] || 'Unknown',
            suggestion: data.suggestion
          });

          // Auto-scroll to error for visibility
          setTimeout(() => {
            schedulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
        showMessage(null, 'error', data.error || data.message);
        setSchedules([]);
        setConflicts([]);
      }
    } catch (error) {
      const errorData = error.response?.data;

      // Handle Missing Coreqs Warning (Soft Error)
      if (error.response?.status === 409 && errorData?.error === 'MISSING_COREQS') {
        setCoreqWarning(errorData.missingCoreqs);
        setGeneratingSchedules(false);
        return;
      }

      if (errorData?.error === 'COMBINATION_OVERLOAD') {
        setOverload({
          count: errorData.message.match(/\(([^)]+)\)/)?.[1] || 'Unknown',
          suggestion: errorData.suggestion
        });

        // Auto-scroll to error for visibility
        setTimeout(() => {
          schedulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      showMessage(null, 'error',
        errorData?.error || errorData?.message || t.scheduleGenerationError
      );
      setSchedules([]);
      setConflicts([]);
    } finally {
      // Only stop loading if we are NOT showing the modal (because modal is technically "paused" state, but UI feels better if stopped)
      // Actually we set generating to false inside the 409 block above, so here we just always stop it for consistency
      setGeneratingSchedules(false);
    }
  };

  const handleViewAll = async () => {
    setGeneratingSchedules(true);
    try {
      const data = await generateSchedule(600, preference);
      if (data.success) {
        Analytics.track('VIEW_ALL_600', { count: data.totalSchedules });
        // Navigate to new results page with data
        navigate('/results', { state: { schedules: data.schedules, initialSort: preference } });
      }
    } catch (error) {
      console.error('Error fetching all schedules:', error);
      showMessage(null, 'error', t.scheduleGenerationError);
    } finally {
      setGeneratingSchedules(false);
    }
  };

  const handleSaveMajor = async (selectedMajor) => {
    try {
      const data = await apiSetMajor(selectedMajor);
      if (data.success) {
        setMajor(selectedMajor);
        localStorage.setItem('student_major', selectedMajor);
        setShowMajorModal(false);
        Analytics.track('SELECT_MAJOR', { major: selectedMajor });
        grain.track('select_major', { major: selectedMajor, source: 'app_modal' });
        handleGenerate(true); // Pass true to bypass the check
      }
    } catch (error) {
      console.error('Error saving major:', error);
      Analytics.trackError(error, 'handleSaveMajor');
      showMessage(null, 'error', language === 'tr' ? 'Bölüm kaydedilemedi' : 'Could not save major');
    }
  };

  const handleSaveBasket = async (name) => {
    try {
      const data = await apiSaveBasket(name);
      if (data.success) {
        showMessage(null, 'success', language === 'tr' ? `"${name}" sepeti kaydedildi` : `Basket "${name}" saved`);
        loadSavedBaskets();
        grain.track('save_basket', { basket_name: name });
      }
    } catch (error) {
      console.error('Error saving basket:', error);
      showMessage(null, 'error', error.response?.data?.error || (language === 'tr' ? 'Sepet kaydedilemedi' : 'Could not save basket'));
    }
  };

  const handleLoadSavedBasket = async (name) => {
    try {
      const data = await apiLoadSavedBasket(name);
      if (data.success) {
        setBasket(data.basket);
        showMessage(null, 'success', language === 'tr' ? `"${name}" sepeti yüklendi` : `Basket "${name}" loaded`);
        grain.track('load_basket', { basket_name: name });
      }
    } catch (error) {
      console.error('Error loading basket:', error);
      showMessage(null, 'error', language === 'tr' ? 'Sepet yüklenemedi' : 'Could not load basket');
    }
  };

  const handleRemoveSavedBasket = async (name) => {
    try {
      const data = await apiRemoveSavedBasket(name);
      if (data.success) {
        showMessage(null, 'success', language === 'tr' ? `"${name}" sepeti silindi` : `Basket "${name}" removed`);
        loadSavedBaskets();
        grain.track('remove_basket', { basket_name: name });
      }
    } catch (error) {
      console.error('Error removing basket:', error);
      showMessage(null, 'error', language === 'tr' ? 'Sepet silinemedi' : 'Could not remove basket');
    }
  };



  return (

    <>
      {/* Maintenance Mode Screen */}
      {maintenanceMode && <MaintenanceScreen language={language} />}

      <div className="app">
        {/* Header */}
        <Header
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)}
          term={term}
        />

        <Routes>
          <Route path="/" element={
            <>
              {/* Mobile-only Laptop Notice */}
              <div className="mobile-only-notice">
                <span className="notice-icon">💡</span>
                <p>
                  {language === 'tr'
                    ? 'Daha iyi bir deneyim için bilgisayar üzerinden kullanmanız önerilir.'
                    : 'Using a laptop for the best experience is recommended.'}
                </p>
              </div>

              {/* Message Banner */}
              {message && (
                <div className={`message ${message.type}`}>
                  <span style={{ flex: 1 }}>{message.text}</span>
                  <button
                    onClick={() => setMessage(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      lineHeight: 1,
                      color: 'inherit',
                      opacity: 0.7,
                      padding: 0,
                      marginLeft: '10px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <InfoBanner language={language} />
              <WarningBanner language={language} />

              {/* Main Content */}
              <div className="main-container">

                {/* Search Section */}
                <div className="search-section">
                  <div className="section-header">
                    <h2>{t.searchTitle}</h2>
                    {term && (
                      <div className="term-badge inline" title={language === 'tr' ? 'Aktif Dönem' : 'Active Term'}>
                        <span className="term-label">{t.academicTerm}</span>
                        <span className="term-value">{term}</span>
                      </div>
                    )}
                  </div>
                  <div className="search-bar">
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="search-input"
                    />
                    <button
                      className="search-button"
                      onClick={handleSearch}
                      disabled={loading}
                    >
                      {loading ? t.searching : t.searchButton}
                    </button>
                    <button
                      className="clear-button"
                      onClick={handleClearSearch}
                    >
                      {t.clearButton}
                    </button>
                  </div>

                  <div className="search-results">
                    <SearchResults
                      courses={searchResults}
                      onAddCourse={handleAddCourse}
                      onAddSection={handleAddSection}
                      loading={loading}
                      language={language}
                      hasSearched={hasSearched}
                    />
                  </div>
                </div>

                {/* Basket Section */}
                <Basket
                  basket={basket}
                  onRemoveCourse={handleRemoveCourse}
                  onRemoveSection={handleRemoveSection}
                  onClearBasket={handleClearBasket}
                  onGenerate={handleGenerate}
                  loading={generatingSchedules}
                  language={language}
                  preference={preference}
                  setPreference={setPreference}
                  savedBaskets={savedBaskets}
                  onSaveBasket={handleSaveBasket}
                  onLoadBasket={handleLoadSavedBasket}
                  onRemoveSavedBasket={handleRemoveSavedBasket}
                />
              </div>

              {/* Schedules Section */}
              <div ref={schedulesRef}>
                <ScheduleList
                  schedules={schedules}
                  conflicts={conflicts}
                  overload={overload}
                  loading={generatingSchedules}
                  language={language}
                  isLimited={isLimited}
                  onViewAll={handleViewAll}
                />
              </div>

              {/* Scroll to Top Button */}
              <ScrollToTop language={language} />
            </>
          } />
          <Route path="/terms" element={<TermsOfService language={language} onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)} />} />
          <Route path="/how-to-use" element={<HowToUse language={language} onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)} />} />
          <Route path="/contact" element={<Contact language={language} onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)} />} />
          <Route path="/curriculum" element={<CurriculumPage language={language} />} />
          <Route path="/survey" element={<SurveyPage language={language} onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)} />} />
          {/* 404 Catch-All Route */}
          <Route path="*" element={<NotFound language={language} onNavigate={(path) => navigate(path)} />} />
          <Route path="/results" element={<ResultsPage language={language} />} />
        </Routes>
        <Footer onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)} language={language} />
        <CookieBanner language={language} />

        {/* Major Selection Modal */}
        {showMajorModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div className="once-notice">
                  <span>✨ {language === 'tr' ? 'Sadece 1 Seferlik' : 'Only Asked Once'}</span>
                </div>
                <h2>{language === 'tr' ? 'Bölümünüzü Seçin' : 'Select Your Major'}</h2>
                <p>
                  {language === 'tr'
                    ? 'Size daha iyi yardımcı olabilmemiz için bölümünüzü seçer misiniz? Bu seçim sepetiniz ve verileriniz için bir kereye mahsus kaydedilecektir.'
                    : 'Could you please select your major so we can assist you better? This choice will be saved once for your basket and data.'}
                </p>
              </div>
              <div className="major-grid-container">
                {MAJORS.map(group => (
                  <div key={group.category.en} className="major-category">
                    <h3>{language === 'tr' ? group.category.tr : group.category.en}</h3>
                    <div className="major-items">
                      {group.items.map(m => (
                        <button
                          key={m.id}
                          className={`major-item-btn ${major === m.en ? 'active' : ''}`}
                          onClick={() => handleSaveMajor(m.en)}
                        >
                          {language === 'tr' ? m.tr : m.en}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Corequisite Warning Modal */}
        {coreqWarning && (
          <CoreqWarningModal
            missingCoreqs={coreqWarning}
            language={language}
            onCancel={() => setCoreqWarning(null)}
            onConfirm={() => {
              setCoreqWarning(null);
              handleGenerate(true, true); // ignoreMajorGuard=true (already passed), ignoreCoreqs=true
            }}
          />
        )}
      </div>
    </>
  )
}

export default App