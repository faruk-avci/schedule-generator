import React, { useState } from 'react';
import AdminAPI from '../api';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const Login = ({ onLogin }) => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            const response = await AdminAPI.login(idToken);
            if (response.data.success) {
                onLogin();
            }
        } catch (err) {
            console.error('Login error:', err);
            let message = 'Login failed. ';

            if (err.code === 'auth/popup-closed-by-user') {
                message += 'Login window closed.';
            } else {
                message += err.response?.data?.error || err.message;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>OzuPlanner Admin</h1>
                    <p>Sign in with your authorized Google account</p>
                </div>

                <div className="login-actions">
                    <button
                        className="google-login-btn"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <svg className="google-icon" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {loading ? 'Signing in...' : 'Sign in with Google'}
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
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
                button.google-login-btn {
                    width: 100%;
                    padding: 0.875rem;
                    background: white;
                    color: #374151;
                    border: 1px solid #d1d5db;
                    border-radius: 0.75rem;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                }
                button.google-login-btn:hover:not(:disabled) {
                    background: #f9fafb;
                    border-color: #9ca3af;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .google-icon {
                    width: 20px;
                    height: 20px;
                }
                .error-message {
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-top: 1.5rem;
                    text-align: center;
                    padding: 0.75rem;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 0.5rem;
                }
            `}</style>
        </div>
    );
};

export default Login;
