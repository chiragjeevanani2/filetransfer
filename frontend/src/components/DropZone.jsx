import { useState, useRef, useCallback, useEffect } from 'react'
import { formatSize } from '../utils'
import { API_BASE } from '../config'

function DropZone({ onUploadComplete }) {
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState([])
  const inputRef = useRef(null)

  const uploadFiles = useCallback((fileList) => {
    Array.from(fileList).forEach(file => {
      const id = `${file.name}-${Date.now()}-${Math.random()}`

      setUploads(prev => [
        ...prev,
        { id, name: file.name, size: file.size, progress: 0, status: 'uploading' }
      ])

      const formData = new FormData()
      formData.append('files', file)

      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: pct } : u))
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploads(prev => prev.map(u =>
            u.id === id ? { ...u, progress: 100, status: 'done' } : u
          ))
          onUploadComplete()
          setTimeout(() => setUploads(prev => prev.filter(u => u.id !== id)), 3000)
        } else {
          setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error' } : u))
        }
      }

      xhr.onerror = () => {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error' } : u))
      }

      xhr.open('POST', `${API_BASE}/api/upload`)
      xhr.send(formData)
    })
  }, [onUploadComplete])

  // Support Ctrl+V paste of files
  useEffect(() => {
    const onPaste = e => {
      const items = e.clipboardData?.items
      if (!items) return
      const files = Array.from(items)
        .filter(i => i.kind === 'file')
        .map(i => i.getAsFile())
        .filter(Boolean)
      if (files.length) uploadFiles(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [uploadFiles])

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }, [uploadFiles])

  const onDragOver = e => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onInputChange = e => {
    if (e.target.files.length) {
      uploadFiles(e.target.files)
      e.target.value = ''
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>⬆️ Upload</h2>
        <span className="header-hint">or paste with Ctrl+V</span>
      </div>

      <div
        className={`dropzone${dragging ? ' dragging' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <span className="dropzone-icon">📂</span>
        <p className="dropzone-text">Drop files here</p>
        <p className="dropzone-sub">or click to browse</p>
        <input ref={inputRef} type="file" multiple onChange={onInputChange} hidden />
      </div>

      {uploads.length > 0 && (
        <ul className="upload-list">
          {uploads.map(u => (
            <li key={u.id} className={`upload-item status-${u.status}`}>
              <div className="upload-top">
                <span className="upload-name" title={u.name}>{u.name}</span>
                <span className="upload-size">{formatSize(u.size)}</span>
              </div>
              {u.status === 'uploading' && (
                <>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${u.progress}%` }} />
                  </div>
                  <span className="progress-pct">{u.progress}%</span>
                </>
              )}
              {u.status === 'done' && <span className="badge badge-done">✅ Done</span>}
              {u.status === 'error' && <span className="badge badge-error">❌ Failed</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DropZone
