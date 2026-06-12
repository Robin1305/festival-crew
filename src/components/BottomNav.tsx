import { useGroupStore } from '../store/group'

export function BottomNav() {
  const { activeSheet, unreadPosts, setActiveSheet } = useGroupStore()

  const tabs = [
    { id: 'none' as const, icon: '🗺', label: 'Map' },
    { id: 'friends' as const, icon: '👥', label: 'Friends' },
    { id: 'bulletin' as const, icon: '📋', label: 'Board', badge: unreadPosts },
    { id: 'sos' as const, icon: '🆘', label: 'SOS', red: true },
  ]

  return (
    <nav className="flex h-16 bg-zinc-950 border-t border-zinc-800 shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveSheet(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative
            ${tab.red ? 'bg-red-950 active:bg-red-900' : 'active:bg-zinc-800'}
            ${activeSheet === tab.id && !tab.red ? 'text-rose-400' : tab.red ? 'text-red-400' : 'text-zinc-400'}
            transition-colors`}
        >
          <span className="text-xl relative">
            {tab.icon}
            {tab.badge != null && tab.badge > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
