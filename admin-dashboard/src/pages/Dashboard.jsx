import React, { useState, useEffect, useRef } from 'react';
import AdminAPI from '../api';
import { Activity, Users, AlertCircle, RefreshCcw, Search } from 'lucide-react';

const Dashboard = () => {
    const [logs, setLogs] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Limit States
    const [logsLimit, setLogsLimit] = useState(100);
    const [sessionsLimit, setSessionsLimit] = useState(100);

    // Filter Logic
    const [sessionFilterQuery, setSessionFilterQuery] = useState('');

    // Refs for scrolling
    const sessionsTableRef = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsRes, sessionsRes] = await Promise.all([
                AdminAPI.getLogs(logsLimit),
                AdminAPI.getSessions(sessionsLimit)
            ]);
            setLogs(logsRes.data.logs || []);
            setSessions(sessionsRes.data.sessions || []);
        } catch (err) {
            console.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [logsLimit, sessionsLimit]); // Re-fetch on limit change

    const stats = [
        { name: 'Recent Activity', value: logs.length, icon: <Activity className="text-blue-500" />, desc: `Last ${logsLimit} actions` },
        { name: 'Active Sessions', value: sessions.length, icon: <Users className="text-green-500" />, desc: 'Current active' },
        { name: 'Client Errors', value: logs.filter(l => l.action === 'CLIENT_ERROR').length, icon: <AlertCircle className="text-red-500" />, desc: 'Issues reported in UI' },
    ];

    const getBadgeStyle = (action) => {
        switch (action) {
            case 'SEARCH': return 'bg-blue-500/10 text-blue-500';
            case 'ADD_COURSE': return 'bg-green-500/10 text-green-500';
            case 'CLIENT_ERROR': return 'bg-red-500/10 text-red-500';
            case 'ADMIN_LOGIN': return 'bg-purple-500/10 text-purple-500';
            default: return 'bg-gray-500/10 text-gray-400';
        }
    };

    const handleSessionClick = (sessionId) => {
        if (!sessionId) return;
        setSessionFilterQuery(sessionId);
        // Scroll to sessions table
        if (sessionsTableRef.current) {
            sessionsTableRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Filter sessions
    const filteredSessions = sessions.filter(session => {
        if (!sessionFilterQuery) return true;
        return session.sid.toLowerCase().includes(sessionFilterQuery.toLowerCase());
    });

    return (
        <div className="p-8 dashboard">
            <header className="flex-header">
                <div>
                    <h1>System Dashboard</h1>
                    <p className="subtitle">Real-time overview of OzuPlanner activity</p>
                </div>
                <button className="refresh-btn" onClick={fetchData} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'spin' : ''} />
                    <span>Refresh Data</span>
                </button>
            </header>

            <div className="stats-grid">
                {stats.map(stat => (
                    <div key={stat.name} className="stat-card">
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-info">
                            <span className="stat-label">{stat.name}</span>
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-desc">{stat.desc}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="data-sections">
                {/* 1. Activity Logs */}
                <section className="data-table-card">
                    <div className="table-header">
                        <h3>Activity Feed (Logs)</h3>
                        <div className="controls">
                            <span className="control-label">Limit:</span>
                            <input
                                type="number"
                                className="control-input"
                                value={logsLimit}
                                onChange={(e) => setLogsLimit(parseInt(e.target.value) || 10)}
                                min="10"
                                max="1000"
                            />
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Session ID</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                    <th>IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="time-col">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className="mono">
                                            <span
                                                className="clickable-id"
                                                onClick={() => handleSessionClick(log.session_id)}
                                                title="Filter Sessions by this ID"
                                            >
                                                {log.session_id ? log.session_id.substring(0, 8) + '...' : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getBadgeStyle(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="details-col">
                                            <div className="json-preview" title={JSON.stringify(log.details, null, 2)}>
                                                {JSON.stringify(log.details)}
                                            </div>
                                        </td>
                                        <td className="mono text-xs">{log.ip_address}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 2. Active Sessions */}
                <section className="data-table-card" ref={sessionsTableRef}>
                    <div className="table-header">
                        <h3>Active Sessions</h3>
                        <div className="controls">
                            <div className="filter-wrapper">
                                <Search size={14} className="search-icon" />
                                <input
                                    type="text"
                                    className="control-input search-input"
                                    placeholder="Filter Session ID..."
                                    value={sessionFilterQuery}
                                    onChange={(e) => setSessionFilterQuery(e.target.value)}
                                />
                            </div>
                            <span className="control-label">Limit:</span>
                            <input
                                type="number"
                                className="control-input"
                                value={sessionsLimit}
                                onChange={(e) => setSessionsLimit(parseInt(e.target.value) || 10)}
                                min="10"
                                max="1000"
                            />
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Session ID</th>
                                    <th>Basket / Data</th>
                                    <th>Expires</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSessions.length > 0 ? (
                                    filteredSessions.map(session => {
                                        let sessionData;
                                        try {
                                            sessionData = typeof session.sess === 'string' ? JSON.parse(session.sess) : session.sess;
                                        } catch (e) { sessionData = {}; }

                                        const basketCounts = sessionData.basket
                                            ? `Courses: ${sessionData.basket.courses?.length || 0}, Sections: ${sessionData.basket.sections?.length || 0}`
                                            : 'Empty';

                                        return (
                                            <tr key={session.sid}>
                                                <td className="mono text-blue-400 font-medium">
                                                    {session.sid.substring(0, 12)}...
                                                    {sessionData.isAdmin && <span className="ml-2 badge bg-red-500/20 text-red-500">ADMIN</span>}
                                                </td>
                                                <td className="details-col">
                                                    <div className="json-preview" title={JSON.stringify(sessionData, null, 2)}>
                                                        {JSON.stringify(sessionData)}
                                                    </div>
                                                </td>
                                                <td className="mono text-xs">
                                                    {new Date(session.expire).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colspan="3" className="text-center py-8 text-gray-500">
                                            No sessions found matching filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <style>{`
                .dashboard {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .flex-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2.5rem;
                }
                .subtitle {
                    color: #888;
                    margin-top: -1.5rem;
                }
                .refresh-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #1a1a1e;
                    border: 1px solid #1f1f23;
                    color: white;
                    padding: 0.625rem 1rem;
                    border-radius: 0.75rem;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .refresh-btn:hover {
                    background: #25252b;
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                .stat-card {
                    background: #111114;
                    padding: 1.5rem;
                    border-radius: 1.25rem;
                    border: 1px solid #1f1f23;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                }
                .stat-icon {
                    width: 3rem;
                    height: 3rem;
                    background: #1a1a1e;
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-info {
                    display: flex;
                    flex-direction: column;
                }
                .stat-label {
                    color: #888;
                    font-size: 0.875rem;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0.125rem 0;
                }
                .stat-desc {
                    color: #555;
                    font-size: 0.75rem;
                }
                .data-table-card {
                    background: #111114;
                    border-radius: 1.25rem;
                    border: 1px solid #1f1f23;
                    margin-bottom: 2.5rem;
                    overflow: hidden;
                }
                .table-header {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #1f1f23;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .table-header h3 {
                    margin: 0;
                    font-size: 1.125rem;
                }
                .controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .control-label {
                    color: #666;
                    font-size: 0.875rem;
                }
                .control-input {
                    background: #1a1a1e;
                    border: 1px solid #333;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    width: 80px;
                }
                .filter-wrapper {
                    position: relative;
                    margin-right: 15px;
                }
                .search-input {
                    width: 200px;
                    padding-left: 30px;
                }
                .search-icon {
                    position: absolute;
                    left: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #666;
                }
                .table-wrapper {
                    overflow-x: auto;
                    max-height: 600px;
                    overflow-y: auto;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 0.875rem;
                }
                th {
                    position: sticky;
                    top: 0;
                    background: #111114;
                    padding: 1rem 1.5rem;
                    color: #555;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-size: 0.75rem;
                    border-bottom: 1px solid #1f1f23;
                    z-index: 10;
                }
                td {
                    padding: 0.75rem 1.5rem;
                    border-bottom: 1px solid #1f1f23;
                    color: #ccc;
                    vertical-align: top;
                }
                tr:last-child td {
                    border-bottom: none;
                }
                .badge {
                    padding: 0.25rem 0.625rem;
                    border-radius: 99rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .mono {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    color: #888;
                }
                .json-preview {
                    max-width: 400px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 0.75rem;
                    color: #666;
                    font-family: monospace;
                    cursor: help;
                }
                .json-preview:hover {
                    white-space: pre-wrap;
                    background: #1a1a1e;
                    position: absolute;
                    z-index: 50;
                    padding: 10px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    max-width: 600px;
                    border: 1px solid #333;
                }
                .clickable-id {
                    color: #3b82f6;
                    cursor: pointer;
                    text-decoration: underline;
                    text-decoration-color: transparent;
                    transition: all 0.2s;
                }
                .clickable-id:hover {
                    color: #60a5fa;
                    text-decoration-color: #60a5fa;
                }
                .time-col {
                    color: #666;
                    white-space: nowrap;
                }
                .text-xs { font-size: 0.75rem; }
            `}</style>
        </div>
    );
};

export default Dashboard;
