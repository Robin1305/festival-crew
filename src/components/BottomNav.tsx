import { useGroupStore } from '../store/group'

export function BottomNav() {
  const { activeSheet, unreadPosts, pins, tents, cars, session, setActiveSheet } = useGroupStore()

  const myPin = session ? pins.find((p) => p.created_by === session.memberId) : null
  const pinActive = !!myPin && new Date(myPin.expires_at).getTime() > Date.now()
  const spotsActive = !!session && (
    tents.some((t) => t.member_id === session.memberId) ||
    cars.some((c) => c.member_id === session.memberId)
  )

  const tabs = [
    { id: 'friends' as const, icon: '👥', label: 'Friends' },
    { id: 'bulletin' as const, icon: '💬', label: 'Messages', badge: unreadPosts },
    { id: 'pin' as const, icon: '📍', label: 'Pin', active: pinActive },
    { id: 'spots' as const, icon: '⛺', label: 'Orte', active: spotsActive },
  ]

  return (
    <nav
      className="flex bg-zinc-950 border-t border-zinc-800 shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveSheet(activeSheet === tab.id ? 'none' : tab.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 relative active:bg-zinc-800 transition-colors
            ${activeSheet === tab.id ? 'text-rose-400' : tab.active ? 'text-amber-400' : 'text-zinc-400'}`}
        >
          <span className="text-2xl relative">
            {tab.icon}
            {tab.badge != null && tab.badge > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
            {tab.active && (tab.id === 'pin' || tab.id === 'spots') && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-zinc-950" />
            )}
          </span>
          <span className="text-[11px] font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
