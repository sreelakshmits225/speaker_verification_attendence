import axios from 'axios';

// Get stored URL or default to localhost
const getBaseUrl = () => {
    return localStorage.getItem('api_url') || 'http://localhost:8000';
};

export const api = axios.create({
    baseURL: getBaseUrl(),
    timeout: 120000, // Increased to 120s for processing overhead
});

// Interceptor to update URL dynamically if changed
api.interceptors.request.use((config) => {
    config.baseURL = getBaseUrl();
    return config;
});

export const saveApiUrl = (url) => {
    // Remove trailing slash
    const cleanUrl = url.replace(/\/$/, "");
    localStorage.setItem('api_url', cleanUrl);
    window.location.reload(); // Reload to apply changes
};
