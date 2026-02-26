import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { Mic, UserCheck, Settings, Home, LogOut, Users } from 'lucide-react'

// Pages
import Dashboard from './pages/Dashboard'
import StudentList from './pages/StudentList'
import Enroll from './pages/Enroll'
import Verify from './pages/Verify'
import Config from './pages/Config'
import Logs from './pages/Logs'
import Login from './pages/Login'

import './index.css'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function NavBar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (!localStorage.getItem('token')) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#1a1d24', borderTop: '1px solid #333',
      display: 'flex', justifyContent: 'space-around', padding: '15px',
      zIndex: 1000
    }}>
      <Link to="/" style={{ color: isActive('/') ? '#646cff' : '#888' }}>
        <Home size={24} />
      </Link>

      {role === 'STUDENT' ? (
        <>
          <Link to="/enroll" style={{ color: isActive('/enroll') ? '#646cff' : '#888' }}>
            <Mic size={24} />
          </Link>
          <Link to="/verify" style={{ color: isActive('/verify') ? '#646cff' : '#888' }}>
            <UserCheck size={24} />
          </Link>
        </>
      ) : (
        <>
          <Link to="/students" style={{ color: isActive('/students') ? '#646cff' : '#888' }}>
            <Users size={24} />
          </Link>
          <Link to="/logs" style={{ color: isActive('/logs') ? '#646cff' : '#888' }}>
            <UserCheck size={24} />
          </Link>
          <Link to="/settings" style={{ color: isActive('/settings') ? '#646cff' : '#888' }}>
            <Settings size={24} />
          </Link>
        </>
      )}

      <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
        <LogOut size={24} />
      </button>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ paddingBottom: '80px', minHeight: '100vh', background: '#0f1115', color: '#fff' }}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
          <Route path="/enroll" element={<ProtectedRoute><Enroll /></ProtectedRoute>} />
          <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Config /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
        </Routes>
        <NavBar />
      </div>
    </BrowserRouter>
  )
}

export default App
