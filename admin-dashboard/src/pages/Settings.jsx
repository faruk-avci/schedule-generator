import React, { useState, useEffect } from 'react';
import AdminAPI from '../api';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchSettings = async () => {
        try {
            const res = await AdminAPI.getSettings();
            setSettings(res.data.settings || []);
        } catch (err) {
            console.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleUpdate = async (key, value) => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await AdminAPI.updateSetting(key, value);
            if (res.data.success) {
                setMessage({ type: 'success', text: `Successfully updated \${key}` });
                fetchSettings();
            }
        } catch (err) {
            setMessage({ type: 'error', text: `Failed to update \${key}` });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    const currentTerm = settings.find(s => s.key === 'current_term')?.value || '';

    return (
        <div className="p-8 settings-page">
            <header>
                <h1>Site Settings</h1>
                <p className="subtitle">Global configuration for OzuPlanner</p>
            </header>

            {message.text && (
                <div className={`alert \${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="settings-grid">
                <section className="settings-card">
                    <div className="card-header">
                        <h3>Academic Configuration</h3>
                    </div>
                    <div className="card-body">
                        <div className="setting-item">
                            <div className="label-area">
                                <label>Current Academic Term</label>
                                <p>This controls which term is displayed to students and used for schedule generation.</p>
                            </div>
                            <div className="input-area">
                                <input
                                    type="text"
                                    defaultValue={currentTerm}
                                    onBlur={(e) => {
                                        if (e.target.value !== currentTerm) {
                                            handleUpdate('current_term', e.target.value);
                                        }
                                    }}
                                    placeholder="e.g. 2024-2025 Spring"
                                />
                                <span className="input-hint">Changes are saved automatically on focus loss (blur).</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="settings-card disabled">
                    <div className="card-header">
                        <h3>Maintenance Mode</h3>
                    </div>
                    <div className="card-body">
                        <p className="placeholder-text">Coming Soon: Toggle site-wide maintenance mode.</p>
                    </div>
                </section>
            </div>

            <style>{`
                .settings-page {
                    max-width: 900px;
                    margin: 0 auto;
                }
                .subtitle {
                    color: #888;
                    margin-top: -1.5rem;
                    margin-bottom: 2.5rem;
                }
                .alert {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem 1.25rem;
                    border-radius: 0.75rem;
                    margin-bottom: 1.5rem;
                    font-weight: 500;
                    font-size: 0.9375rem;
                }
                .alert.success {
                    background: #22c55e15;
                    color: #22c55e;
                    border: 1px solid #22c55e30;
                }
                .alert.error {
                    background: #ef444415;
                    color: #ef4444;
                    border: 1px solid #ef444430;
                }
                .settings-card {
                    background: #111114;
                    border-radius: 1.25rem;
                    border: 1px solid #1f1f23;
                    margin-bottom: 1.5rem;
                    overflow: hidden;
                }
                .settings-card.disabled {
                    opacity: 0.5;
                }
                .card-header {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #1f1f23;
                    background: #16161a;
                }
                .card-header h3 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                }
                .card-body {
                    padding: 1.5rem;
                }
                .setting-item {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    align-items: flex-start;
                }
                label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }
                .label-area p {
                    font-size: 0.875rem;
                    color: #666;
                    line-height: 1.5;
                    margin: 0;
                }
                input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: #1a1a1e;
                    border: 1px solid #2a2a2f;
                    border-radius: 0.75rem;
                    color: white;
                    font-size: 0.9375rem;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }
                input:focus {
                    outline: none;
                    border-color: #3b82f6;
                }
                .input-hint {
                    display: block;
                    font-size: 0.75rem;
                    color: #444;
                    margin-top: 0.5rem;
                }
                .placeholder-text {
                    color: #444;
                    font-style: italic;
                    margin: 0;
                }
            `}</style>
        </div>
    );
};

export default Settings;
