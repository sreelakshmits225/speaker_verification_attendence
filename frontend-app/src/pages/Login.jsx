import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Settings, Server, RefreshCcw } from 'lucide-react';
import { api, saveApiUrl } from '../api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [error, setError] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [apiUrl, setApiUrl] = useState(localStorage.getItem('api_url') || `http://${window.location.hostname}:8001`);
    const navigate = useNavigate();

    // Force update from old port 8000
    useEffect(() => {
        const current = localStorage.getItem('api_url');
        if (current && current.includes(':8000')) {
            console.log("Migrating port 8000 -> 8001");
            localStorage.removeItem('api_url');
            window.location.reload();
        }
    }, []);

    // Reset local state if needed
    const clearStorage = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isRegister ? '/api/v1/auth/register' : '/api/v1/auth/login';

        try {
            let res;
            if (isRegister) {
                res = await api.post(endpoint, { username, password, role });
                setIsRegister(false);
                alert('Registration successful! Please login.');
            } else {
                const params = new URLSearchParams({ username, password });
                res = await api.post(endpoint, params, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                const data = res.data;
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('username', username);
                navigate('/');
            }
        } catch (err) {
            console.error('Auth Error:', err);
            if (err.response) {
                // The server responded with a status code outside the 2xx range
                const detail = err.response.data?.detail;
                if (Array.isArray(detail)) {
                    setError(detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', '));
                } else {
                    setError(detail || 'Authentication failed');
                }
            } else if (err.request) {
                // The request was made but no response was received
                setError(`Connection timed out to ${apiUrl}. Check if the backend is running correctly.`);
            } else {
                // Something happened in setting up the request that triggered an Error
                setError('Request error: ' + err.message);
            }
        }
    };

    const handleSetUrl = () => {
        saveApiUrl(apiUrl);
        setShowSettings(false);
    };

    return (
        <div className="login-container" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '20px', background: '#0f1115', position: 'relative', color: '#fff'
        }}>
            {/* Header Icons */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '15px' }}>
                <RefreshCcw
                    size={20}
                    onClick={clearStorage}
                    style={{ cursor: 'pointer', opacity: 0.5 }}
                    title="Reset App State"
                />
                <Settings
                    size={24}
                    onClick={() => setShowSettings(!showSettings)}
                    style={{ cursor: 'pointer', opacity: 0.8 }}
                    title="API Settings"
                />
            </div>

            {showSettings && (
                <div className="glass-card animate-fade-in" style={{
                    position: 'absolute', top: '60px', right: '20px', zIndex: 100,
                    maxWidth: '300px', border: '1px solid #646cff', textAlign: 'left'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={18} /> API Settings
                    </h4>
                    <p style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '10px' }}>
                        Current Target: {apiUrl}
                    </p>
                    <input
                        type="text"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        className="login-input"
                        style={{ padding: '8px', fontSize: '0.8rem', marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-primary" onClick={handleSetUrl} style={{ flex: 2, padding: '8px', fontSize: '0.8rem' }}>
                            Update & Reload
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={async () => {
                                try {
                                    const res = await api.get('/health');
                                    alert(`Connection Success! Backend version: ${res.data.version}`);
                                } catch (e) {
                                    alert(`Connection Failed: ${e.message}`);
                                }
                            }}
                            style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                        >
                            Test
                        </button>
                    </div>
                </div>
            )}

            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <ShieldCheck size={48} color="#646cff" style={{ marginBottom: '10px' }} />
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
                        {isRegister ? 'Create Account' : 'Voice Attendance Login'}
                    </h2>
                </div>

                <form onSubmit={handleAuth}>
                    <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="login-input"
                        />
                    </div>

                    <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="login-input"
                        />
                    </div>

                    {isRegister && (
                        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>I am a:</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setRole('STUDENT')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #333',
                                        background: role === 'STUDENT' ? '#646cff' : 'transparent',
                                        color: '#fff', cursor: 'pointer'
                                    }}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('TEACHER')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #333',
                                        background: role === 'TEACHER' ? '#646cff' : 'transparent',
                                        color: '#fff', cursor: 'pointer'
                                    }}
                                >
                                    Teacher
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            color: '#ff4d4d', fontSize: '0.8rem', marginBottom: '20px',
                            padding: '10px', borderRadius: '5px', background: 'rgba(255,77,77,0.1)',
                            border: '1px solid rgba(255,77,77,0.2)'
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{
                        width: '100%', padding: '12px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}>
                        {isRegister ? 'Register' : 'Login'} <LogIn size={18} />
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <span
                        onClick={() => setIsRegister(!isRegister)}
                        style={{ color: '#646cff', cursor: 'pointer', fontWeight: '500' }}
                    >
                        {isRegister ? 'Login' : 'Register'}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Login;
