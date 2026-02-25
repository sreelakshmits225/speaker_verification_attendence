import { useState } from 'react'
import { api, saveApiUrl } from '../api'

function Config() {
    const [url, setUrl] = useState(api.defaults.baseURL);
    const [status, setStatus] = useState(null);

    const testConnection = async () => {
        try {
            await api.get('/');
            setStatus('success');
        } catch (e) {
            setStatus('error');
        }
    };

    const handleSave = () => {
        saveApiUrl(url);
    };

    return (
        <div className="animate-fade-in">
            <h1>⚙️ Settings</h1>

            <div className="glass-card">
                <h3>Backend Server URL</h3>
                <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '15px' }}>
                    Enter your PC's IP address (e.g., http://192.168.1.5:8000).
                </p>

                <input
                    className="glass-input"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="http://192.168.x.x:8000"
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={testConnection}>
                        Test Connection
                    </button>
                    <button className="btn-primary" onClick={handleSave}>
                        Save & Reload
                    </button>
                </div>

                {status === 'success' && <p style={{ color: '#4caf50', marginTop: '10px' }}>✅ Connection Successful!</p>}
                {status === 'error' && <p style={{ color: '#ff5252', marginTop: '10px' }}>❌ Connection Failed</p>}
            </div>

            <div className="glass-card">
                <h3>About</h3>
                <p>Voice Attendance PWA v1.0</p>
            </div>
        </div>
    )
}

export default Config
