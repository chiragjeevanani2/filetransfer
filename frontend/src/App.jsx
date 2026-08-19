import { useState, useEffect, useCallback } from 'react'
import NetworkInfo from './components/NetworkInfo'
import DropZone from './components/DropZone'
import FileList from './components/FileList'
import './App.css'

function App() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [networkInfo, setNetworkInfo] = useState(null)
  // Incrementing this triggers a file-list re-fetch
  const [version, setVersion] = useState(0)

  const refreshFiles = useCallback(() => setVersion(v => v + 1), [])

  // Fetch network info once on mount
  useEffect(() => {
    fetch('/api/info')
      .then(r => r.json())
      .then(info => setNetworkInfo(info))
      .catch(console.error)
  }, [])

  // Re-fetch files whenever version changes
  useEffect(() => {
    let active = true
    fetch('/api/files')
      .then(r => r.json())
      .then(data => {
        if (!active) return
        setFiles(data)
        setLoading(false)
      })
      .catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [version])

  // Auto-refresh every 5 s so uploads from other devices appear
  useEffect(() => {
    const id = setInterval(() => setVersion(v => v + 1), 5000)
    return () => clearInterval(id)
  }, [])

  const handleDelete = async filename => {
    await fetch(`/api/files/${encodeURIComponent(filename)}`, { method: 'DELETE' })
    refreshFiles()
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span>📡</span>
          <h1>LocalDrop</h1>
        </div>
        <div className="header-status">
          <span className="dot" />
          <span>{networkInfo ? networkInfo.ip : 'Connecting…'}</span>
        </div>
      </header>

      <main className="app-main">
        <aside className="left-col">
          <NetworkInfo networkInfo={networkInfo} />
          <DropZone onUploadComplete={refreshFiles} />
        </aside>
        <section className="right-col">
          <FileList
            files={files}
            loading={loading}
            onDelete={handleDelete}
            onRefresh={refreshFiles}
          />
        </section>
      </main>
    </div>
  )
}

export default App
