import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AdminAPI from './api';
import { LayoutDashboard, BookOpen, Settings as SettingsIcon, LogOut, Users, FileUp } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Settings from './pages/Settings';
import DataImport from './pages/DataImport';

const Layout = ({ children, onLogout }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/courses', name: 'Courses', icon: <BookOpen size={20} /> },
    { path: '/import', name: 'Data Import', icon: <FileUp size={20} /> },
    { path: '/settings', name: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>OzuPlanner</h2>
          <span>Admin Panel</span>
        </div>

        <nav className="nav-menu">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="content">
        {children}
      </main>

      <style>{`
                .admin-layout {
                    display: grid;
                    grid-template-columns: 260px 1fr;
                    height: 100vh;
                    background: #0a0a0b;
                    color: white;
                    font-family: 'Inter', system-ui, sans-serif;
                }
                .sidebar {
                    background: #111114;
                    border-right: 1px solid #1f1f23;
                    display: flex;
                    flex-direction: column;
                    padding: 2rem 1rem;
                }
                .sidebar-header {
                    padding: 0 1rem 2.5rem 1rem;
                }
                .sidebar-header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                }
                .sidebar-header span {
                    color: #3b82f6;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                }
                .nav-menu {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    color: #888;
                    text-decoration: none;
                    border-radius: 0.75rem;
                    transition: all 0.2s;
                    font-weight: 500;
                }
                .nav-item:hover {
                    background: #1a1a1e;
                    color: white;
                }
                .nav-item.active {
                    background: #3b82f6;
                    color: white;
                }
                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    color: #ef4444;
                    background: none;
                    border: none;
                    width: 100%;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 1rem;
                    font-weight: 500;
                    border-top: 1px solid #1f1f23;
                    margin-top: 1rem;
                    padding-top: 1.5rem;
                }
                .content {
                    overflow-y: auto;
                    padding: 0;
                }
                h1 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin-bottom: 2rem;
                }
                .p-8 {
                    padding: 2.5rem;
                }
            `}</style>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await AdminAPI.checkAuth();
      if (res.data.authenticated) {
        setIsAuthenticated(true);
      }
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AdminAPI.logout();
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout failed');
    }
  };

  if (loading) return <div className="loading">Authenticating...</div>;

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/" />}
        />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/import" element={<DataImport />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
