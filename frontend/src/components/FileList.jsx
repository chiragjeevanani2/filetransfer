import { useState } from 'react'
import { getFileIcon, formatSize, formatDate } from '../utils'
import { API_BASE } from '../config'

function FileList({ files, loading, onDelete, onRefresh }) {
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDownload = filename => {
    const a = document.createElement('a')
    a.href = `${API_BASE}/api/download/${encodeURIComponent(filename)}`
    a.download = filename
    a.click()
  }

  const handleDelete = async filename => {
    if (pendingDelete === filename) {
      await onDelete(filename)
      setPendingDelete(null)
    } else {
      setPendingDelete(filename)
      setTimeout(() => setPendingDelete(null), 3000)
    }
  }

  return (
    <div className="card file-card">
      <div className="card-header">
        <h2>
          📁 Files
          <span className="count-badge">{files.length}</span>
        </h2>
        <button className="btn-icon" onClick={onRefresh} title="Refresh">
          🔄
        </button>
      </div>

      {files.length > 4 && (
        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Search files…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="state-box">
          <span className="spinner" />
          <p>Loading files…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="state-box">
          <span className="state-icon">📭</span>
          <p>{search ? 'No files match your search.' : 'No files yet — drop something above!'}</p>
        </div>
      ) : (
        <ul className="file-items">
          {filtered.map(file => (
            <li key={file.name} className="file-item">
              <span className="file-type-icon">{getFileIcon(file.name)}</span>
              <div className="file-info">
                <span className="file-name" title={file.name}>{file.name}</span>
                <span className="file-meta">
                  {formatSize(file.size)} &middot; {formatDate(file.modified)}
                </span>
              </div>
              <div className="file-actions">
                <button
                  className="btn btn-dl"
                  title="Download"
                  onClick={() => handleDownload(file.name)}
                >
                  ⬇️
                </button>
                <button
                  className={`btn btn-del${pendingDelete === file.name ? ' warn' : ''}`}
                  title={pendingDelete === file.name ? 'Click again to confirm delete' : 'Delete'}
                  onClick={() => handleDelete(file.name)}
                >
                  {pendingDelete === file.name ? '⚠️' : '🗑️'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FileList
