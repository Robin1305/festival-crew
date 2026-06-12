// Capture beforeinstallprompt before React mounts — otherwise it's often missed.
// Components read from here instead of adding their own listener.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e as BeforeInstallPromptEvent
})

export function getDeferredPrompt() {
  return deferredPrompt
}

export function clearDeferredPrompt() {
  deferredPrompt = null
}

export function isAlreadyInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

export function isIOSSafari() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !isAlreadyInstalled()
}
