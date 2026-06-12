import { useState } from 'react'
import { useGroupStore } from '../store/group'
import QRCode from 'qrcode'

const ONLINE_MS = 2 * 60 * 1000

interface Props {
  groupName: string
  accuracy: number | null
  paused: boolean
  onTogglePaused: () => void
}

export function TopBar({ groupName, accuracy, paused, onTogglePaused }: Props) {
  const { session, members, adminMode, setAdminMode } = useGroupStore()
  const [qrVisible, setQrVisible] = useState(false)
  const [qrUrl, setQrUrl] = useState('')

  const onlineCount = members.filter(
    (m) => Date.now() - new Date(m.last_seen).getTime() < ONLINE_MS,
  ).length

  const accuracyColor =
    accuracy == null
      ? 'text-zinc-600'
      : accuracy < 50
        ? 'text-green-400'
        : accuracy < 150
          ? 'text-yellow-400'
          : 'text-red-400'

  const showQr = async () => {
    if (!session) return
    const url = `${window.location.origin}/join/${session.groupCode}`
    const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2 })
    setQrUrl(dataUrl)
    setQrVisible(true)
  }

  return (
    <>
      <header
        className="flex items-center h-12 px-4 bg-zinc-950 border-b border-zinc-800 shrink-0 gap-3"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <span className="text-white font-semibold truncate flex-1 text-base">{groupName}</span>

        <span className="text-zinc-500 text-xs whitespace-nowrap">{onlineCount} online</span>

        <span className={`text-xs font-medium ${accuracyColor}`}>
          {accuracy ? `±${Math.round(accuracy)}m` : '—'}
        </span>

        <button
          onClick={onTogglePaused}
          title={paused ? 'Resume location sharing' : 'Pause location sharing'}
          className="text-xl w-8 h-8 flex items-center justify-center"
        >
          {paused ? '⏸' : '📡'}
        </button>

        {session?.isAdmin && (
          <button
            onClick={() => setAdminMode(!adminMode)}
            title={adminMode ? 'Admin-Modus deaktivieren' : 'Admin-Modus aktivieren'}
            className={`text-lg w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${adminMode ? 'bg-red-900/70 text-red-300' : 'text-zinc-400'}`}
          >
            🛡
          </button>
        )}

        <button onClick={showQr} className="text-xl w-8 h-8 flex items-center justify-center" title="Share group link">
          🔗
        </button>
      </header>

      {qrVisible && (
        <div
          className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center gap-4 px-6"
          onClick={() => setQrVisible(false)}
        >
          <div className="bg-white rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
            {qrUrl && <img src={qrUrl} alt="Join QR code" className="w-56 h-56" />}
          </div>
          <p className="text-white text-center text-sm font-medium">Scan to join the group</p>
          <button
            className="h-12 px-6 rounded-xl bg-zinc-800 text-white text-sm font-medium"
            onClick={() => {
              navigator.clipboard?.writeText(`${window.location.origin}/join/${session?.groupCode}`)
            }}
          >
            📋 Copy link
          </button>
          <button className="text-zinc-500 text-sm" onClick={() => setQrVisible(false)}>
            Close
          </button>
        </div>
      )}
    </>
  )
}
