import { formatSize } from '../utils'

function TransferItem({ transfer, direction }) {
  const isOut  = direction === 'out'
  const icon   = isOut ? '📤' : '📥'
  const peer   = isOut ? `→ ${transfer.toName}` : `← ${transfer.fromName}`
  const isDone = transfer.status === 'done'
  const isErr  = transfer.status === 'error'

  return (
    <div className={`transfer-item${isDone ? ' done' : ''}${isErr ? ' error' : ''}`}>
      <div className="transfer-row">
        <span className="transfer-icon">{icon}</span>
        <div className="transfer-meta">
          <span className="transfer-name" title={transfer.fileName}>{transfer.fileName}</span>
          <span className="transfer-sub">{peer} · {formatSize(transfer.size)}</span>
        </div>
        <span className="transfer-pct">
          {isDone ? '✅' : isErr ? '❌' : `${transfer.progress}%`}
        </span>
      </div>
      {!isDone && !isErr && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${transfer.progress}%` }} />
        </div>
      )}
    </div>
  )
}

export default TransferItem
