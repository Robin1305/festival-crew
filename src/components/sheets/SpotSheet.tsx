import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useGroupStore } from '../../store/group'
import type { Tent, Car } from '../../lib/supabase'

const SPOT_COLORS = [
  '#f59e0b', '#ef4444', '#3b82f6', '#22c55e',
  '#a855f7', '#ec4899', '#f97316', '#06b6d4',
  '#facc15', '#d1d5db',
]

interface SpotSectionProps {
  emoji: string
  label: string
  defaultColor: string
  mySpot: Tent | Car | null
  myLat: number | null
  onDropAtLocation: (name: string, color: string) => Promise<void>
  onDropOnMap: (name: string, color: string) => void
  onDelete: () => Promise<void>
  onFlyTo: () => void
  defaultName: string
}

function SpotSection({
  emoji, label, defaultColor, mySpot, myLat,
  onDropAtLocation, onDropOnMap, onDelete, onFlyTo, defaultName,
}: SpotSectionProps) {
  const [name, setName] = useState(() => mySpot?.name ?? defaultName)
  const [color, setColor] = useState(() => mySpot?.color ?? defaultColor)
  const [moving, setMoving] = useState(false)

  const showPlacement = !mySpot || moving

  if (showPlacement) {
    return (
      <div className="space-y-3">
        <p className="text-zinc-400 text-sm text-center">
          {moving ? `Move your ${label.toLowerCase()} to a new spot` : `Pin your ${label.toLowerCase()} so your crew can find it`}
        </p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          placeholder={`${label} name...`}
          maxLength={20}
          className="w-full h-12 px-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-amber-500"
          style={{ fontSize: '16px' }}
        />

        <div>
          <p className="text-zinc-500 text-xs mb-2">Color</p>
          <div className="flex gap-2 flex-wrap">
            {SPOT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform active:scale-90 ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => onDropAtLocation(name.trim() || defaultName, color)}
          disabled={!myLat}
          className="w-full h-16 rounded-xl bg-amber-600 text-white text-base font-bold flex items-center justify-center gap-2 active:bg-amber-500 disabled:opacity-40"
        >
          {emoji} {label} hier ablegen
        </button>

        <button
          onClick={() => onDropOnMap(name.trim() || defaultName, color)}
          className="w-full h-14 rounded-xl bg-zinc-800 text-white text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700"
        >
          🗺 Auf Karte tippen
        </button>

        {moving && (
          <button
            onClick={() => setMoving(false)}
            className="w-full h-11 rounded-xl bg-zinc-900 text-zinc-400 text-sm flex items-center justify-center active:bg-zinc-800"
          >
            Abbrechen
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 bg-zinc-800/60 rounded-xl p-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0" style={{ background: mySpot.color }}>
          {emoji}
        </div>
        <div>
          <div className="text-white font-semibold">{mySpot.name}</div>
          <div className="text-zinc-400 text-xs">Auf der Karte gespeichert</div>
        </div>
      </div>

      <button onClick={onFlyTo} className="w-full h-14 rounded-xl bg-zinc-800 text-white text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700">
        🗺 Auf Karte anzeigen
      </button>

      <button
        onClick={() => { setName(mySpot.name); setColor(mySpot.color); setMoving(true) }}
        className="w-full h-14 rounded-xl bg-zinc-800 text-white text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700"
      >
        ✏️ Verschieben / umbenennen
      </button>

      <button onClick={onDelete} className="w-full h-14 rounded-xl bg-zinc-800 text-red-400 text-base font-medium flex items-center justify-center gap-2 active:bg-zinc-700">
        🗑 Entfernen
      </button>
    </div>
  )
}

interface Props {
  onDropOnMap: (type: 'tent' | 'car', name: string, color: string) => void
}

export function SpotSheet({ onDropOnMap }: Props) {
  const { activeSheet, session, members, tents, cars, setActiveSheet, flyTo, removeTent, removeCar } = useGroupStore()
  const [tab, setTab] = useState<'tent' | 'car'>('tent')

  const visible = activeSheet === 'spots'
  if (!visible) return null

  const me = session ? members.find((m) => m.id === session.memberId) : null
  const myTent = session ? tents.find((t) => t.member_id === session.memberId) : null
  const myCar = session ? cars.find((c) => c.member_id === session.memberId) : null

  const upsertTent = async (lat: number, lng: number, name: string, color: string) => {
    if (!session) return
    await supabase.from('tents').upsert(
      { group_code: session.groupCode, member_id: session.memberId, name, color, lat, lng },
      { onConflict: 'group_code,member_id' },
    )
  }

  const upsertCar = async (lat: number, lng: number, name: string, color: string) => {
    if (!session) return
    await supabase.from('cars').upsert(
      { group_code: session.groupCode, member_id: session.memberId, name, color, lat, lng },
      { onConflict: 'group_code,member_id' },
    )
  }

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
          <h2 className="text-white font-semibold text-base">Meine Orte</h2>
          <button onClick={() => setActiveSheet('none')} className="ml-auto text-zinc-400 text-2xl w-10 h-10 flex items-center justify-center">×</button>
        </div>

        {/* Sub-tabs */}
        <div className="flex px-4 pt-3 gap-2">
          {(['tent', 'car'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors
                ${tab === t ? 'bg-zinc-700 text-white' : 'bg-zinc-800/50 text-zinc-400 active:bg-zinc-800'}`}
            >
              {t === 'tent' ? (
                <>{myTent && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />} ⛺ Zelt</>
              ) : (
                <>{myCar && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />} 🚗 Auto</>
              )}
            </button>
          ))}
        </div>

        <div className="px-4 py-4">
          {tab === 'tent' ? (
            <SpotSection
              emoji="⛺"
              label="Zelt"
              defaultColor="#f59e0b"
              defaultName={session?.displayName ?? 'Mein Zelt'}
              mySpot={myTent ?? null}
              myLat={me?.lat ?? null}
              onDropAtLocation={async (name, color) => {
                if (!me?.lat || !me?.lng) return
                await upsertTent(me.lat, me.lng, name, color)
                setActiveSheet('none')
              }}
              onDropOnMap={(name, color) => {
                setActiveSheet('none')
                onDropOnMap('tent', name, color)
              }}
              onDelete={async () => {
                if (!myTent) return
                removeTent(myTent.id)
                setActiveSheet('none')
                await supabase.from('tents').delete().eq('id', myTent.id)
              }}
              onFlyTo={() => { if (myTent) { flyTo(myTent.lat, myTent.lng); setActiveSheet('none') } }}
            />
          ) : (
            <SpotSection
              emoji="🚗"
              label="Auto"
              defaultColor="#3b82f6"
              defaultName={session?.displayName ?? 'Mein Auto'}
              mySpot={myCar ?? null}
              myLat={me?.lat ?? null}
              onDropAtLocation={async (name, color) => {
                if (!me?.lat || !me?.lng) return
                await upsertCar(me.lat, me.lng, name, color)
                setActiveSheet('none')
              }}
              onDropOnMap={(name, color) => {
                setActiveSheet('none')
                onDropOnMap('car', name, color)
              }}
              onDelete={async () => {
                if (!myCar) return
                removeCar(myCar.id)
                setActiveSheet('none')
                await supabase.from('cars').delete().eq('id', myCar.id)
              }}
              onFlyTo={() => { if (myCar) { flyTo(myCar.lat, myCar.lng); setActiveSheet('none') } }}
            />
          )}
        </div>
      </div>
    </>
  )
}
