import { supabase } from '../../lib/supabase'
import { useGroupStore } from '../../store/group'

interface Props {
  onDropOnMap: () => void
}

export function PinSheet({ onDropOnMap }: Props) {
  const { activeSheet, session, members, pins, setActiveSheet, flyTo, removePin } = useGroupStore()

  const visible = activeSheet === 'pin'
  if (!visible) return null

  const me = session ? members.find((m) => m.id === session.memberId) : null
  const myPin = session ? pins.find((p) => p.created_by === session.memberId && new Date(p.expires_at).getTime() > Date.now()) : null

  const dropAtMyLocation = async () => {
    if (!session || !me?.lat || !me?.lng) return
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // Remove existing pin first
    if (myPin) {
      await supabase.from('meet_pins').delete().eq('id', myPin.id)
    }

    await supabase.from('meet_pins').insert({
      group_code: session.groupCode,
      label: `${session.displayName}'s pin`,
      lat: me.lat,
      lng: me.lng,
      created_by: session.memberId,
      expires_at: expiresAt,
    })
    setActiveSheet('none')
  }

  const dropOnMap = () => {
    setActiveSheet('none')
    onDropOnMap()
  }

  const deletePin = async () => {
    if (!myPin) return
    removePin(myPin.id) // optimistic — realtime DELETE may be delayed
    setActiveSheet('none')
    await supabase.from('meet_pins').delete().eq('id', myPin.id)
  }

  const flyToPin = () => {
    if (myPin) {
      flyTo(myPin.lat, myPin.lng)
      setActiveSheet('none')
    }
  }

  const minutesLeft = myPin
    ? Math.max(0, Math.round((new Date(myPin.expires_at).getTime() - Date.now()) / 60000))
    : 0

  return (
    <>
      <div className="absolute inset-0 bg-black/40 z-30" onClick={() => setActiveSheet('none')} />
      <div className="absolute bottom-16 left-0 right-0 rounded-t-2xl bg-zinc-950 border-t border-zinc-800 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="flex items-center px-4 pb-3 border-b border-zinc-800">
          <h2 className="text-white font-semibold text-base">Meet-me Pin</h2>
          <button onClick={() => setActiveSheet('none')} className="ml-auto text-zinc-400 text-2xl w-10 h-10 flex items-center justify-center">×</button>
        </div>

        <div className="px-4 py-4 space-y-3">
          {myPin ? (
            <>
              {/* Active pin info */}
              <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="text-amber-300 font-semibold">Your pin is live</span>
                </div>
                <p className="text-amber-400/80 text-sm">Expires in {minutesLeft} min</p>
              </div>

              <button
                onClick={flyToPin}
                className="w-full h-14 rounded-xl bg-zinc-800 text-white text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700"
              >
                🗺 Show on map
              </button>

              <button
                onClick={deletePin}
                className="w-full h-14 rounded-xl bg-zinc-800 text-red-400 text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700"
              >
                🗑 Remove my pin
              </button>
            </>
          ) : (
            <>
              <p className="text-zinc-400 text-sm text-center pb-1">
                Let your crew know where to find you
              </p>

              <button
                onClick={dropAtMyLocation}
                disabled={!me?.lat}
                className="w-full h-16 rounded-xl bg-amber-600 text-white text-base font-bold flex items-center justify-center gap-2 active:bg-amber-500 disabled:opacity-40"
              >
                📍 Drop pin at my location
              </button>

              <button
                onClick={dropOnMap}
                className="w-full h-14 rounded-xl bg-zinc-800 text-white text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700"
              >
                🗺 Tap map to place pin
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
