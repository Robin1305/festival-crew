import { useState } from 'react'
import { useGroupStore } from '../store/group'
import QRCode from 'qrcode'

interface Props {
  groupName: string
  dropping: boolean
  onToggleDrop: () => void
  accuracy: number | null
  paused: boolean
  onTogglePaused: () => void
}

export function TopBar({ groupName, dropping, onToggleDrop, accuracy, paused, onTogglePaused }: Props) {
  const { session, members } = useGroupStore()
  const [qrVisible, setQrVisible] = useState(false)
  const [qrUrl, setQrUrl] = useState('')

  const onlineCount = members.length

  const showQr = async () => {
    if (!session) return
    const url = `${window.location.origin}/join/${session.groupCode}`
    const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2 })
    setQrUrl(dataUrl)
    setQrVisible(true)
  }

  const accuracyColor =
    accuracy == null ? 'text-zinc-600' : accuracy < 50 ? 'text-green-400' : accuracy < 150 ? 'text-yellow-400' : 'text-red-400'

  return (
    <>
      <header className="flex items-center h-12 px-4 bg-zinc-950/90 border-b border-zinc-800 shrink-0 gap-2">
        <span className="text-white font-semibold truncate flex-1">{groupName}</span>
        <span className="text-zinc-500 text-xs">{onlineCount} online</span>

        {/* GPS accuracy indicator */}
        <span className={`text-xs ${accuracyColor}`} title="GPS accuracy">
          {accuracy ? `±${Math.round(accuracy)}m` : '—'}
        </span>

        {/* Battery saver toggle */}
        <button
          onClick={onTogglePaused}
          title={paused ? 'Resume location sharing' : 'Pause location sharing'}
          className="text-lg"
        >
          {paused ? '⏸' : '📡'}
        </button>

        {/* Meet-me pin drop toggle */}
        <button
          onClick={onToggleDrop}
          title="Drop a meet-me pin"
          className={`text-lg ${dropping ? 'text-yellow-400' : 'text-zinc-400'}`}
        >
          📍
        </button>

        {/* Share QR */}
        <button onClick={showQr} className="text-zinc-400 text-lg" title="Share group link">
          🔗
        </button>
      </header>

      {dropping && (
        <div className="bg-yellow-900/80 text-yellow-300 text-xs text-center py-1 shrink-0 px-4">
          Tap anywhere on the map to drop a meet-me pin
        </div>
      )}

      {qrVisible && (
        <div
          className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center gap-4 px-6"
          onClick={() => setQrVisible(false)}
        >
          <div className="bg-white rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
            {qrUrl && <img src={qrUrl} alt="Join QR code" className="w-48 h-48" />}
          </div>
          <p className="text-white text-center text-sm">
            Share this QR code to invite friends
          </p>
          <button
            className="text-sm text-zinc-400"
            onClick={() => {
              navigator.clipboard?.writeText(`${window.location.origin}/join/${session?.groupCode}`)
            }}
          >
            📋 Copy link
          </button>
          <button className="text-zinc-500 text-sm mt-2" onClick={() => setQrVisible(false)}>
            Close
          </button>
        </div>
      )}
    </>
  )
}
