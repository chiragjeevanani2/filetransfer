import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

const PORT = process.env.PORT || 3001
const FRONTEND_URL = (process.env.FRONTEND_URL || '').replace(/\/+$/, '') || '*'

const app = express()
app.use(cors({ origin: FRONTEND_URL }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', devices: devices.size })
})

// ── Device registry ─────────────────────────────────────────────
const devices = new Map() // id → { ws, id, name, isAlive }

function broadcastDeviceList() {
  // Purge stale entries whose WebSocket is no longer open
  for (const [id, device] of devices) {
    if (device.ws.readyState !== 1) {
      devices.delete(id)
    }
  }

  const list = Array.from(devices.values()).map(({ id, name }) => ({ id, name }))
  const msg = JSON.stringify({ type: 'devices', list })
  for (const { ws } of devices.values()) {
    if (ws.readyState === 1) ws.send(msg)
  }
}

// ── HTTP + WebSocket server ──────────────────────────────────────
const server = createServer(app)

const wss = new WebSocketServer({
  server,
  // Only allow connections from the frontend origin in production
  verifyClient: ({ origin }) => {
    if (!origin || FRONTEND_URL === '*') return true
    return origin === FRONTEND_URL
  },
})

// Heartbeat — keeps connections alive through Render's idle timeout
const heartbeat = setInterval(() => {
  // Sweep dead connections
  for (const [id, device] of devices) {
    if (device.ws.readyState !== 1) {
      devices.delete(id)
    }
  }

  wss.clients.forEach(ws => {
    if (ws.isAlive === false) { ws.terminate(); return }
    ws.isAlive = false
    ws.ping()
  })

  // Broadcast the cleaned list so all clients stay in sync
  broadcastDeviceList()
}, 25000)

wss.on('close', () => clearInterval(heartbeat))

wss.on('connection', (ws) => {
  const id = crypto.randomUUID()
  const device = { ws, id, name: 'Unknown Device', isAlive: true }
  devices.set(id, device)

  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })

  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      // Binary packet from sender: [transferId(36)][targetId(36)][chunk...]
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
      if (buf.length < 72) return

      const targetId = buf.slice(36, 72).toString()
      const target = devices.get(targetId)

      if (target?.ws.readyState === 1) {
        // Forward to recipient: [transferId(36)][chunk...]
        // (strip the targetId — recipient already knows the transfer from metadata)
        target.ws.send(Buffer.concat([buf.slice(0, 36), buf.slice(72)]))
      }
      return
    }

    let msg
    try { msg = JSON.parse(data.toString()) } catch { return }

    switch (msg.type) {
      case 'register':
        device.name = String(msg.name || 'Unknown Device').trim().slice(0, 32)
        ws.send(JSON.stringify({ type: 'registered', id }))
        broadcastDeviceList()
        break

      case 'transfer-request': {
        const target = devices.get(msg.to)
        if (!target || target.ws.readyState !== 1) {
          ws.send(JSON.stringify({ type: 'error', message: 'Device not available' }))
          return
        }
        target.ws.send(JSON.stringify({
          type: 'transfer-request',
          transferId: msg.transferId,
          from: id,
          fromName: device.name,
          name: msg.name,
          size: msg.size,
          mime: msg.mime,
        }))
        break
      }

      case 'transfer-complete': {
        const target = devices.get(msg.to)
        if (target?.ws.readyState === 1) {
          target.ws.send(JSON.stringify({
            type: 'transfer-complete',
            transferId: msg.transferId,
          }))
        }
        break
      }

      case 'transfer-cancel': {
        const target = devices.get(msg.to)
        if (target?.ws.readyState === 1) {
          target.ws.send(JSON.stringify({
            type: 'transfer-cancel',
            transferId: msg.transferId,
          }))
        }
        break
      }
    }
  })

  ws.on('close', () => { devices.delete(id); broadcastDeviceList() })
  ws.on('error', () => { devices.delete(id); broadcastDeviceList() })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 LocalDrop running on port ${PORT}\n`)
})
