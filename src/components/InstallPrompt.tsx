import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'fc-install-dismissed'

function isAlreadyInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !isAlreadyInstalled()
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null)
  const [showIOS, setShowIOS] = useState(false)

  const dismissed = !!localStorage.getItem(DISMISSED_KEY) || isAlreadyInstalled()

  useEffect(() => {
    if (dismissed) return

    if (isIOS()) {
      // Small delay so the login flow feels complete before the prompt appears
      const t = setTimeout(() => setShowIOS(true), 2000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setTimeout(() => setDeferredPrompt(e as unknown as typeof deferredPrompt), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [dismissed])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDeferredPrompt(null)
    setShowIOS(false)
  }

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') dismiss()
    else setDeferredPrompt(null)
  }

  if (dismissed || (!deferredPrompt && !showIOS)) return null

  if (showIOS) {
    return (
      <div className="absolute bottom-20 left-4 right-4 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 mt-0.5">📱</span>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm mb-1">Als App speichern</p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Tippe auf <strong className="text-white">Teilen</strong> <span className="text-zinc-300">⬆</span> → <strong className="text-white">„Zum Home-Bildschirm"</strong> für den schnellen Zugriff als App.
            </p>
          </div>
          <button onClick={dismiss} className="text-zinc-500 text-2xl leading-none shrink-0 w-8 h-8 flex items-center justify-center">
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute bottom-20 left-4 right-4 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl">
      <div className="flex items-center gap-3">
        <span className="text-2xl shrink-0">📱</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Als App installieren</p>
          <p className="text-zinc-400 text-xs">Direkt vom Homescreen starten</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={dismiss}
            className="h-9 px-3 rounded-xl bg-zinc-800 text-zinc-300 text-sm active:bg-zinc-700"
          >
            Später
          </button>
          <button
            onClick={install}
            className="h-9 px-4 rounded-xl bg-rose-600 text-white text-sm font-semibold active:bg-rose-500"
          >
            Installieren
          </button>
        </div>
      </div>
    </div>
  )
}
