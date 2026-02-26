import { useEffect, useState } from 'react'
import { api } from '../api'
import { ArrowLeft, User, Download, Trash2, Edit2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

function StudentList() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem('role');
    const navigate = useNavigate();

    useEffect(() => {
        if (role !== 'TEACHER') {
            navigate('/');
            return;
        }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [studentsRes, attendanceRes] = await Promise.all([
                api.get('/api/v1/students/'),
                api.get('/api/v1/admin/attendance')
            ]);

            const attendanceMap = {};
            attendanceRes.data.forEach(a => {
                attendanceMap[a.student_id] = a;
            });

            const sList = studentsRes.data.map(s => ({
                ...s,
                attendance: attendanceMap[s.id] || null
            }));

            setStudents(sList);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm("Are you sure you want to reset ALL attendance?")) return;
        try {
            await api.delete('/api/v1/admin/attendance/reset');
            loadData();
        } catch (e) {
            alert("Failed to reset");
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/api/v1/admin/attendance/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'attendance_report.csv');
            document.body.appendChild(link);
            link.click();
        } catch (e) {
            alert("Export failed. Make sure the sheet is approved.");
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link to="/" style={{ color: 'white', marginRight: '15px' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>All Students</h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleReset} className="btn-secondary" style={{ padding: '8px', fontSize: '0.7rem' }}><Trash2 size={14} /></button>
                    <button onClick={handleExport} className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.8rem', width: 'auto' }}>CSV</button>
                </div>
            </div>

            {loading ? <p>Loading Students...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {students.map(s => (
                        <div key={s.id} className="glass-card" style={{ marginBottom: 0, padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>Roll: {s.roll_number} | {s.course}</div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    color: s.attendance ? (s.attendance.status === 'LATECOMER' ? '#ff9800' : '#4caf50') : '#f44336'
                                }}>
                                    {s.attendance?.status || 'ABSENT'}
                                </div>
                                <Link to="/logs" style={{ color: '#646cff' }}><Edit2 size={16} /></Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default StudentList
