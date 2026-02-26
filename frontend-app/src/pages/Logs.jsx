import { useState, useEffect } from 'react'
import { api } from '../api'
import { ArrowLeft, Download, CheckCircle, Edit, Save, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

function Logs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const role = localStorage.getItem('role');
    const navigate = useNavigate();

    useEffect(() => {
        if (role !== 'TEACHER') {
            navigate('/');
            return;
        }
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
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

    const handleStatusUpdate = async (id) => {
        try {
            await api.patch(`/api/v1/admin/attendance/${id}?status=${newStatus}`);
            setEditingId(null);
            fetchLogs();
        } catch (e) {
            alert("Error updating status: " + (e.response?.data?.detail || "Only mentors can change status"));
        }
    };

    const handleApproveAll = async () => {
        try {
            await api.post('/api/v1/admin/attendance/approve?class_id=101');
            alert("Attendance Records Approved!");
            fetchLogs();
        } catch (e) {
            alert("Approval failed");
        }
    };

    const exportToCsv = async () => {
        try {
            const response = await api.get('/api/v1/admin/attendance/export?class_id=101', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'approved_attendance.csv');
            document.body.appendChild(link);
            link.click();
        } catch (e) {
            alert("Export failed. Ensure data is approved first.");
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link to="/" style={{ color: 'white', marginRight: '15px' }}><ArrowLeft size={24} /></Link>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Attendance Management</h1>
                </div>
                <button onClick={handleApproveAll} className="btn-primary" style={{ width: 'auto', padding: '10px 15px', fontSize: '0.8rem' }}>
                    Approve All
                </button>
            </div>

            <button className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={exportToCsv}>
                <Download size={18} /> Export Approved CSV
            </button>

            {loading ? <p>Loading records...</p> : (
                <div className="glass-card" style={{ padding: '0' }}>
                    {logs.length === 0 ? <p style={{ padding: '20px' }}>No records found.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {logs.map((log) => (
                                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 'bold' }}>{log.student_name}</div>
                                        {editingId === log.id ? (
                                            <select
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                                style={{ background: '#333', color: '#fff', border: '1px solid #646cff', borderRadius: '4px', padding: '2px 5px', marginTop: '5px' }}
                                            >
                                                <option value="PRESENT">PRESENT</option>
                                                <option value="LATECOMER">LATECOMER</option>
                                                <option value="ABSENT">ABSENT</option>
                                            </select>
                                        ) : (
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: log.status === 'LATECOMER' ? '#ff9800' : (log.status === 'PRESENT' ? '#4caf50' : '#f44336') }}>
                                                {log.status} {log.is_approved && <CheckCircle size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {editingId === log.id ? (
                                            <>
                                                <button onClick={() => handleStatusUpdate(log.id)} style={{ background: 'none', border: 'none', color: '#4caf50', cursor: 'pointer' }}><Save size={18} /></button>
                                                <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer' }}><X size={18} /></button>
                                            </>
                                        ) : (
                                            <button onClick={() => { setEditingId(log.id); setNewStatus(log.status); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><Edit size={18} /></button>
                                        )}
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

export default Logs
