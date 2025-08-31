import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Rename from './pages/Rename.jsx'
import AVTools from './pages/AVTools.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <NavLink to="/" className="brand">File Tools</NavLink>
        <nav className="nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/rename">Upload & Rename</NavLink>
          <NavLink to="/av-tools">Video/Audio Modifier</NavLink>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rename" element={<Rename />} />
          <Route path="/av-tools" element={<AVTools />} />
        </Routes>
      </main>
    </div>
  )
}
