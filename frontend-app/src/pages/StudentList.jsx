import { useEffect, useState } from 'react'
import { api } from '../api'
import { ArrowLeft, User, Download, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

function StudentList() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [studentsRes, logsRes] = await Promise.all([
                api.get('/api/v1/students/'),
                api.get('/api/v1/admin/attendance')
            ]);

            const logs = logsRes.data;
            const presentIds = new Set(logs.filter(l => l.status === 'PRESENT').map(l => l.student_id));

            const sList = studentsRes.data.map(s => ({
                ...s,
                status: presentIds.has(s.id) ? 'Present' : 'Absent'
            }));

            setStudents(sList);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm("Are you sure you want to reset attendance for TODAY? All 'Present' marks will be removed.")) return;
        try {
            await api.delete('/api/v1/admin/attendance/reset');
            loadData();
        } catch (e) {
            alert("Failed to reset: " + e.message);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/api/v1/admin/attendance/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            alert("Export failed: " + e.message);
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link to="/" style={{ color: 'white', marginRight: '15px' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', textAlign: 'left' }}>Student List</h1>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleReset}
                        className="btn-danger"
                        style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
                        title="Reset Attendance"
                    >
                        <Trash2 size={16} /> Reset
                    </button>
                    <button
                        onClick={handleExport}
                        className="btn-primary"
                        style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
                        title="Export CSV"
                    >
                        <Download size={16} /> CSV
                    </button>
                </div>
            </div>

            {loading ? <p>Loading...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {students.length === 0 ? <p>No students found.</p> : students.map(s => (
                        <div key={s.id} className="glass-card" style={{
                            marginBottom: 0, padding: '15px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderLeft: `4px solid ${s.status === 'Present' ? '#4caf50' : '#ef4444'}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', marginRight: '15px'
                                }}>
                                    <User size={20} color="#ddd" />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <h3 style={{ margin: '0 0 5px', fontSize: '1rem' }}>{s.name}</h3>
                                    <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>
                                        #{s.roll_number} • {s.course}
                                    </p>
                                </div>
                            </div>
                            <span style={{
                                color: s.status === 'Present' ? '#4caf50' : '#ef4444',
                                fontWeight: 'bold', fontSize: '0.8rem'
                            }}>
                                {s.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default StudentList
