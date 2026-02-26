import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { MapPin, CheckCircle, Clock, User, LogIn, ChevronRight, FileDown, CheckCircle2 } from 'lucide-react'

function Dashboard() {
    const [role, setRole] = useState(localStorage.getItem('role'));
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ present: 0, total: 0 });
    const [recentLogs, setRecentLogs] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [classInfo, setClassInfo] = useState(null);
    const [settingLocation, setSettingLocation] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const profileRes = await api.get('/api/v1/students/me');
            setUserProfile(profileRes.data);

            if (role === 'TEACHER') {
                const [statsRes, logsRes, classRes] = await Promise.all([
                    api.get('/api/v1/students/'),
                    api.get('/api/v1/admin/attendance?limit=10'),
                    api.get('/api/v1/admin/classes/101')
                ]);
                setStats({ total: statsRes.data.length, present: logsRes.data.filter(l => l.status === 'PRESENT').length });
                setRecentLogs(logsRes.data);
                setClassInfo(classRes.data);
            } else {
                const [studentProf, mentorsRes, myLogs] = await Promise.all([
                    api.get('/api/v1/students/profile'),
                    api.get('/api/v1/students/mentors'),
                    api.get('/api/v1/admin/attendance?limit=5')
                ]);
                setUserProfile({ ...profileRes.data, ...studentProf.data });
                setMentors(mentorsRes.data);
                setRecentLogs(myLogs.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const setLocation = async () => {
        setSettingLocation(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                await api.post('/api/v1/admin/classes/101/location', {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    radius: 20.0
                });
                alert("Location Fixed! Session Started.");
                loadData();
            } catch (e) {
                alert("Failed to update location");
            } finally {
                setSettingLocation(false);
            }
        }, () => setSettingLocation(false));
    };

    const selectMentor = async (id) => {
        try {
            await api.post(`/api/v1/students/select-mentor/${id}`);
            alert("Mentor Selected!");
            loadData();
        } catch (e) {
            alert(e.response?.data?.detail || "Failed to select mentor");
        }
    };

    const approveAttendance = async () => {
        try {
            await api.post('/api/v1/admin/attendance/approve?class_id=101');
            alert("Attendance Approved!");
            loadData();
        } catch (e) {
            alert("Failed to approve");
        }
    };

    const exportCsv = async () => {
        try {
            const response = await api.get('/api/v1/admin/attendance/export?class_id=101', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (e) {
            alert("Export failed. Make sure the sheet is approved.");
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading Dashboard...</div>;

    const teacherView = (
        <div className="animate-fade-in">
            <h1 style={{ textAlign: 'left', marginBottom: '10px' }}>👨‍🏫 Teacher Dashboard</h1>
            <p style={{ textAlign: 'left', color: '#aaa', marginBottom: '30px' }}>Welcome back, {userProfile?.username}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div className="glass-card" style={{ marginBottom: 0, textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2rem', margin: '10px 0', color: '#4caf50' }}>{stats.present}</h2>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>PRESENT TODAY</span>
                </div>
                <div className="glass-card" style={{ marginBottom: 0, textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2rem', margin: '10px 0', color: '#646cff' }}>{stats.total}</h2>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>TOTAL STUDENTS</span>
                </div>
            </div>

            <div className="glass-card" style={{ textAlign: 'left', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: '0 0 5px 0' }}>📍 Classroom Geofence</h3>
                        <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0 }}>
                            {classInfo?.session_start ? `Active since ${new Date(classInfo.session_start).toLocaleTimeString()}` : "Not active"}
                        </p>
                    </div>
                    <button onClick={setLocation} disabled={settingLocation} className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
                        {settingLocation ? "📡 Starting..." : "Start Session"}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={approveAttendance} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <CheckCircle2 size={18} /> Approve Sheet
                </button>
                <button onClick={exportCsv} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <FileDown size={18} /> Export CSV
                </button>
            </div>

            <h3 style={{ textAlign: 'left' }}>Recent Activity</h3>
            <div className="glass-card" style={{ padding: 0 }}>
                {recentLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #333' }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: '600' }}>Student ID: {log.student_id}</div>
                            <div style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: log.status === 'LATECOMER' ? '#ff9800' : (log.status === 'PRESENT' ? '#4caf50' : '#f44336'), fontWeight: '800', fontSize: '0.8rem' }}>
                                {log.status}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#666' }}>{Math.round(log.verification_score * 100)}% Match</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const studentView = (
        <div className="animate-fade-in">
            <h1 style={{ textAlign: 'left', marginBottom: '10px' }}>🎓 Student Dashboard</h1>
            <p style={{ textAlign: 'left', color: '#aaa', marginBottom: '30px' }}>Hello, {userProfile?.username}</p>

            {!userProfile?.mentor_id && (
                <div className="glass-card" style={{ border: '1px solid #ff9800' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#ff9800' }}>⚠️ Select Your Mentor</h3>
                    <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '20px' }}>You must select a mentor before marking attendance.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {mentors.map(m => (
                            <button key={m.id} onClick={() => selectMentor(m.id)} style={{ padding: '12px', background: '#23272f', border: '1px solid #333', color: '#fff', borderRadius: '8px', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                                {m.username} <ChevronRight size={18} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {userProfile?.mentor_id && (
                <div className="glass-card" style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 5px 0' }}>✅ Enrollment Status</h3>
                    <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Mentor: <span style={{ color: '#fff' }}>Teacher ID {userProfile.mentor_id}</span></p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <Link to="/enroll" className="btn-secondary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>Voice Enroll</Link>
                        <Link to="/verify" className="btn-primary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>Mark Attendance</Link>
                    </div>
                </div>
            )}

            <h3 style={{ textAlign: 'left', marginTop: '30px' }}>Your Recent Attendance</h3>
            <div className="glass-card" style={{ padding: 0 }}>
                {recentLogs.length === 0 ? <p style={{ padding: '20px', color: '#666' }}>No attendance records found.</p> : recentLogs.map(log => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #333' }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: '600' }}>Class ID: {log.class_id}</div>
                            <div style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <div style={{ color: log.status === 'LATECOMER' ? '#ff9800' : (log.status === 'PRESENT' ? '#4caf50' : '#f44336'), fontWeight: '800' }}>
                            {log.status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return role === 'TEACHER' ? teacherView : studentView;
}

export default Dashboard
