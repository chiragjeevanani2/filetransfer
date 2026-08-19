import { useState, useEffect, useRef, useCallback } from 'react'
import { WS_URL } from '../config'

const CHUNK_SIZE = 256 * 1024 // 256 KB per chunk

export function useFileTransfer(deviceName) {
  const [myId, setMyId]         = useState(null)
  const [devices, setDevices]   = useState([])
  const [connected, setConnected] = useState(false)
  const [outgoing, setOutgoing] = useState([]) // active sends
  const [incoming, setIncoming] = useState([]) // active receives

  const wsRef       = useRef(null)
  const myIdRef     = useRef(null)   // mirrors myId for use inside closures
  const receivingRef = useRef({}) // transferId → { meta, chunks, received }

  useEffect(() => {
    if (!deviceName) return

    let socket
    let retryTimer

    function connect() {
      socket = new WebSocket(WS_URL)
      socket.binaryType = 'arraybuffer'
      wsRef.current = socket

      socket.onopen = () => {
        setConnected(true)
        socket.send(JSON.stringify({ type: 'register', name: deviceName }))
      }

      socket.onclose = () => {
        setConnected(false)
        myIdRef.current = null
        setMyId(null)
        setDevices([])
        retryTimer = setTimeout(connect, 3000) // auto-reconnect
      }

      socket.onerror = () => setConnected(false)

      socket.onmessage = ({ data }) => {
        if (typeof data === 'string') {
          handleJson(JSON.parse(data))
        } else {
          handleBinary(data)
        }
      }
    }

    function handleJson(msg) {
      switch (msg.type) {
        case 'registered':
          myIdRef.current = msg.id
          setMyId(msg.id)
          break

        case 'devices': {
          const currentId = myIdRef.current
          setDevices(msg.list.filter(d => d.id !== currentId))
          break
        }

        case 'transfer-request':
          // New incoming file
          receivingRef.current[msg.transferId] = {
            meta: msg,
            chunks: [],
            received: 0,
          }
          setIncoming(prev => [...prev, {
            transferId: msg.transferId,
            fromName: msg.fromName,
            fileName: msg.name,
            size: msg.size,
            progress: 0,
            status: 'receiving',
          }])
          break

        case 'transfer-complete': {
          const t = receivingRef.current[msg.transferId]
          if (!t) break

          // Assemble and trigger browser download
          const blob = new Blob(t.chunks, { type: t.meta.mime || 'application/octet-stream' })
          const url  = URL.createObjectURL(blob)
          const a    = Object.assign(document.createElement('a'), { href: url, download: t.meta.name })
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          setTimeout(() => URL.revokeObjectURL(url), 5000)

          delete receivingRef.current[msg.transferId]
          setIncoming(prev => prev.map(i =>
            i.transferId === msg.transferId ? { ...i, progress: 100, status: 'done' } : i
          ))
          setTimeout(() => {
            setIncoming(prev => prev.filter(i => i.transferId !== msg.transferId))
          }, 3000)
          break
        }

        case 'transfer-cancel':
          delete receivingRef.current[msg.transferId]
          setIncoming(prev => prev.filter(i => i.transferId !== msg.transferId))
          break

        case 'error':
          console.error('[LocalDrop] server error:', msg.message)
          break
      }
    }

    function handleBinary(data) {
      // Received packet: [transferId(36 bytes)][chunk data...]
      const view       = new Uint8Array(data)
      if (view.length < 36) return
      const transferId = new TextDecoder().decode(view.slice(0, 36))
      const chunk      = view.slice(36)

      const t = receivingRef.current[transferId]
      if (!t) return

      t.chunks.push(new Uint8Array(chunk))
      t.received += chunk.length

      const progress = Math.min(99, Math.round((t.received / t.meta.size) * 100))
      setIncoming(prev => prev.map(i =>
        i.transferId === transferId ? { ...i, progress } : i
      ))
    }

    connect()
    return () => {
      clearTimeout(retryTimer)
      socket?.close()
    }
  }, [deviceName])

  const sendFile = useCallback(async (targetId, targetName, file) => {
    const socket = wsRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return

    const transferId       = crypto.randomUUID()
    const transferIdBytes  = new TextEncoder().encode(transferId) // 36 bytes
    const targetIdBytes    = new TextEncoder().encode(targetId)   // 36 bytes

    setOutgoing(prev => [...prev, {
      transferId,
      toName: targetName,
      fileName: file.name,
      size: file.size,
      progress: 0,
      status: 'sending',
    }])

    // 1. Send file metadata
    socket.send(JSON.stringify({
      type: 'transfer-request',
      to: targetId,
      transferId,
      name: file.name,
      size: file.size,
      mime: file.type || 'application/octet-stream',
    }))

    // 2. Stream chunks
    let offset = 0
    try {
      while (offset < file.size) {
        // Back-pressure: wait if the socket buffer is getting full
        while (socket.bufferedAmount > CHUNK_SIZE * 4) {
          await new Promise(r => setTimeout(r, 30))
        }

        const end      = Math.min(offset + CHUNK_SIZE, file.size)
        const slice    = await file.slice(offset, end).arrayBuffer()

        // Packet: [transferId(36)][targetId(36)][file data]
        const packet = new Uint8Array(72 + slice.byteLength)
        packet.set(transferIdBytes, 0)
        packet.set(targetIdBytes, 36)
        packet.set(new Uint8Array(slice), 72)
        socket.send(packet.buffer)

        offset = end
        setOutgoing(prev => prev.map(o =>
          o.transferId === transferId
            ? { ...o, progress: Math.min(99, Math.round((offset / file.size) * 100)) }
            : o
        ))

        await new Promise(r => setTimeout(r, 0)) // yield to event loop
      }

      // 3. Signal completion
      socket.send(JSON.stringify({ type: 'transfer-complete', to: targetId, transferId }))
      setOutgoing(prev => prev.map(o =>
        o.transferId === transferId ? { ...o, progress: 100, status: 'done' } : o
      ))
    } catch {
      setOutgoing(prev => prev.map(o =>
        o.transferId === transferId ? { ...o, status: 'error' } : o
      ))
    }

    setTimeout(() => {
      setOutgoing(prev => prev.filter(o => o.transferId !== transferId))
    }, 3000)
  }, [])

  return { myId, devices, connected, outgoing, incoming, sendFile }
}
