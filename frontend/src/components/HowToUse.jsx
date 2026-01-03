import { useEffect, useRef } from 'react';
import { logPageView } from '../services/api';

function HowToUse({ language, onNavigate }) {
  const hasLogged = useRef(false);

  useEffect(() => {
    if (!hasLogged.current) {
      logPageView('how-to-use');
      hasLogged.current = true;
    }
  }, []);

  const content = {
    tr: {
      title: "Nasıl Kullanılır?",
      backToHome: "Ana Sayfaya Dön",
      sections: [
        {
          number: "1",
          title: "Ders Ara",
          items: [
            "Arama kutusuna ders kodunu yazın.",
            "Örnek: BUS, BUS101, BUS 101 veya Bus 101 L",
            "Enter'a bastığınızda ilgili dersler listelenir."
          ]
        },
        {
          number: "2",
          title: "Ders Ekle",
          intro: "Bir dersi eklerken iki seçeneğiniz var:",
          options: [
            {
              name: "Dersi Ekle",
              desc: "Dersin tüm şubelerini sepete ekler. (Hangi şubenin uygun olduğuna sistem daha sonra karar verir.)"
            },
            {
              name: "Şubeleri Göster",
              desc: "Dersin şubelerini tek tek görürsünüz. Sadece istediğiniz şubeyi seçip ekleyebilirsiniz."
            }
          ],
          note: "Yani isterseniz dersi genel olarak, isterseniz belirli bir şubesiyle ekleyebilirsiniz."
        },
        {
          number: "3",
          title: "Program Oluştur",
          items: [
            'Tüm derslerinizi ekledikten sonra "Program Oluştur" butonuna tıklayın.',
            "Sistem:",
            "• Saatleri çakışmayan",
            "• Olası tüm program kombinasyonlarını sizin için hesaplar."
          ]
        },
        {
          number: "4",
          title: "Programları İncele",
          items: [
            "Oluşturulan programlar arasında geçiş yapabilirsiniz.",
            "Beğendiğiniz programı PDF veya resim olarak indirebilirsiniz."
          ]
        }
      ],
      warning: {
        title: "Önemli Not:",
        text: "OzuPlanner sadece bir planlama aracıdır. Resmi ders kayıt işlemleri için sis.ozyegin.edu.tr kullanılmalıdır."
      }
    },
    en: {
      title: "How to Use?",
      backToHome: "Back to Home",
      sections: [
        {
          number: "1",
          title: "Search Courses",
          items: [
            "Type the course code in the search box.",
            "Example: BUS, BUS101, BUS 101 or BUS 101 L",
            "Press Enter to see the relevant courses."
          ]
        },
        {
          number: "2",
          title: "Add Course",
          intro: "When adding a course, you have two options:",
          options: [
            {
              name: "Add Course",
              desc: "Adds all sections of the course to your basket. (The system will decide which section is suitable later.)"
            },
            {
              name: "Show Sections",
              desc: "You see the sections one by one. You can select and add only the section you want."
            }
          ],
          note: "So you can add the course either generally or with a specific section."
        },
        {
          number: "3",
          title: "Generate Schedules",
          items: [
            'After adding all your courses, click the "Generate Schedules" button.',
            "The system:",
            "• Finds all schedules without time conflicts",
            "• Calculates all possible schedule combinations for you."
          ]
        },
        {
          number: "4",
          title: "Review Schedules",
          items: [
            "You can switch between the generated schedules.",
            "You can download your preferred schedule as PDF or image."
          ]
        }
      ],
      warning: {
        title: "Important Note:",
        text: "OzuPlanner is only a planning tool. sis.ozyegin.edu.tr must be used for official course registration."
      }
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

        <div className="guide-sections">
          {t.sections.map((section, index) => (
            <div key={index} className="guide-section">
              <h2 className="section-title">
                {section.number}. {section.title}
              </h2>

              {section.intro && <p className="section-intro">{section.intro}</p>}

              {section.items && (
                <ul className="section-items">
                  {section.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}

              {section.options && (
                <div className="options-list">
                  {section.options.map((option, idx) => (
                    <div key={idx} className="option-item">
                      <strong>{option.name}</strong>
                      <p>→ {option.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.note && <p className="section-note">{section.note}</p>}
            </div>
          ))}
        </div>

        <div className="warning-banner">
          <strong>{t.warning.title}</strong>
          <p>{t.warning.text}</p>
        </div>
      </div>
    </div>
  );
}

export default HowToUse;