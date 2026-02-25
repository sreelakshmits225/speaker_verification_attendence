import { useState, useRef } from 'react'
import { api } from '../api'
import { Mic, Check, Square, Upload } from 'lucide-react'
import { WavRecorder } from '../utils/WavRecorder'

function Enroll() {
    const [step, setStep] = useState(0); // 0: Input ID, 1-3: Record Samples
    const [studentId, setStudentId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [recording, setRecording] = useState(false);
    const [mode, setMode] = useState('mic'); // 'mic' or 'upload'
    const [blobs, setBlobs] = useState([]);
    const [files, setFiles] = useState([]); // For upload mode
    const [status, setStatus] = useState('');

    const recorderRef = useRef(null);

    const startRecording = async () => {
        try {
            // Use 16kHz to match backend model
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
            setStatus('Please select exactly 3 files.');
            return;
        }
        setFiles(selected);
        setStatus('');
    };

    const handleUploadSubmit = () => {
        if (files.length !== 3) {
            setStatus('Please select exactly 3 files.');
            return;
        }
        submitEnrollment(files);
    };

    const submitEnrollment = async (finalFiles) => {
        setStatus('Uploading...');
        const formData = new FormData();
        formData.append('name', studentName);
        finalFiles.forEach((file, idx) => {
            const filename = file.name || `sample_${idx + 1}.wav`;
            formData.append('files', file, filename);
        });

        try {
            await api.post(`/api/v1/enroll/${studentId}`, formData);
            setStatus('success');
            setStep(4);
        } catch (e) {
            setStatus('Error: ' + (e.response?.data?.detail || e.message));
        }
    };

    return (
        <div className="animate-fade-in">
            <h1>📝 Enroll Voice</h1>

            {status === 'success' ? (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <Check size={50} color="#4caf50" style={{ display: 'block', margin: '0 auto' }} />
                    <h2>Enrollment Complete!</h2>
                    <button className="btn-primary" onClick={() => window.location.reload()}>Enroll Another</button>
                </div>
            ) : (
                <>
                    {step === 0 && (
                        <div className="glass-card">
                            <h3>Student Details</h3>
                            <input
                                className="glass-input"
                                type="number"
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                                placeholder="Student ID (e.g. 101)"
                                style={{ marginBottom: '15px' }}
                            />
                            <input
                                className="glass-input"
                                type="text"
                                value={studentName}
                                onChange={e => setStudentName(e.target.value)}
                                placeholder="Full Name (e.g. John Doe)"
                            />
                            <button className="btn-primary" disabled={!studentId || !studentName} onClick={() => setStep(1)}>
                                Next
                            </button>
                        </div>
                    )}

                    {step >= 1 && (
                        <div className="glass-card" style={{ textAlign: 'center' }}>
                            {/* Toggle */}
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
                                <button
                                    onClick={() => setMode('mic')}
                                    style={{
                                        flex: 1, border: 'none', background: mode === 'mic' ? '#646cff' : 'transparent',
                                        color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                                    }}>
                                    Microphone
                                </button>
                                <button
                                    onClick={() => setMode('upload')}
                                    style={{
                                        flex: 1, border: 'none', background: mode === 'upload' ? '#646cff' : 'transparent',
                                        color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                                    }}>
                                    File Upload
                                </button>
                            </div>

                            {mode === 'mic' ? (
                                <>
                                    <h3 style={{ color: '#aaa', textTransform: 'uppercase', fontSize: '0.9rem' }}>Step {step} of 3</h3>
                                    <h2>Record Sample {step}</h2>
                                    <p style={{ marginBottom: '30px' }}>Say: "My voice is my password"</p>

                                    {!recording ? (
                                        <div
                                            onClick={startRecording}
                                            style={{
                                                width: '80px', height: '80px', borderRadius: '50%',
                                                background: '#ef4444', margin: '0 auto',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
                                                userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'none'
                                            }}>
                                            <Mic size={32} color="white" />
                                        </div>
                                    ) : (
                                        <div
                                            onClick={stopRecording}
                                            style={{
                                                width: '80px', height: '80px', borderRadius: '50%',
                                                background: '#333', margin: '0 auto',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', border: '2px solid #ef4444',
                                                userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'none'
                                            }}>
                                            <Square size={32} color="#ef4444" fill="#ef4444" />
                                        </div>
                                    )}
                                    <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#666', userSelect: 'none' }}>
                                        {recording ? "Recording... Tap to stop." : "Tap to record"}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2>Upload Samples</h2>
                                    <p style={{ marginBottom: '20px' }}>Select 3 recorded .wav files</p>

                                    <div style={{
                                        border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px',
                                        padding: '30px', marginBottom: '20px', cursor: 'pointer'
                                    }}>
                                        <Upload size={30} style={{ opacity: 0.5, marginBottom: '10px' }} />
                                        <input
                                            type="file"
                                            multiple
                                            accept="audio/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'block', margin: '0 auto', width: '100%' }}
                                        />
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Max 3 files</p>
                                    </div>
                                    <button className="btn-primary" onClick={handleUploadSubmit} disabled={files.length !== 3}>
                                        Upload & Enroll
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            {status && status !== 'success' && <div className="glass-card" style={{ color: '#ff5252' }}>{status}</div>}
        </div>
    )
}

export default Enroll
