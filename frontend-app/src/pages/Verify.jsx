import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Mic, Square, User, Upload, AlertCircle } from 'lucide-react'
import { WavRecorder } from '../utils/WavRecorder'

function Verify() {
    const [recording, setRecording] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('mic');
    const [location, setLocation] = useState(null);
    const [gpsStatus, setGpsStatus] = useState('idle');
    const [hasMentor, setHasMentor] = useState(true);
    const navigate = useNavigate();

    const recorderRef = useRef(null);
    const locationRef = useRef(null);
    const gpsStatusRef = useRef('idle');
    const watchIdRef = useRef(null);

    useEffect(() => {
        checkProfile();
        startGpsWatch();
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const checkProfile = async () => {
        try {
            const res = await api.get('/api/v1/students/profile');
            if (!res.data.mentor_id) {
                setHasMentor(false);
            }
        } catch (e) {
            console.error("Profile check failed");
        }
    };

    const startGpsWatch = () => {
        if ("geolocation" in navigator) {
            setGpsStatus('acquiring');
            gpsStatusRef.current = 'acquiring';

            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                    setLocation(coords);
                    locationRef.current = coords;
                    setGpsStatus('ready');
                    gpsStatusRef.current = 'ready';
                },
                (err) => {
                    setGpsStatus('error');
                    gpsStatusRef.current = 'error';
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
            );
        } else {
            setGpsStatus('error');
        }
    };

    const startRecording = async () => {
        if (gpsStatus !== 'ready') return;
        setResult(null);
        try {
            recorderRef.current = new WavRecorder(16000);
            await recorderRef.current.start();
            setRecording(true);
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    const stopRecording = async () => {
        if (recorderRef.current && recording) {
            const wavBlob = await recorderRef.current.stop();
            setRecording(false);
            verifyVoice(wavBlob);
        }
    };

    const verifyVoice = async (blob) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', blob, 'verify.wav');

        const currentLoc = locationRef.current;
        if (currentLoc) {
            formData.append('latitude', currentLoc.lat);
            formData.append('longitude', currentLoc.lon);
        }

        try {
            const res = await api.post('/api/v1/verify/identify', formData);
            setResult(res.data);
        } catch (e) {
            setResult({ error: e.response?.data?.detail || "Connection Failed" });
        } finally {
            setLoading(false);
        }
    };

    if (!hasMentor) {
        return (
            <div className="animate-fade-in" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div className="glass-card">
                    <AlertCircle size={48} color="#ff9800" style={{ marginBottom: '20px' }} />
                    <h2>Mentor Required</h2>
                    <p style={{ color: '#aaa', marginBottom: '20px' }}>You must select a mentor in your dashboard before you can mark attendance.</p>
                    <button className="btn-primary" onClick={() => navigate('/')}>Go to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h1>🔍 Mark Attendance</h1>

            <div className="glass-card" style={{ textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                {loading && <p className="animate-pulse">Analyzing Voice Print...</p>}

                {!loading && !result && (
                    <>
                        <div style={{
                            marginBottom: '20px',
                            color: gpsStatus === 'ready' ? '#4caf50' : (gpsStatus === 'acquiring' ? '#ff9800' : '#f44336'),
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}>
                            {gpsStatus === 'ready' ? "📍 GPS Locked & Secured" :
                                gpsStatus === 'acquiring' ? "📡 Acquiring GPS..." :
                                    "⚠️ GPS Error: Check Permissions"}
                        </div>

                        {!recording ? (
                            <div
                                onClick={startRecording}
                                style={{
                                    width: '120px', height: '120px', borderRadius: '50%',
                                    background: gpsStatus === 'ready' ? '#ef4444' : '#333',
                                    margin: '0 auto',
                                    boxShadow: gpsStatus === 'ready' ? '0 10px 20px rgba(0,0,0,0.3)' : 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: gpsStatus === 'ready' ? 'pointer' : 'not-allowed',
                                    opacity: gpsStatus === 'ready' ? 1 : 0.5,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Mic size={50} color="white" />
                            </div>
                        ) : (
                            <div
                                onClick={stopRecording}
                                style={{
                                    width: '120px', height: '120px', borderRadius: '50%',
                                    background: '#333',
                                    margin: '0 auto',
                                    border: '4px solid #ef4444',
                                    boxShadow: '0 0 30px #ef4444',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s', transform: 'scale(1.1)',
                                }}
                            >
                                <Square size={50} color="#ef4444" fill="#ef4444" />
                            </div>
                        )}
                        <p style={{ marginTop: '20px', color: '#aaa' }}>
                            {recording ? "Recording... Tap to stop" :
                                gpsStatus === 'ready' ? "Tap to Speak" : "Waiting for GPS..."}
                        </p>
                    </>
                )}

                {result && (
                    <div className="animate-fade-in">
                        {result.identified ? (
                            <>
                                <div style={{ width: '80px', height: '80px', background: '#44b700', borderRadius: '50%', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={40} color="white" />
                                </div>
                                <h2 style={{ margin: '0 0 5px' }}>Attendance Logged</h2>
                                <div style={{
                                    fontSize: '1.2rem',
                                    fontWeight: '800',
                                    color: result.status === 'LATECOMER' ? '#ff9800' : '#4caf50',
                                    marginBottom: '10px'
                                }}>
                                    Status: {result.status}
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                    Voice Match: {(result.score * 100).toFixed(0)}%
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 style={{ color: '#ff5252' }}>Verification Failed</h2>
                                <p style={{ color: '#f44336', fontWeight: 'bold' }}>{result.message}</p>
                                <p style={{ fontSize: '0.9rem', color: '#aaa' }}> Ensure you are in the classroom and speaking clearly.</p>
                            </>
                        )}
                        <button className="btn-secondary" style={{ marginTop: '30px' }} onClick={() => setResult(null)}>Try Again</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Verify
