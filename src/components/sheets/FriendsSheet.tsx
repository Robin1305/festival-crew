import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useGroupStore, saveSession } from '../../store/group'
import { colorFromName } from '../../lib/group-code'

function lastSeenLabel(dateStr: string): string {
  const min = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

export function FriendsSheet() {
  const { activeSheet, members, session, setActiveSheet, setSession } = useGroupStore()
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

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

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {sorted.map((m) => {
            const isMe = m.id === session?.memberId
            const stale = Date.now() - new Date(m.last_seen).getTime() > 5 * 60 * 1000
            return (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shrink-0 ${stale ? 'opacity-40' : ''}`}
                  style={{ background: m.color }}
                >
                  {m.display_name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {m.display_name} {isMe && <span className="text-zinc-500 text-xs">(you)</span>}
                  </div>
                  <div className={`text-xs ${stale ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {lastSeenLabel(m.last_seen)}
                    {m.is_sos && ' · 🆘 needs help!'}
                  </div>
                </div>
                {isMe && (
                  <button
                    onClick={() => { setEditingName(true); setNewName(m.display_name) }}
                    className="text-zinc-500 text-sm"
                  >
                    edit
                  </button>
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
