import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Mic, UserCheck, Settings, Home } from 'lucide-react'

// Pages (will create next)
import Dashboard from './pages/Dashboard'
import StudentList from './pages/StudentList'
import Enroll from './pages/Enroll'
import Verify from './pages/Verify'
import Config from './pages/Config'
import Logs from './pages/Logs'

import './index.css'

function NavBar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#1a1d24', borderTop: '1px solid #333',
      display: 'flex', justifyContent: 'space-around', padding: '15px'
    }}>
      <Link to="/" style={{ color: isActive('/') ? '#646cff' : '#888' }}>
        <Home size={24} />
      </Link>
      <Link to="/enroll" style={{ color: isActive('/enroll') ? '#646cff' : '#888' }}>
        <Mic size={24} />
      </Link>
      <Link to="/verify" style={{ color: isActive('/verify') ? '#646cff' : '#888' }}>
        <UserCheck size={24} />
      </Link>
      <Link to="/settings" style={{ color: isActive('/settings') ? '#646cff' : '#888' }}>
        <Settings size={24} />
      </Link>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ paddingBottom: '80px' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/enroll" element={<Enroll />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/settings" element={<Config />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
        <NavBar />
      </div>
    </BrowserRouter>
  )
}

export default App
