import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { loadSession, useGroupStore } from '../store/group'
import { useRealtimeMembers } from '../hooks/useRealtimeMembers'
import { useRealtimePosts } from '../hooks/useRealtimePosts'
import { useRealtimePins } from '../hooks/useRealtimePins'
import { useRealtimeTents } from '../hooks/useRealtimeTents'
import { useRealtimeCars } from '../hooks/useRealtimeCars'
import { useLocationPublisher } from '../hooks/useLocationPublisher'
import { MapView, FriendDetailCard, type DroppingMode } from '../components/MapView'
import { BottomNav } from '../components/BottomNav'
import { TopBar } from '../components/TopBar'
import { BulletinSheet } from '../components/sheets/BulletinSheet'
import { FriendsSheet } from '../components/sheets/FriendsSheet'
import { PinSheet } from '../components/sheets/PinSheet'
import { SpotSheet } from '../components/sheets/SpotSheet'

export function FestivalPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, setSession, setPois, activeSheet, setActiveSheet, newPostAlert, clearNewPostAlert, adminMode } = useGroupStore()

  const [droppingMode, setDroppingMode] = useState<DroppingMode>(null)
  const pendingSpotRef = useRef<{ type: 'tent' | 'car'; name: string; color: string } | null>(null)

  const [paused, setPaused] = useState(false)
  const [groupName, setGroupName] = useState('Festival Crew')

  useEffect(() => {
    if (!code) return
    const existing = loadSession(code)
    if (!existing) {
      navigate(`/join/${code}`, { replace: true })
      return
    }
    setSession(existing)
  }, [code, navigate, setSession])

  useEffect(() => {
    if (!code || !session) return
    supabase.from('groups').select('name').eq('code', code).single()
      .then(({ data }) => { if (data) setGroupName(data.name) })
    supabase.from('pois').select('*').eq('group_code', code)
      .then(({ data }) => { if (data) setPois(data) })
  }, [code, session, setPois])

  // Auto-dismiss new message toast after 3s
  useEffect(() => {
    if (!newPostAlert) return
    const t = setTimeout(clearNewPostAlert, 3000)
    return () => clearTimeout(t)
  }, [newPostAlert, clearNewPostAlert])

  useRealtimeMembers(code ?? '')
  useRealtimePosts(code ?? '')
  useRealtimePins(code ?? '')
  useRealtimeTents(code ?? '')
  useRealtimeCars(code ?? '')

  const { accuracy } = useLocationPublisher(session?.memberId, paused)

  const handleDropped = async (lat: number, lng: number) => {
    if (!session) return

    if (droppingMode === 'pin') {
      await supabase.from('meet_pins').insert({
        group_code: session.groupCode,
        label: `${session.displayName}'s pin`,
        lat, lng,
        created_by: session.memberId,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
    } else if (droppingMode === 'tent' && pendingSpotRef.current) {
      const { name, color } = pendingSpotRef.current
      await supabase.from('tents').upsert(
        { group_code: session.groupCode, member_id: session.memberId, name, color, lat, lng },
        { onConflict: 'group_code,member_id' },
      )
    } else if (droppingMode === 'car' && pendingSpotRef.current) {
      const { name, color } = pendingSpotRef.current
      await supabase.from('cars').upsert(
        { group_code: session.groupCode, member_id: session.memberId, name, color, lat, lng },
        { onConflict: 'group_code,member_id' },
      )
    }

    setDroppingMode(null)
    pendingSpotRef.current = null
  }

  const handleSpotDropOnMap = (type: 'tent' | 'car', name: string, color: string) => {
    pendingSpotRef.current = { type, name, color }
    setDroppingMode(type)
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-dvh bg-zinc-950">
        <span className="text-zinc-500">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-dvh bg-zinc-950 overflow-hidden relative">
      <TopBar
        groupName={groupName}
        accuracy={accuracy}
        paused={paused}
        onTogglePaused={() => setPaused((p) => !p)}
      />

      {adminMode && (
        <div className="bg-red-950 border-b border-red-800 text-red-300 text-xs text-center py-1.5 px-4 shrink-0">
          🛡 Admin-Modus — Mitglieder antippen zum Entfernen
        </div>
      )}

      <MapView
        droppingMode={droppingMode}
        onDropped={handleDropped}
        onCancelDrop={() => { setDroppingMode(null); pendingSpotRef.current = null }}
      />

      {/* New message toast */}
      {newPostAlert && (
        <div
          className="absolute top-14 left-4 right-4 z-50 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 shadow-xl active:bg-zinc-700"
          onClick={() => { clearNewPostAlert(); setActiveSheet('bulletin') }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">💬</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-400">{newPostAlert.author_name}</div>
              <div className="text-white text-sm truncate">{newPostAlert.content}</div>
            </div>
          </div>
        </div>
      )}

      {activeSheet === 'friend-detail' && <FriendDetailCard />}

      <BulletinSheet />
      <FriendsSheet />
      <PinSheet onDropOnMap={() => setDroppingMode('pin')} />
      <SpotSheet onDropOnMap={handleSpotDropOnMap} />

      <BottomNav />
    </div>
  )
}
