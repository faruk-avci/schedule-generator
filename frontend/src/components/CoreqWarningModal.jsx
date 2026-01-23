import React from 'react';
import './CoreqWarningModal.css';
import { translations } from '../utils/translations';

const CoreqWarningModal = ({ missingCoreqs, onConfirm, onCancel, language = 'tr' }) => {
    const t = translations[language] || translations['tr'];
    const isTr = language === 'tr';

    return (
        <div className="modal-overlay">
            <div className="modal-content warning-modal">
                <div className="modal-header warning-header">
                    <div className="warning-icon">⚠️</div>
                    <h2>{isTr ? 'Eksik Yan Koşul Uyarısı' : 'Missing Corequisite Warning'}</h2>
                </div>

                <div className="modal-body">
                    <p className="warning-text">
                        {isTr
                            ? 'Aşağıdaki dersler için gerekli olan yan koşullar (lab/recitation) sepetinizde bulunamadı:'
                            : 'The following courses are missing their required corequisites (lab/recitation) in your basket:'}
                    </p>

                    <ul className="missing-coreq-list">
                        {missingCoreqs.map((item, index) => (
                            <li key={index} className="missing-coreq-item">
                                <span className="course-code">{item.course}</span>
                                <span className="arrow">→</span>
                                <span className="missing-code">{isTr ? 'Gereken:' : 'Requires:'} {item.missing}</span>
                            </li>
                        ))}
                    </ul>

                    <p className="warning-subtext">
                        {isTr
                            ? 'Bu dersleri almadan program oluşturmak istiyor musunuz? (Resmi kayıtta sorun yaşayabilirsiniz.)'
                            : 'Do you want to generate schedules without these? (You might face issues during official registration.)'}
                    </p>
                </div>

                <div className="modal-footer">
                    <button className="secondary-button" onClick={onCancel}>
                        {isTr ? 'Geri Dön ve Ekle' : 'Go Back & Add'}
                    </button>
                    <button className="primary-button warning-button" onClick={onConfirm}>
                        {isTr ? 'Yine de Oluştur' : 'Generate Anyway'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CoreqWarningModal;
