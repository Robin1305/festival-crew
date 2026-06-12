import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useGroupStore, saveSession } from '../../store/group'
import { colorFromName } from '../../lib/group-code'

const ONLINE_MS = 2 * 60 * 1000

function lastSeenLabel(dateStr: string): string {
  const min = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

export function FriendsSheet() {
  const { activeSheet, members, session, tents, cars, setActiveSheet, setSession, flyTo, adminMode, removeMember, removeTent, removeCar } = useGroupStore()
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [adminTarget, setAdminTarget] = useState<string | null>(null)

  useEffect(() => {
    if (!adminMode) setAdminTarget(null)
  }, [adminMode])

  const kickMember = async (memberId: string) => {
    await supabase.from('meet_pins').delete().eq('created_by', memberId)
    await supabase.from('members').delete().eq('id', memberId)
    removeMember(memberId)
    setAdminTarget(null)
  }

  const deleteMemberTent = async (memberId: string) => {
    const tent = tents.find((t) => t.member_id === memberId)
    if (!tent) return
    await supabase.from('tents').delete().eq('member_id', memberId)
    removeTent(tent.id)
  }

  const deleteMemberCar = async (memberId: string) => {
    const car = cars.find((c) => c.member_id === memberId)
    if (!car) return
    await supabase.from('cars').delete().eq('member_id', memberId)
    removeCar(car.id)
  }

  const visible = activeSheet === 'friends'

  const saveName = async () => {
    if (!session || !newName.trim()) return
    setSaving(true)
    const trimmed = newName.trim()
    const color = colorFromName(trimmed)
    await supabase
      .from('members')
      .update({ display_name: trimmed, color })
      .eq('id', session.memberId)
    const updated = { ...session, displayName: trimmed, color }
    saveSession(updated)
    setSession(updated)
    setEditingName(false)
    setSaving(false)
  }

  if (!visible) return null

  const sorted = [...members].sort((a, b) => {
    const aIsMe = a.id === session?.memberId ? -1 : 1
    const bIsMe = b.id === session?.memberId ? -1 : 1
    if (aIsMe !== bIsMe) return aIsMe - bIsMe
    return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
  })

  return (
    <>
      <div
        className="absolute inset-0 bg-black/40 z-30"
        onClick={() => setActiveSheet('none')}
      />
      <div className="absolute bottom-16 left-0 right-0 rounded-t-2xl bg-zinc-950 border-t border-zinc-800 z-40 flex flex-col max-h-[60vh]">
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 shrink-0">
          <div className="w-8 h-1 bg-zinc-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <h2 className="text-white font-semibold mt-2">Your Group</h2>
          <button onClick={() => setActiveSheet('none')} className="ml-auto text-zinc-400 text-2xl mt-2">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
          {sorted.map((m) => {
            const isMe = m.id === session?.memberId
            const online = Date.now() - new Date(m.last_seen).getTime() < ONLINE_MS
            const hasTent = tents.some((t) => t.member_id === m.id)
            const hasCar = cars.some((c) => c.member_id === m.id)
            const isTarget = adminMode && adminTarget === m.id

            return (
              <div key={m.id}>
                <button
                  className={`w-full flex items-center gap-3 py-3 px-1 rounded-xl text-left transition-colors ${isTarget ? 'bg-zinc-800' : 'active:bg-zinc-800'}`}
                  onClick={() => {
                    if (adminMode && !isMe) {
                      setAdminTarget(isTarget ? null : m.id)
                    } else if (!isMe && m.lat && m.lng) {
                      flyTo(m.lat, m.lng)
                      setActiveSheet('friend-detail', m.id)
                    } else if (isMe) {
                      setEditingName(true)
                      setNewName(m.display_name)
                    }
                  }}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl ${!online ? 'opacity-40' : ''}`}
                      style={{ background: m.color }}
                    >
                      {m.display_name[0].toUpperCase()}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${online ? 'bg-green-400' : 'bg-zinc-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {m.display_name} {isMe && <span className="text-zinc-500 text-xs">(you)</span>}
                    </div>
                    <div className={`text-xs ${online ? 'text-green-400' : 'text-zinc-600'}`}>
                      {online ? 'online' : `offline · ${lastSeenLabel(m.last_seen)}`}
                    </div>
                  </div>
                  {adminMode && !isMe ? (
                    <span className={`text-zinc-500 text-lg pr-1 transition-transform ${isTarget ? 'rotate-180' : ''}`}>⌄</span>
                  ) : isMe ? (
                    <span className="text-zinc-500 text-sm pr-1">edit name</span>
                  ) : m.lat ? (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-zinc-500 shrink-0">
                      <path d="M12 2L4 20l8-4 8 4L12 2z" />
                    </svg>
                  ) : null}
                </button>

                {isTarget && (
                  <div className="px-2 pb-3 flex gap-2 flex-wrap">
                    {hasTent && (
                      <button
                        onClick={() => deleteMemberTent(m.id)}
                        className="h-9 px-3 rounded-lg bg-zinc-800 text-zinc-200 text-sm flex items-center gap-1.5 active:bg-zinc-700 border border-zinc-700"
                      >
                        ⛺ Zelt löschen
                      </button>
                    )}
                    {hasCar && (
                      <button
                        onClick={() => deleteMemberCar(m.id)}
                        className="h-9 px-3 rounded-lg bg-zinc-800 text-zinc-200 text-sm flex items-center gap-1.5 active:bg-zinc-700 border border-zinc-700"
                      >
                        🚗 Auto löschen
                      </button>
                    )}
                    <button
                      onClick={() => kickMember(m.id)}
                      className="h-9 px-3 rounded-lg bg-red-900/60 text-red-300 text-sm flex items-center gap-1.5 active:bg-red-900/80 border border-red-800/50"
                    >
                      🚫 Mitglied entfernen
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {editingName && (
          <div className="border-t border-zinc-800 px-4 py-3 shrink-0">
            <p className="text-zinc-400 text-xs mb-2">Change your name</p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value.slice(0, 20))}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                autoFocus
                maxLength={20}
                className="flex-1 h-12 px-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-rose-500"
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={saveName}
                disabled={saving || !newName.trim()}
                className="h-12 px-4 rounded-xl bg-rose-600 text-white font-semibold disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="h-12 px-3 rounded-xl bg-zinc-800 text-zinc-400"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
