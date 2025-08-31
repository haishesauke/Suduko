import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div className="grid">
      <div className="card" onClick={() => navigate('/rename')} role="button" tabIndex={0}>
        <h2>Upload & Rename</h2>
        <p>Drag & drop or pick files, enter a base name, and download the renamed folder.</p>
      </div>

      <div className="card" onClick={() => navigate('/av-tools')} role="button" tabIndex={0}>
        <h2>Video/Audio Modifier</h2>
        <p>Convert, trim, merge, and more. (Placeholder page — wire your logic here.)</p>
      </div>
    </div>
  )
}
