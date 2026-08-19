import { useRef } from 'react'

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

function DeviceCard({ device, onSend }) {
  const inputRef = useRef(null)

  const handleChange = e => {
    Array.from(e.target.files).forEach(f => onSend(f))
    e.target.value = ''
  }

  return (
    <div
      className="device-card"
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
    >
      <div className="device-avatar">{initials(device.name)}</div>
      <div className="device-info">
        <span className="device-name">{device.name}</span>
        <span className="device-hint">Click to send files</span>
      </div>
      <span className="device-arrow">📤</span>
      <input ref={inputRef} type="file" multiple hidden onChange={handleChange} />
    </div>
  )
}

function DeviceList({ devices, myId, onSend }) {
  const others = devices.filter(d => d.id !== myId)

  if (others.length === 0) {
    return (
      <div className="empty-devices">
        <div className="empty-icon">📡</div>
        <h3>No other devices online</h3>
        <p>Open this app on another device to connect</p>
        <code className="app-url">{window.location.origin}</code>
      </div>
    )
  }

  return (
    <div className="device-list">
      {others.map(d => (
        <DeviceCard key={d.id} device={d} onSend={f => onSend(d.id, d.name, f)} />
      ))}
    </div>
  )
}

export default DeviceList
