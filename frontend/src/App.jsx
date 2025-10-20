import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header' 
import SearchResults from './components/SearchResults'
import Basket from './components/Basket' 
import ScheduleList from './components/ScheduleList'
import ScrollToTop from './components/ScrollToTop'
import HowToUse from './components/HowToUse';
import Footer from './components/Footer';
import { translations } from './utils/translations'
import { searchCourses, addCourse, removeCourse, clearBasket, getBasket, generateSchedule } from './services/api'

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [basket, setBasket] = useState({ courses: [], sections: [] });
  const [message, setMessage] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [generatingSchedules, setGeneratingSchedules] = useState(false);

  const [language, setLanguage] = useState('tr');
  const [theme, setTheme] = useState('light');
  const t = translations[language];
  const [currentPage, setCurrentPage] = useState('home'); 
  
  // Load saved preferences
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'tr';
    const savedTheme = localStorage.getItem('theme') || 'light';
    setLanguage(savedLanguage);
    setTheme(savedTheme);
    
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

  // Search for courses
const handleSearch = async () => {
  if (!searchTerm.trim()) {
    showMessage('pleaseEnterCourseName', 'error');
    return;
  }

  setLoading(true);
  setMessage(null);

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
};

// Update handleAddCourse
const handleAddCourse = async (courseName) => {
  try {
    const data = await addCourse(courseName, null);
    if (data.success) {
      showMessage(null, 'success', `${courseName} ${t.courseAdded}`);
    } else {
      showMessage(null, 'error', translateBackendError(data.error));
    }
    loadBasket();
  } catch (error) {
    const errorMsg = error.response?.data?.error || t.errorSearching;
    showMessage(null, 'error', translateBackendError(errorMsg));
  }
};

// Update handleAddSection
const handleAddSection = async (courseName, sectionName) => {
  try {
    const data = await addCourse(courseName, sectionName);
    if (data.success) {
      showMessage(null, 'success', `${courseName} ${sectionName} ${t.sectionAdded}`);
    } else {
      showMessage(null, 'error', translateBackendError(data.error));
    }
    loadBasket();
  } catch (error) {
    const errorMsg = error.response?.data?.error || t.errorSearching;
    showMessage(null, 'error', translateBackendError(errorMsg));
  }
};

// Update handleRemoveCourse
const handleRemoveCourse = async (courseName) => {
  try {
    const data = await removeCourse(courseName, null);
    if (data.success) {
      showMessage(null, 'success', `${courseName} ${t.courseRemoved}`);
    }
    loadBasket();
  } catch (error) {
    const errorMsg = error.response?.data?.error || t.errorSearching;
    showMessage(null, 'error', translateBackendError(errorMsg));
  }
};

// Update handleRemoveSection
const handleRemoveSection = async (courseName, sectionName) => {
  try {
    const data = await removeCourse(courseName, sectionName);
    if (data.success) {
      showMessage(null, 'success', `${courseName} ${sectionName} ${t.sectionRemoved}`);
    }
    loadBasket();
  } catch (error) {
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
    }
    loadBasket();
  } catch (error) {
    const errorMsg = error.response?.data?.error || t.errorSearching;
    showMessage(null, 'error', translateBackendError(errorMsg));
  }
};
  // Load basket
  const loadBasket = async () => {
    try {
      const data = await getBasket();
      setBasket(data.basket);
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
const handleGenerate = async () => {
  setGeneratingSchedules(true);
  setMessage(null);

  try {
    const data = await generateSchedule();
    if (data.success) {
      setSchedules(data.schedules);
      showMessage(null, 'success', `✨ ${data.totalSchedules} ${t.schedulesGenerated}`);
      
      if (data.limited) {
        showMessage(null, 'success', 
          `✨ ${data.totalSchedules} ${t.schedulesGenerated} (${language === 'tr' ? 'sınırlandırıldı' : 'limited from'} ${data.totalGenerated})`
        );
      }
    } else {
      showMessage(null, 'error', data.error || data.message);
      setSchedules([]);
    }
  } catch (error) {
    showMessage(null, 'error', 
      error.response?.data?.error || error.response?.data?.message || t.scheduleGenerationError
    );
    setSchedules([]);
  } finally {
    setGeneratingSchedules(false);
  }
};



  return (
    <div className="app">
      {/* Header */}
      <Header 
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        onNavigate={setCurrentPage}
      />

      {currentPage === 'home' ? (
        <>
          {/* Message Banner */}
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Main Content */}
          <div className="main-container">
            
            {/* Search Section */}
            <div className="search-section">
              <h2>{t.searchTitle}</h2>
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
              language={language}
            />
          </div>

          {/* Schedules Section */}
          <ScheduleList 
            schedules={schedules}
            loading={generatingSchedules}
            language={language}
          />

          {/* Scroll to Top Button */}
          <ScrollToTop language={language} />
        </>
      ) : (
        <HowToUse 
          language={language}
          onNavigate={setCurrentPage}
        />
      )}
      <Footer />
    </div>
  )
}

export default App