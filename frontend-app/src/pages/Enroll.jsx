import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Mic, Check, Square, Upload, User, AlertCircle } from 'lucide-react'
import { WavRecorder } from '../utils/WavRecorder'

function Enroll() {
    const [step, setStep] = useState(0); // 0: Profile check, 1-3: Record Samples
    const [studentData, setStudentData] = useState(null);
    const [recording, setRecording] = useState(false);
    const [mode, setMode] = useState('mic');
    const [blobs, setBlobs] = useState([]);
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);

    const recorderRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/api/v1/students/profile');
            setStudentData(res.data);
            if (!res.data.mentor_id) {
                setStatus('no_mentor');
            } else {
                setStep(1);
            }
        } catch (e) {
            setStatus('Error fetching profile');
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            recorderRef.current = new WavRecorder(16000);
            await recorderRef.current.start();
            setRecording(true);
        } catch (e) {
            setStatus('Error accessing mic: ' + e.message);
        }
    };

    const stopRecording = async () => {
        if (recorderRef.current && recording) {
            const wavBlob = await recorderRef.current.stop();
            setRecording(false);

            const newBlobs = [...blobs, wavBlob];
            setBlobs(newBlobs);

            if (newBlobs.length < 3) {
                setStep(step + 1);
            } else {
                submitEnrollment(newBlobs);
            }
        }
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        if (selected.length !== 3) {
            alert('Please select exactly 3 files.');
            return;
        }
        setFiles(selected);
    };

    const handleUploadSubmit = () => {
        if (files.length !== 3) return;
        submitEnrollment(files);
    };

    const submitEnrollment = async (finalFiles) => {
        setStatus('Uploading...');
        const formData = new FormData();
        formData.append('name', studentData?.name || 'Student');
        finalFiles.forEach((file, idx) => {
            const filename = `sample_${idx + 1}.wav`;
            formData.append('files', file, filename);
        });

        try {
            await api.post(`/api/v1/enroll/${studentData.id}`, formData);
            setStatus('success');
            setStep(4);
        } catch (e) {
            setStatus('Error: ' + (e.response?.data?.detail || e.message));
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading Profile...</div>;

    if (status === 'no_mentor') {
        return (
            <div className="glass-card animate-fade-in" style={{ textAlign: 'center', marginTop: '40px' }}>
                <AlertCircle size={48} color="#ff9800" style={{ marginBottom: '20px' }} />
                <h2>Mentor Not Selected</h2>
                <p style={{ color: '#aaa', marginBottom: '20px' }}>Please select a mentor on the dashboard first.</p>
                <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Go to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h1>📝 Voice Enrollment</h1>

            {status === 'success' ? (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <Check size={50} color="#4caf50" style={{ display: 'block', margin: '0 auto' }} />
                    <h2>Enrollment Complete!</h2>
                    <p style={{ color: '#aaa', margin: '15px 0' }}>Your voice signature has been saved and your mentor has been notified.</p>
                    <button className="btn-primary" onClick={() => (window.location.href = '/')}>Back to Dashboard</button>
                </div>
            ) : (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px', textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>ENROLLING FOR:</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{studentData?.name} (ID: {studentData?.id})</div>
                    </div>

                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
                        <button onClick={() => setMode('mic')} style={{ flex: 1, border: 'none', background: mode === 'mic' ? '#646cff' : 'transparent', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Microphone</button>
                        <button onClick={() => setMode('upload')} style={{ flex: 1, border: 'none', background: mode === 'upload' ? '#646cff' : 'transparent', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>File Upload</button>
                    </div>

                    {mode === 'mic' ? (
                        <>
                            <h3 style={{ color: '#aaa', textTransform: 'uppercase', fontSize: '0.9rem' }}>Capture {step} of 3</h3>
                            <h2>Record Voice Sample</h2>
                            <p style={{ marginBottom: '30px', color: '#646cff', fontWeight: 'bold' }}>"My voice is my password"</p>

                            {!recording ? (
                                <div onClick={startRecording} style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#ef4444', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}>
                                    <Mic size={40} color="white" />
                                </div>
                            ) : (
                                <div onClick={stopRecording} style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#333', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid #ef4444', transform: 'scale(1.1)', transition: '0.2s' }}>
                                    <Square size={40} color="#ef4444" fill="#ef4444" />
                                </div>
                            )}
                            <p style={{ marginTop: '20px', color: '#aaa' }}>{recording ? "Recording..." : "Tap to Speak"}</p>
                        </>
                    ) : (
                        <>
                            <h2>Upload Samples</h2>
                            <p style={{ marginBottom: '20px', color: '#aaa' }}>Select 3 recorded .wav files</p>
                            <input type="file" multiple accept="audio/*" onChange={handleFileChange} style={{ marginBottom: '20px' }} />
                            <button className="btn-primary" onClick={handleUploadSubmit} disabled={files.length !== 3}>Enroll with Files</button>
                        </>
                    )}
                </div>
            )}
            {status && status !== 'success' && status !== 'Uploading...' && <div className="glass-card" style={{ color: '#ff5252' }}>{status}</div>}
        </div>
    )
}

export default Enroll
