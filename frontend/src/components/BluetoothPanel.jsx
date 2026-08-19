import { useState, useRef } from 'react'
import { formatSize } from '../utils'

/**
 * BluetoothPanel — shows Bluetooth scanning controls and a list of
 * discovered BLE devices.  Also provides a "share via Bluetooth" drop zone
 * that triggers the Web Share API (which can route through Bluetooth on
 * supported mobile platforms).
 */
function BluetoothPanel({ supported, scanning, bluetoothDevices, onStartScan, onStopScan, onShareFile }) {
  const [recentShare, setRecentShare] = useState(null)
  const fileInputRef = useRef(null)

  const handleShareFile = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      const result = await onShareFile(file)
      setRecentShare({ name: file.name, size: file.size, ...result })
      setTimeout(() => setRecentShare(null), 4000)
    }
    e.target.value = ''
  }

  if (!supported) {
    return (
      <section className="bt-section">
        <h2 className="section-label">
          <span className="bt-icon-label">📶</span>
          Bluetooth Sharing
        </h2>
        <div className="bt-unsupported">
          <div className="bt-unsupported-icon">⚠️</div>
          <p>Bluetooth sharing requires a browser with Web Bluetooth or Web Share API support.</p>
          <p className="bt-unsupported-hint">Try Chrome on Android or Desktop.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="bt-section">
      <h2 className="section-label">
        <span className="bt-icon-label">📶</span>
        Bluetooth &amp; Nearby Share
      </h2>

      {/* ── Scan controls ──────────────────── */}
      <div className="bt-controls">
        <button
          className="btn-bt-scan"
          onClick={scanning ? onStopScan : onStartScan}
          disabled={scanning}
        >
          {scanning ? (
            <>
              <span className="bt-spinner" /> Scanning…
            </>
          ) : (
            <>🔍 Scan nearby devices</>
          )}
        </button>
      </div>

      {/* ── Discovered BLE devices ─────────── */}
      {bluetoothDevices.length > 0 && (
        <div className="bt-device-list">
          {bluetoothDevices.map(d => (
            <div key={d.id} className="bt-device-card">
              <div className="bt-device-avatar">
                <span>📶</span>
              </div>
              <div className="bt-device-info">
                <span className="bt-device-name">{d.name}</span>
                <span className="bt-device-type">BLE • Nearby</span>
              </div>
              <span className="bt-proximity-badge">Close</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Share via Bluetooth (Web Share API) ── */}
      <div className="bt-share-zone">
        <p className="bt-share-label">Share a file directly via your device's Bluetooth</p>
        <button
          className="btn-bt-share"
          onClick={() => fileInputRef.current?.click()}
        >
          📤 Choose file to share via Bluetooth
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleShareFile}
        />
        {recentShare && (
          <div className={`bt-share-result ${recentShare.success ? 'success' : 'info'}`}>
            {recentShare.success
              ? <>✅ {recentShare.name} shared ({recentShare.method})</>
              : <>ℹ️ Share cancelled</>
            }
          </div>
        )}
      </div>
    </section>
  )
}

export default BluetoothPanel
