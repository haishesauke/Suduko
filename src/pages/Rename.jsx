import React, { useCallback, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export default function Rename() {
  const [files, setFiles] = useState([])
  const [baseName, setBaseName] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const inputRef = useRef(null)

  const onFilesChosen = useCallback((fileList) => {
    const arr = Array.from(fileList || [])
    setFiles(prev => [...prev, ...arr])
  }, [])

  const handleFileInput = (e) => onFilesChosen(e.target.files)

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onFilesChosen(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const clearFiles = () => setFiles([])

  const startRename = async () => {
    if (!files.length) {
      setStatus('Please add some files first.')
      return
    }
    if (!baseName.trim()) {
      setStatus('Please enter a base name (e.g., "sudo" or "sudo1").')
      return
    }

    setBusy(true)
    setStatus('Renaming…')

    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      fd.append('baseName', baseName)
      fd.append('keepExtension', 'true') // change to 'false' if you want no extensions

      const res = await fetch(`${API_BASE}/api/rename`, {
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
      a.download = `${baseName.replace(/\s+/g, '_')}_renamed.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setStatus('Done! Your download should start automatically.')
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
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <p>Drag & drop files here, or click to choose</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <div className="list-head">
            <strong>{files.length}</strong> file(s) selected
            <button className="btn small" onClick={clearFiles}>Clear</button>
          </div>
          <ul>
            {files.map((f, idx) => (
              <li key={`${f.name}-${idx}`}>{f.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="controls">
        <label>
          Base name for sequential rename:
          <input
            type="text"
            placeholder='e.g., "sudo" or "sudo1"'
            value={baseName}
            onChange={(e) => setBaseName(e.target.value)}
          />
        </label>

        <button className="btn primary" onClick={startRename} disabled={busy}>
          {busy ? 'Working…' : 'Start'}
        </button>

        {status && <div className="status">{status}</div>}
      </div>
    </div>
  )
}
