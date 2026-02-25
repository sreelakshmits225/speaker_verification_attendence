import { useState, useRef, useEffect } from 'react'
import { api } from '../api'
import { Mic, Square, User, Upload } from 'lucide-react'
import { WavRecorder } from '../utils/WavRecorder'

function Verify() {
    const [recording, setRecording] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('mic'); // 'mic', 'upload'
    const [location, setLocation] = useState(null);
    const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle', 'acquiring', 'ready'

    const recorderRef = useRef(null);
    const locationRef = useRef(null);
    const gpsStatusRef = useRef('idle');
    const watchIdRef = useRef(null);

    useEffect(() => {
        // Start watching position as soon as page loads
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
                    console.log("GPS Pulse:", coords);
                },
                (err) => {
                    console.warn("GPS Error:", err);
                    setGpsStatus('error');
                    gpsStatusRef.current = 'error';
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
            );
        }

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const startRecording = async () => {
        setResult(null);
        // Refresh lock check: if error or idle, it stays that way until watch updates
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

            // Wait slightly if GPS is still acquiring
            if (gpsStatusRef.current === 'acquiring') {
                setLoading(true);
                let checks = 0;
                const checkGps = setInterval(() => {
                    checks++;
                    if (gpsStatusRef.current !== 'acquiring' || checks > 15) {
                        clearInterval(checkGps);
                        verifyVoice(wavBlob);
                    }
                }, 200);
            } else {
                verifyVoice(wavBlob);
            }
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            verifyVoice(e.target.files[0]);
        }
    };

    const verifyVoice = async (blob) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', blob, 'verify.wav');

        // Use Ref for real-time coordinates
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

    return (
        <div className="animate-fade-in">
            <h1>🔍 Identify Me</h1>

            <div className="glass-card" style={{ textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                {/* Mode Toggle */}
                {!result && !loading && (
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px', marginBottom: '30px' }}>
                        <button
                            onClick={() => setMode('mic')}
                            style={{
                                flex: 1, border: 'none', background: mode === 'mic' ? '#646cff' : 'transparent',
                                color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                            }}>
                            Mic
                        </button>
                        <button
                            onClick={() => setMode('upload')}
                            style={{
                                flex: 1, border: 'none', background: mode === 'upload' ? '#646cff' : 'transparent',
                                color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                            }}>
                            Upload
                        </button>
                    </div>
                )}

                {loading && <p className="animate-pulse">Analyzing Voice Print...</p>}

                {!loading && !result && (
                    <>
                        {mode === 'mic' ? (
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
                                            background: '#ef4444',
                                            margin: '0 auto',
                                            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', transition: 'all 0.2s',
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
                                    {recording ? "Recording... Tap to stop" : "Tap to Speak"}
                                </p>
                            </>
                        ) : (
                            <div style={{
                                border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px',
                                padding: '30px', cursor: 'pointer'
                            }}>
                                <Upload size={40} style={{ opacity: 0.8, marginBottom: '15px' }} />
                                <p style={{ marginBottom: '10px' }}>Upload Audio File</p>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleFileChange}
                                    style={{ maxWidth: '200px', margin: '0 auto' }}
                                />
                            </div>
                        )}
                    </>
                )}

                {result && (
                    <div className="animate-fade-in">
                        {result.identified ? (
                            <>
                                <div style={{ width: '80px', height: '80px', background: '#44b700', borderRadius: '50%', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={40} color="white" />
                                </div>
                                <h2 style={{ margin: '0 0 5px' }}>{result.name}</h2>
                                <p style={{ color: '#44b700', fontWeight: 'bold' }}>ID: {result.student_id}</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '0.8rem', opacity: 0.7, marginTop: '10px' }}>
                                    <span>Match: {(result.score * 100).toFixed(0)}%</span>
                                    <span>Liveness: {(result.liveness_score * 100).toFixed(0)}%</span>
                                    <span style={{ color: result.location_verified ? '#4caf50' : '#ff5252', fontWeight: 'bold' }}>
                                        {result.location_verified ? "📍 GPS Verified" : "📍 GPS Outside"}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 style={{ color: '#ff5252' }}>{result.message || "Unknown Speaker"}</h2>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '0.8rem', opacity: 0.7, marginTop: '10px' }}>
                                    <span>Match: {(result.score * 100).toFixed(0)}%</span>
                                    <span>Liveness: {(result.liveness_score * 100).toFixed(0)}%</span>
                                    <span style={{ color: result.location_verified ? '#4caf50' : '#ff5252', fontWeight: 'bold' }}>
                                        {result.location_verified ? "📍 GPS Verified" : "📍 GPS Failed"}
                                    </span>
                                </div>
                            </>
                        )}
                        <button className="btn-secondary" style={{ marginTop: '20px' }} onClick={() => setResult(null)}>Try Again</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Verify
