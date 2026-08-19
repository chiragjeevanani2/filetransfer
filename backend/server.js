import express from 'express'
import multer from 'multer'
import cors from 'cors'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 3001
const UPLOADS_DIR = path.join(__dirname, 'uploads')
const isProd = process.env.NODE_ENV === 'production'

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

function getLocalIP() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    // Fix encoding issues with non-ASCII filenames on Windows
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    const ext = path.extname(originalName)
    const base = path.basename(originalName, ext)
    let finalName = originalName
    let counter = 1
    while (fs.existsSync(path.join(UPLOADS_DIR, finalName))) {
      finalName = `${base} (${counter})${ext}`
      counter++
    }
    cb(null, finalName)
  }
})

const upload = multer({ storage })

const app = express()
app.use(cors())
app.use(express.json())

if (isProd) {
  const distPath = path.join(__dirname, '..', 'frontend', 'dist')
  app.use(express.static(distPath))
}

// GET /api/info — returns network IP
app.get('/api/info', (req, res) => {
  const ip = getLocalIP()
  res.json({ ip })
})

// GET /api/files — list all uploaded files
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR)
      .filter(name => !name.startsWith('.'))
      .map(name => {
        const filePath = path.join(UPLOADS_DIR, name)
        const stat = fs.statSync(filePath)
        return { name, size: stat.size, modified: stat.mtime }
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified))
    res.json(files)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/upload — upload one or more files
app.post('/api/upload', upload.array('files', 50), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' })
  }
  res.json({ uploaded: req.files.map(f => ({ name: f.filename, size: f.size })) })
})

// GET /api/download/:filename — download a file
app.get('/api/download/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename)
  const filepath = path.join(UPLOADS_DIR, filename)
  if (!filepath.startsWith(UPLOADS_DIR)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  res.download(filepath, filename)
})

// DELETE /api/files/:filename — delete a file
app.delete('/api/files/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename)
  const filepath = path.join(UPLOADS_DIR, filename)
  if (!filepath.startsWith(UPLOADS_DIR)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  fs.unlinkSync(filepath)
  res.json({ deleted: filename })
})

// Production fallback — serve React app
if (isProd) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP()
  console.log('\n🚀 LocalDrop API server running!')
  console.log(`   Local:   http://localhost:${PORT}`)
  console.log(`   Network: http://${ip}:${PORT}`)
  if (!isProd) {
    console.log(`\n💡 Open the app at http://${ip}:5173`)
    console.log(`   Scan the QR code in the app to connect from any device\n`)
  }
})
