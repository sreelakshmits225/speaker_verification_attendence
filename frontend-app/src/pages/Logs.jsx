import { useState, useEffect } from 'react'
import { api } from '../api'
import { ArrowLeft, Download } from 'lucide-react'
import { Link } from 'react-router-dom'

function Logs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsRes, logsRes] = await Promise.all([
                    api.get('/api/v1/students/'),
                    api.get('/api/v1/admin/attendance')
                ]);

                const studentsMap = {};
                studentsRes.data.forEach(s => studentsMap[s.id] = s.name);

                const enrichedLogs = logsRes.data.map(log => ({
                    ...log,
                    student_name: studentsMap[log.student_id] || 'Unknown'
                })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                setLogs(enrichedLogs);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const exportToCsv = () => {
        window.open(`${api.defaults.baseURL}/api/v1/admin/attendance/export`, '_blank');
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <Link to="/" style={{ color: 'white', marginRight: '15px' }}><ArrowLeft size={24} /></Link>
                <h1 style={{ margin: 0 }}>Attendance Logs</h1>
            </div>

            <button className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={exportToCsv}>
                <Download size={18} /> Export CSV
            </button>

            {loading ? <p>Loading logs...</p> : (
                <div className="glass-card" style={{ padding: '0' }}>
                    {logs.length === 0 ? <p style={{ padding: '20px' }}>No logs found.</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Time</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{log.student_name}</div>
                                            <div style={{ fontSize: '0.7rem', color: log.status === 'PRESENT' ? '#4caf50' : '#ff5252' }}>{log.status}</div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {new Date(log.timestamp).toLocaleDateString()}<br />
                                            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            {(log.verification_score * 100).toFixed(0)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    )
}

export default Logs
