import React, { useState } from 'react';
import AdminAPI from '../api';
import { FileUp, Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const DataImport = () => {
    const [files, setFiles] = useState([]);
    const [term, setTerm] = useState('');
    const [clearExisting, setClearExisting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (files.length === 0) return setError('Please select at least one file.');
        if (!term) return setError('Please enter the academic term.');

        setLoading(true);
        setError('');
        setResults(null);

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('term', term);
        formData.append('clearExisting', clearExisting);

        try {
            const res = await AdminAPI.batchImport(formData);
            if (res.data.success) {
                setResults(res.data.summaries);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Import failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 import-page">
            <header>
                <h1>Batch Data Import</h1>
                <p className="subtitle">Upload Excel files to populate the course database</p>
            </header>

            <div className="import-grid">
                <section className="form-card">
                    <form onSubmit={handleUpload}>
                        <div className="form-group">
                            <label>Academic Term</label>
                            <input
                                type="text"
                                placeholder="e.g. 2024-2025 Spring"
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Select Excel Files (.xls, .xlsx)</label>
                            <div className="file-input-wrapper">
                                <FileUp size={24} className="icon" />
                                <input
                                    type="file"
                                    multiple
                                    accept=".xls,.xlsx"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                                <div className="file-info">
                                    {files.length > 0
                                        ? `\${files.length} files selected`
                                        : 'Click to browse or drag files here'}
                                </div>
                            </div>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={clearExisting}
                                    onChange={(e) => setClearExisting(e.target.checked)}
                                    disabled={loading}
                                />
                                <span>Clear existing database before import (Warning: This deletes all current courses)</span>
                            </label>
                        </div>

                        {error && <div className="alert error">{error}</div>}

                        <button type="submit" className="submit-btn" disabled={loading || files.length === 0}>
                            {loading ? (
                                <>
                                    <Loader2 className="spin" size={20} />
                                    <span>Processing Files...</span>
                                </>
                            ) : (
                                <span>Start Batch Import</span>
                            )}
                        </button>
                    </form>
                </section>

                <section className="info-card">
                    <div className="card-header">
                        <Info size={18} />
                        <h3>Guideline</h3>
                    </div>
                    <div className="card-body">
                        <ul>
                            <li>Supported formats: <strong>.xls</strong> and <strong>.xlsx</strong>.</li>
                            <li>The system expects columns like <code>SUBJECT</code>, <code>COURSENO</code>, <code>SECTIONNO</code>, <code>FACULTY</code>, and <code>SCHEDULEFORPRINT</code>.</li>
                            <li>If a row is invalid, the system will <strong>skip it</strong> and continue with the next one.</li>
                            <li>A full report will be generated after the import is complete.</li>
                        </ul>
                    </div>
                </section>
            </div>

            {results && (
                <div className="results-container">
                    <h2>Import Summary</h2>
                    <div className="summaries-grid">
                        {results.map((res, idx) => (
                            <div key={idx} className="summary-card">
                                <div className="summary-header">
                                    <h3>{res.fileName}</h3>
                                    <div className="stats">
                                        <span className="success">{res.success} imported</span>
                                        <span className="failed">{res.failed} skipped</span>
                                    </div>
                                </div>

                                {res.logs.length > 0 && (
                                    <div className="error-logs">
                                        <h4>Error Logs:</h4>
                                        <div className="log-list">
                                            {res.logs.map((log, lIdx) => (
                                                <div key={lIdx} className="log-item">
                                                    <span className="row-num">Row {log.row}:</span>
                                                    <span className="course-name">{log.course}</span>
                                                    <span className="error-text">- {log.error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .import-page { max-width: 1000px; margin: 0 auto; }
                .subtitle { color: #888; margin-bottom: 2.5rem; }
                
                .import-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                
                .form-card, .info-card {
                    background: #111114;
                    border: 1px solid #1f1f23;
                    border-radius: 1.25rem;
                    padding: 2rem;
                }
                
                .form-group { margin-bottom: 1.5rem; }
                .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #ccc; }
                
                input[type="text"] {
                    width: 100%;
                    background: #1a1a1e;
                    border: 1px solid #2a2a2f;
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    color: white;
                }
                
                .file-input-wrapper {
                    border: 2px dashed #2a2a2f;
                    border-radius: 0.75rem;
                    padding: 2rem;
                    text-align: center;
                    position: relative;
                    transition: border-color 0.2s;
                }
                .file-input-wrapper:hover { border-color: #3b82f6; }
                .file-input-wrapper input {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    cursor: pointer;
                    width: 100%;
                }
                .file-input-wrapper .icon { color: #3b82f6; margin-bottom: 1rem; }
                
                .checkbox-group label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.875rem;
                    color: #888;
                }
                
                .submit-btn {
                    width: 100%;
                    padding: 1rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 0.75rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    cursor: pointer;
                }
                .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .info-card { background: #1a1a1e30; border-color: #3b82f620; }
                .info-card .card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; color: #3b82f6; }
                .info-card .card-header h3 { margin: 0; font-size: 1rem; }
                .info-card ul { padding-left: 1.25rem; color: #888; font-size: 0.875rem; }
                .info-card li { margin-bottom: 0.75rem; }
                
                .results-container h2 { margin-bottom: 1.5rem; font-size: 1.5rem; }
                .summary-card {
                    background: #111114;
                    border: 1px solid #1f1f23;
                    border-radius: 1rem;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                }
                .summary-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .summary-header h3 { margin: 0; font-size: 1.125rem; }
                .stats { display: flex; gap: 1rem; font-weight: 600; font-size: 0.875rem; }
                .stats .success { color: #22c55e; }
                .stats .failed { color: #ef4444; }
                
                .error-logs h4 { font-size: 0.9375rem; margin-bottom: 0.75rem; color: #888; }
                .log-list { background: #000; padding: 1rem; border-radius: 0.5rem; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 0.8125rem; }
                .log-item { margin-bottom: 0.25rem; }
                .row-num { color: #3b82f6; margin-right: 0.5rem; }
                .course-name { color: #fff; margin-right: 0.5rem; }
                .error-text { color: #ef4444; }
                
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default DataImport;
