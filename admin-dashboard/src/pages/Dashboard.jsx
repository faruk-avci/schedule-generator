import React, { useState, useEffect } from 'react';
import AdminAPI from '../api';
import { Activity, Users, AlertCircle, RefreshCcw } from 'lucide-react';

const Dashboard = () => {
    const [logs, setLogs] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsRes, sessionsRes] = await Promise.all([
                AdminAPI.getLogs(),
                AdminAPI.getSessions()
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
    }, []);

    const stats = [
        { name: 'Recent Activity', value: logs.length, icon: <Activity className="text-blue-500" />, desc: 'Last 100 actions' },
        { name: 'Active Sessions', value: sessions.length, icon: <Users className="text-green-500" />, desc: 'Current unique users' },
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
                <section className="data-table-card">
                    <div className="table-header">
                        <h3>Activity Feed</h3>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>IP Address</th>
                                    <th>Details</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>
                                            <span className={`badge \${getBadgeStyle(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="mono">{log.ip_address}</td>
                                        <td className="details-col">
                                            <pre>{JSON.stringify(log.details)}</pre>
                                        </td>
                                        <td className="time-col">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <style>{`
                .dashboard {
                    max-width: 1200px;
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
                }
                .table-header h3 {
                    margin: 0;
                    font-size: 1.125rem;
                }
                .table-wrapper {
                    overflow-x: auto;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 0.875rem;
                }
                th {
                    padding: 1rem 1.5rem;
                    color: #555;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-size: 0.75rem;
                    border-bottom: 1px solid #1f1f23;
                }
                td {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #1f1f23;
                    color: #ccc;
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
                .details-col pre {
                    margin: 0;
                    max-width: 400px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 0.75rem;
                    color: #666;
                }
                .time-col {
                    color: #666;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
