import { useState } from 'react'
import { getDeferredPrompt, clearDeferredPrompt, isAlreadyInstalled, isIOSSafari } from '../lib/installPrompt'

const DISMISSED_KEY = 'fc-install-dismissed'

export function InstallPrompt() {
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem(DISMISSED_KEY) || isAlreadyInstalled(),
  )
  const [installing, setInstalling] = useState(false)

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  const install = async () => {
    const prompt = getDeferredPrompt()
    if (!prompt) return
    setInstalling(true)
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    clearDeferredPrompt()
    if (outcome === 'accepted') dismiss()
    else setInstalling(false)
  }

  if (dismissed) return null

  const hasNativePrompt = !!getDeferredPrompt()
  const showIOS = isIOSSafari()

  // Nothing to show if neither iOS nor Android Chrome installable
  if (!hasNativePrompt && !showIOS) return null

  if (showIOS) {
    return (
      <div className="w-full max-w-sm bg-zinc-800/80 border border-zinc-700 rounded-2xl px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">📱</span>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm mb-0.5">Als App installieren</p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Tippe auf <strong className="text-zinc-200">Teilen</strong> <span className="text-zinc-300">⬆</span> → <strong className="text-zinc-200">„Zum Home-Bildschirm"</strong> — dann kannst du die App direkt starten.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="text-zinc-500 text-xl leading-none w-7 h-7 flex items-center justify-center shrink-0"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm bg-zinc-800/80 border border-zinc-700 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">📱</span>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Als App installieren</p>
          <p className="text-zinc-400 text-xs">Direkt vom Homescreen starten</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={dismiss}
            className="h-8 px-3 rounded-lg bg-zinc-700 text-zinc-300 text-xs active:bg-zinc-600"
          >
            Später
          </button>
          <button
            onClick={install}
            disabled={installing}
            className="h-8 px-3 rounded-lg bg-rose-600 text-white text-xs font-semibold active:bg-rose-500 disabled:opacity-50"
          >
            Installieren
          </button>
        </div>
      </div>
    </div>
  )
}
