import { useState } from 'react'
import { useFileTransfer } from './hooks/useFileTransfer'
import DeviceName from './components/DeviceName'
import DeviceList from './components/DeviceList'
import TransferItem from './components/TransferItem'
import './App.css'

function App() {
  const [deviceName, setDeviceName] = useState(
    () => localStorage.getItem('localdrop-name') || ''
  )

  const { myId, devices, connected, outgoing, incoming, sendFile } = useFileTransfer(deviceName)

  const saveName = name => {
    localStorage.setItem('localdrop-name', name)
    setDeviceName(name)
  }

  if (!deviceName) return <DeviceName onSave={saveName} />

  const transfers = [...outgoing, ...incoming]

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span>📡</span>
          <h1>LocalDrop</h1>
        </div>
        <div className="header-right">
          <span className="my-name" title="Your device name">{deviceName}</span>
          <button
            className="btn-rename"
            title="Change device name"
            onClick={() => { localStorage.removeItem('localdrop-name'); setDeviceName('') }}
          >
            ✏️
          </button>
          <span className={`status-dot ${connected ? 'online' : 'offline'}`} title={connected ? 'Connected' : 'Reconnecting…'} />
        </div>
      </header>

      <main className="app-main">
        {transfers.length > 0 && (
          <section>
            <h2 className="section-label">Active Transfers</h2>
            <div className="transfer-list">
              {outgoing.map(t => <TransferItem key={t.transferId} transfer={t} direction="out" />)}
              {incoming.map(t => <TransferItem key={t.transferId} transfer={t} direction="in" />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="section-label">
            Devices
            {devices.filter(d => d.id !== myId).length > 0 && (
              <span className="badge-online">
                {devices.filter(d => d.id !== myId).length} online
              </span>
            )}
          </h2>
          <DeviceList devices={devices} myId={myId} onSend={sendFile} />
        </section>
      </main>
    </div>
  )
}

export default App
