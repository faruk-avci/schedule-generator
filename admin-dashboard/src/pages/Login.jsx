import React, { useState } from 'react';
import AdminAPI from '../api';

const Login = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await AdminAPI.login(password);
            if (response.data.success) {
                onLogin();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>OzuPlanner Admin</h1>
                    <p>Enter password to access dashboard</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Admin Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={error ? 'error' : ''}
                            autoFocus
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>
            </div>

            <style>{`
                .login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: #0a0a0b;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    color: white;
                }
                .login-card {
                    background: #111114;
                    padding: 2.5rem;
                    border-radius: 1.5rem;
                    width: 100%;
                    max-width: 400px;
                    border: 1px solid #1f1f23;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                }
                .login-header h1 {
                    margin: 0;
                    font-size: 1.75rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                }
                .login-header p {
                    color: #888;
                    margin: 0.5rem 0 2rem 0;
                    font-size: 0.9375rem;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    background: #1a1a1e;
                    border: 1px solid #2a2a2f;
                    border-radius: 0.75rem;
                    color: white;
                    font-size: 1rem;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
                input.error {
                    border-color: #ef4444;
                }
                button {
                    width: 100%;
                    padding: 0.875rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 0.75rem;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                button:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }
                .error-message {
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                    text-align: center;
                }
            `}</style>
        </div>
    );
};

export default Login;
