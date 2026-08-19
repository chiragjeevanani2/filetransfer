export function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const map = {
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️', bmp: '🖼️', ico: '🖼️',
    mp4: '🎬', avi: '🎬', mov: '🎬', mkv: '🎬', webm: '🎬', flv: '🎬', wmv: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', ogg: '🎵', aac: '🎵', m4a: '🎵',
    pdf: '📄', doc: '📄', docx: '📄', txt: '📄', rtf: '📄', md: '📄',
    xls: '📊', xlsx: '📊', csv: '📊',
    ppt: '📊', pptx: '📊',
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
    js: '💻', ts: '💻', jsx: '💻', tsx: '💻', py: '💻',
    html: '💻', css: '💻', json: '💻', xml: '💻', sh: '💻', bat: '💻',
    apk: '📱', ipa: '📱',
    exe: '⚙️', msi: '⚙️', dmg: '⚙️',
  }
  return map[ext] || '📁'
}

export function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function formatDate(dateStr) {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return date.toLocaleDateString()
}
