import { useRef } from 'react'

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

function DeviceCard({ device, onSend, onShareViaBluetooth, isNearby }) {
  const fileInputRef = useRef(null)
  const btInputRef = useRef(null)
  const nearby = isNearby(device.name)

  const handleSend = e => {
    Array.from(e.target.files).forEach(f => onSend(f))
    e.target.value = ''
  }

  const handleBtShare = async e => {
    const files = Array.from(e.target.files)
    for (const f of files) {
      await onShareViaBluetooth(f)
    }
    e.target.value = ''
  }

  return (
    <div className="device-card">
      <div className="device-card-top">
        <div className="device-left" onClick={() => fileInputRef.current?.click()}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <div className="device-avatar">
            {initials(device.name)}
            {nearby && <span className="bt-nearby-dot" title="Nearby via Bluetooth" />}
          </div>
          <div className="device-info">
            <span className="device-name">
              {device.name}
              {nearby && <span className="bt-nearby-tag">📶 Nearby</span>}
            </span>
            <span className="device-hint">Click to send files</span>
          </div>
          <span className="device-arrow">📤</span>
        </div>

        <button
          className="btn-bt-send"
          title="Share via Bluetooth"
          onClick={() => btInputRef.current?.click()}
        >
          📶
        </button>
      </div>
      <input ref={fileInputRef} type="file" multiple hidden onChange={handleSend} />
      <input ref={btInputRef} type="file" multiple hidden onChange={handleBtShare} />
    </div>
  )
}

function DeviceList({ devices, myId, onSend, onShareViaBluetooth, isNearby }) {
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
        <DeviceCard
          key={d.id}
          device={d}
          onSend={f => onSend(d.id, d.name, f)}
          onShareViaBluetooth={onShareViaBluetooth}
          isNearby={isNearby}
        />
      ))}
    </div>
  )
}

export default DeviceList
