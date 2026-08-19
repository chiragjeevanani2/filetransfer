import { useState } from 'react'

function DeviceName({ onSave }) {
  const [name, setName] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onSave(trimmed)
  }

  return (
    <div className="name-overlay">
      <div className="name-card">
        <div className="name-icon">📡</div>
        <h1>Welcome to LocalDrop</h1>
        <p>Give this device a name so others can find it.</p>
        <form onSubmit={handleSubmit}>
          <input
            className="name-input"
            type="text"
            placeholder="e.g. My iPhone, Work Laptop…"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={32}
            autoFocus
          />
          <button className="btn-primary" type="submit" disabled={!name.trim()}>
            Let's go →
          </button>
        </form>
      </div>
    </div>
  )
}

export default DeviceName
