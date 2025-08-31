import React, { useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export default function AVTools() {
  const [videos, setVideos] = useState([])
  const [audios, setAudios] = useState([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const videoInputRef = useRef(null)
  const audioInputRef = useRef(null)

  const onFilesChosen = (setter) => (files) => {
    setter(prev => [...prev, ...Array.from(files)])
  }

  const handleDrop = (setter) => (e) => {
    e.preventDefault()
    onFilesChosen(setter)(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const clearAll = () => {
    setVideos([])
    setAudios([])
  }

  const startMerge = async () => {
    if (!videos.length || !audios.length) {
      setStatus('Please upload both videos and audios.')
      return
    }
    if (videos.length !== audios.length) {
      setStatus('Number of videos and audios must match.')
      return
    }

    setBusy(true)
    setStatus('Processing…')

    try {
      const fd = new FormData()
      videos.forEach(v => fd.append('videos', v))
      audios.forEach(a => fd.append('audios', a))

      const res = await fetch(`${API_BASE}/api/replace-audio`, {
        method: 'POST',
        body: fd
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Server error (${res.status})`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `merged_videos.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setStatus('Done! Download started.')
    } catch (e) {
      setStatus(e.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rename-page">
      <div
        className="dropzone"
        onDrop={handleDrop(setVideos)}
        onDragOver={handleDragOver}
        onClick={() => videoInputRef.current?.click()}
      >
        <p>Drop Video Files (mp4)</p>
        <input
          ref={videoInputRef}
          type="file"
          multiple
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => onFilesChosen(setVideos)(e.target.files)}
        />
      </div>

      <div
        className="dropzone"
        onDrop={handleDrop(setAudios)}
        onDragOver={handleDragOver}
        onClick={() => audioInputRef.current?.click()}
      >
        <p>Drop Audio Files (mp3, wav)</p>
        <input
          ref={audioInputRef}
          type="file"
          multiple
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={(e) => onFilesChosen(setAudios)(e.target.files)}
        />
      </div>

      {(videos.length > 0 || audios.length > 0) && (
        <div className="file-list">
          <p><strong>{videos.length}</strong> videos, <strong>{audios.length}</strong> audios</p>
          <button className="btn small" onClick={clearAll}>Clear</button>
        </div>
      )}

      <button className="btn primary" disabled={busy} onClick={startMerge}>
        {busy ? 'Working…' : 'Start Merge'}
      </button>

      {status && <div className="status">{status}</div>}
    </div>
  )
}
