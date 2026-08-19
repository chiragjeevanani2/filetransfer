import { useState } from 'react'
import QRCode from 'react-qr-code'

function NetworkInfo({ networkInfo }) {
  const [showQR, setShowQR] = useState(true)

  // Use the network IP + current port so the QR points to the correct address
  // whether running in dev (5173) or production (3001)
  const port = window.location.port || '80'
  const appUrl = networkInfo
    ? `http://${networkInfo.ip}:${port}`
    : window.location.origin

  return (
    <div className="card network-card">
      <div className="card-header">
        <h2>📡 Connect</h2>
        <button
          className="btn-icon"
          onClick={() => setShowQR(v => !v)}
          title={showQR ? 'Hide QR code' : 'Show QR code'}
        >
          {showQR ? '▲' : '▼'}
        </button>
      </div>

      <div className="network-url">
        <span className="url-label">Network address</span>
        {networkInfo ? (
          <a className="url-value" href={appUrl} target="_blank" rel="noreferrer">
            {appUrl}
          </a>
        ) : (
          <span className="url-value muted">Detecting…</span>
        )}
      </div>

      {showQR && networkInfo && (
        <div className="qr-container">
          <div className="qr-wrapper">
            <QRCode value={appUrl} size={160} />
          </div>
          <p className="qr-hint">
            Scan from any device on the same Wi-Fi
          </p>
        </div>
      )}
    </div>
  )
}

export default NetworkInfo
