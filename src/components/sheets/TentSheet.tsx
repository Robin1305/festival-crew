import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useGroupStore } from '../../store/group'

const TENT_COLORS = [
  '#f59e0b', '#ef4444', '#3b82f6', '#22c55e',
  '#a855f7', '#ec4899', '#f97316', '#06b6d4',
  '#facc15', '#d1d5db',
]

interface Props {
  onDropOnMap: (name: string, color: string) => void
}

export function TentSheet({ onDropOnMap }: Props) {
  const { activeSheet, session, members, tents, setActiveSheet, flyTo, removeTent } = useGroupStore()

  const visible = activeSheet === 'tent'
  const myTent = session ? tents.find((t) => t.member_id === session.memberId) : null
  const me = session ? members.find((m) => m.id === session.memberId) : null

  const [tentName, setTentName] = useState(() => myTent?.name ?? 'My Tent')
  const [tentColor, setTentColor] = useState(() => myTent?.color ?? '#f59e0b')
  const [moving, setMoving] = useState(false)

  if (!visible) return null

  const upsert = async (lat: number, lng: number) => {
    if (!session) return
    await supabase.from('tents').upsert(
      {
        group_code: session.groupCode,
        member_id: session.memberId,
        name: tentName.trim() || 'My Tent',
        color: tentColor,
        lat,
        lng,
      },
      { onConflict: 'group_code,member_id' },
    )
  }

  const dropAtMyLocation = async () => {
    if (!me?.lat || !me?.lng) return
    await upsert(me.lat, me.lng)
    setMoving(false)
    setActiveSheet('none')
  }

  const dropOnMap = () => {
    setActiveSheet('none')
    onDropOnMap(tentName.trim() || 'My Tent', tentColor)
  }

  const deleteTent = async () => {
    if (!myTent) return
    removeTent(myTent.id) // optimistic
    setActiveSheet('none')
    await supabase.from('tents').delete().eq('id', myTent.id)
  }

  const flyToTent = () => {
    if (myTent) {
      flyTo(myTent.lat, myTent.lng)
      setActiveSheet('none')
    }
  }

  const startMove = () => {
    setTentName(myTent?.name ?? 'My Tent')
    setTentColor(myTent?.color ?? '#f59e0b')
    setMoving(true)
  }

  const showPlacement = !myTent || moving

  return (
    <>
      <div className="absolute inset-0 bg-black/40 z-30" onClick={() => setActiveSheet('none')} />
      <div
        className="absolute bottom-16 left-0 right-0 rounded-t-2xl bg-zinc-950 border-t border-zinc-800 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="flex items-center px-4 pb-3 border-b border-zinc-800">
          <h2 className="text-white font-semibold text-base">My Tent</h2>
          <button
            onClick={() => setActiveSheet('none')}
            className="ml-auto text-zinc-400 text-2xl w-10 h-10 flex items-center justify-center"
          >×</button>
        </div>

        <div className="px-4 py-4 space-y-3">
          {showPlacement ? (
            <>
              <p className="text-zinc-400 text-sm text-center pb-1">
                {moving ? 'Move your tent to a new spot' : 'Pin your tent so your crew can find you'}
              </p>

              <input
                value={tentName}
                onChange={(e) => setTentName(e.target.value.slice(0, 20))}
                placeholder="Tent name..."
                maxLength={20}
                className="w-full h-12 px-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-amber-500"
                style={{ fontSize: '16px' }}
              />

              <div>
                <p className="text-zinc-500 text-xs mb-2">Tent color</p>
                <div className="flex gap-2 flex-wrap">
                  {TENT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTentColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform active:scale-90 ${tentColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={dropAtMyLocation}
                disabled={!me?.lat}
                className="w-full h-16 rounded-xl bg-amber-600 text-white text-base font-bold flex items-center justify-center gap-2 active:bg-amber-500 disabled:opacity-40"
              >
                ⛺ Drop tent at my location
              </button>

              <button
                onClick={dropOnMap}
                className="w-full h-14 rounded-xl bg-zinc-800 text-white text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700"
              >
                🗺 Tap map to place tent
              </button>

              {moving && (
                <button
                  onClick={() => setMoving(false)}
                  className="w-full h-11 rounded-xl bg-zinc-900 text-zinc-400 text-sm font-medium flex items-center justify-center active:bg-zinc-800"
                >
                  Cancel
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-zinc-800/60 rounded-xl p-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ background: myTent.color }}
                >
                  ⛺
                </div>
                <div>
                  <div className="text-white font-semibold">{myTent.name}</div>
                  <div className="text-zinc-400 text-xs">Your tent is on the map</div>
                </div>
              </div>

              <button
                onClick={flyToTent}
                className="w-full h-14 rounded-xl bg-zinc-800 text-white text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700"
              >
                🗺 Show on map
              </button>

              <button
                onClick={startMove}
                className="w-full h-14 rounded-xl bg-zinc-800 text-white text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700"
              >
                ✏️ Move / rename tent
              </button>

              <button
                onClick={deleteTent}
                className="w-full h-14 rounded-xl bg-zinc-800 text-red-400 text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700"
              >
                🗑 Remove my tent
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
