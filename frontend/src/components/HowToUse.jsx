function HowToUse({ language, onNavigate }) {
  const content = {
    tr: {
      title: "Nasıl Kullanılır?",
      backToHome: "Ana Sayfaya Dön",
      sections: [
        {
          emoji: "🔍",
          title: "Ders Arama",
          steps: [
            "Ders kodu veya ders adı ile arama yapabilirsiniz",
            "Aramak istediğiniz metni girin ve Enter'a basın veya Ara butonuna tıklayın",
            "Sonuçlar otomatik olarak görüntülenecektir"
          ]
        },
        {
          emoji: "➕",
          title: "Ders Ekleme",
          steps: [
            "'Tüm Dersi Ekle' butonu ile dersin tüm bölümlerini ekleyebilirsiniz",
            "'Bölüm Ekle' butonu ile sadece istediğiniz bölümü ekleyebilirsiniz",
            "Eklenen dersler otomatik olarak programınıza yerleştirilecektir"
          ]
        },
        {
          emoji: "📅",
          title: "Program Görüntüleme",
          steps: [
            "Haftalık programınız saat dilimlerine göre görüntülenir",
            "Her ders kutusu dersin adını, bölümünü ve hocasını gösterir",
            "Çakışan dersler kırmızı renkle işaretlenir"
          ]
        },
        {
          emoji: "🗑️",
          title: "Ders Silme",
          steps: [
            "Program üzerindeki 'X' butonuna tıklayarak dersi silebilirsiniz",
            "Silinen dersler anında programdan kaldırılır"
          ]
        },
        {
          emoji: "🌙",
          title: "Tema Değiştirme",
          steps: [
            "Sağ üstteki güneş/ay ikonuna tıklayarak tema değiştirebilirsiniz",
            "Açık ve koyu tema seçenekleri mevcuttur"
          ]
        },
        {
          emoji: "🌐",
          title: "Dil Değiştirme",
          steps: [
            "Sağ üstteki dil seçici ile Türkçe ve İngilizce arasında geçiş yapabilirsiniz"
          ]
        }
      ]
    },
    en: {
      title: "How to Use?",
      backToHome: "Back to Home",
      sections: [
        {
          emoji: "🔍",
          title: "Course Search",
          steps: [
            "You can search by course code or course name",
            "Enter the text you want to search and press Enter or click the Search button",
            "Results will be displayed automatically"
          ]
        },
        {
          emoji: "➕",
          title: "Adding Courses",
          steps: [
            "Use 'Add Entire Course' button to add all sections of the course",
            "Use 'Add Section' button to add only the section you want",
            "Added courses will be automatically placed in your schedule"
          ]
        },
        {
          emoji: "📅",
          title: "Viewing Schedule",
          steps: [
            "Your weekly schedule is displayed by time slots",
            "Each course box shows the course name, section, and instructor",
            "Conflicting courses are marked in red"
          ]
        },
        {
          emoji: "🗑️",
          title: "Removing Courses",
          steps: [
            "Click the 'X' button on the schedule to remove a course",
            "Removed courses are instantly deleted from the schedule"
          ]
        },
        {
          emoji: "🌙",
          title: "Theme Switching",
          steps: [
            "Click the sun/moon icon in the top right to change the theme",
            "Light and dark theme options are available"
          ]
        },
        {
          emoji: "🌐",
          title: "Language Switching",
          steps: [
            "Use the language selector in the top right to switch between Turkish and English"
          ]
        }
      ]
    }
  };

  const t = content[language] || content.tr;

  return (
    <div className="how-to-use-page">
      <div className="how-to-use-container">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← {t.backToHome}
        </button>
        
        <h1 className="page-title">{t.title}</h1>
        
        <div className="sections-grid">
          {t.sections.map((section, index) => (
            <div key={index} className="info-card">
              <div className="card-header">
                <span className="card-emoji">{section.emoji}</span>
                <h2>{section.title}</h2>
              </div>
              <ul className="steps-list">
                {section.steps.map((step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HowToUse;