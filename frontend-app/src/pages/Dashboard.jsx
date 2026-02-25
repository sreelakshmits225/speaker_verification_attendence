import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

function Dashboard() {
    const [stats, setStats] = useState({ present: 0, total: 0 });
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classInfo, setClassInfo] = useState(null);
    const [settingLocation, setSettingLocation] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [studentsRes, logsRes, classRes] = await Promise.all([
                api.get('/api/v1/students/'),
                api.get('/api/v1/admin/attendance?limit=10'),
                api.get('/api/v1/admin/classes/101') // Default class
            ]);

            const total = studentsRes.data.length;
            const studentsMap = {};
            studentsRes.data.forEach(s => studentsMap[s.id] = s.name);

            const presentToday = new Set(logsRes.data
                .filter(l => {
                    const logDate = new Date(l.timestamp).toDateString();
                    const today = new Date().toDateString();
                    return l.status === 'PRESENT' && logDate === today;
                })
                .map(l => l.student_id)
            );

            setStats({ total, present: presentToday.size });
            setClassInfo(classRes.data);

            // Map names to logs
            const enrichedLogs = logsRes.data.map(log => ({
                ...log,
                student_name: studentsMap[log.student_id] || 'Unknown'
            })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            setRecentLogs(enrichedLogs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const setLocation = async () => {
        setSettingLocation(true);
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            setSettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await api.post('/api/v1/admin/classes/101/location', {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    radius: 20.0
                });
                alert("Classroom Location Fixed Successfully!");
                loadData(); // Refresh info
            } catch (e) {
                alert("Failed to update location");
            } finally {
                setSettingLocation(false);
            }
        }, (err) => {
            alert("Error getting location: " + err.message);
            setSettingLocation(false);
        }, { enableHighAccuracy: true });
    };

    return (
        <div className="animate-fade-in">
            <h1 style={{ textAlign: 'left', marginBottom: '10px' }}>🎙️ Voice Identity</h1>
            <p style={{ textAlign: 'left', color: '#aaa', marginBottom: '30px' }}>Real-time Biometric Attendance</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="glass-card" style={{ textAlign: 'center', marginBottom: 0, borderBottom: '4px solid #4caf50' }}>
                    <h3 style={{ fontSize: '2.5rem', margin: '0 0 5px 0', color: '#4caf50' }}>{stats.present}</h3>
                    <span style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase' }}>Present Today</span>
                </div>
                <Link to="/students" className="glass-card" style={{ textAlign: 'center', marginBottom: 0, textDecoration: 'none', color: 'inherit', borderBottom: '4px solid #646cff' }}>
                    <h3 style={{ fontSize: '2.5rem', margin: '0 0 5px 0', color: '#646cff' }}>{stats.total}</h3>
                    <span style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Enrolled</span>
                </Link>
            </div>

            {/* Classroom Boundary Section */}
            <div className="glass-card" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>📍 Classroom Boundary</h3>
                    {classInfo?.latitude ? (
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#aaa' }}>
                            Fixed at: <span style={{ color: '#fff' }}>{classInfo.latitude.toFixed(4)}, {classInfo.longitude.toFixed(4)}</span>
                            (Radius: <span style={{ color: '#fff' }}>{classInfo.radius}m</span>)
                        </p>
                    ) : (
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#ff9800' }}>⚠️ Boundary not set. Geofencing is disabled.</p>
                    )}
                </div>
                <button
                    onClick={setLocation}
                    disabled={settingLocation}
                    className="btn-primary"
                    style={{ margin: 0, padding: '10px 20px', fontSize: '0.8rem' }}
                >
                    {settingLocation ? "📡 Capturing..." : "Fix Location Here"}
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Recent Activity</h3>
                <Link to="/logs" style={{ fontSize: '0.8rem', color: '#646cff', textDecoration: 'none' }}>View All</Link>
            </div>

            {loading ? <p className="animate-pulse">Loading activity...</p> : (
                <div className="glass-card" style={{ padding: '10px 0' }}>
                    {recentLogs.length === 0 ? (
                        <p style={{ padding: '20px', color: '#666' }}>No recent activity detected.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {recentLogs.map((log, i) => (
                                <div key={log.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 20px',
                                    borderBottom: i === recentLogs.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{log.student_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            color: log.status === 'PRESENT' ? '#4caf50' : '#ff5252',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            background: log.status === 'PRESENT' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                                            padding: '4px 10px',
                                            borderRadius: '20px'
                                        }}>
                                            {log.status === 'PRESENT' ? 'MATCH' : 'FAIL'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '2px' }}>
                                            {(log.verification_score * 100).toFixed(0)}% Confidence
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default Dashboard
