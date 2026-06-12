import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { loadSession, useGroupStore } from '../store/group'
import { useRealtimeMembers } from '../hooks/useRealtimeMembers'
import { useRealtimePosts } from '../hooks/useRealtimePosts'
import { useRealtimePins } from '../hooks/useRealtimePins'
import { useRealtimeTents } from '../hooks/useRealtimeTents'
import { useLocationPublisher } from '../hooks/useLocationPublisher'
import { MapView, FriendDetailCard } from '../components/MapView'
import { BottomNav } from '../components/BottomNav'
import { TopBar } from '../components/TopBar'
import { BulletinSheet } from '../components/sheets/BulletinSheet'
import { FriendsSheet } from '../components/sheets/FriendsSheet'
import { PinSheet } from '../components/sheets/PinSheet'
import { TentSheet } from '../components/sheets/TentSheet'

export function FestivalPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, setSession, setPois, activeSheet, setActiveSheet, newPostAlert, clearNewPostAlert } = useGroupStore()

  const [dropping, setDropping] = useState(false)
  const [droppingTent, setDroppingTent] = useState(false)
  const [pendingTentName, setPendingTentName] = useState('My Tent')
  const [pendingTentColor, setPendingTentColor] = useState('#f59e0b')
  const [paused, setPaused] = useState(false)
  const [highAccuracy, setHighAccuracy] = useState(() => localStorage.getItem('fc-high-accuracy') === '1')
  const [groupName, setGroupName] = useState('Festival Crew')

  const toggleHighAccuracy = () => {
    setHighAccuracy((v) => {
      const next = !v
      localStorage.setItem('fc-high-accuracy', next ? '1' : '0')
      return next
    })
  }

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

    supabase
      .from('groups')
      .select('name')
      .eq('code', code)
      .single()
      .then(({ data }) => { if (data) setGroupName(data.name) })

    supabase
      .from('pois')
      .select('*')
      .eq('group_code', code)
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

  const { accuracy } = useLocationPublisher(session?.memberId, paused, highAccuracy)

  const handleDrop = async (lat: number, lng: number) => {
    if (!session) return
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    await supabase.from('meet_pins').insert({
      group_code: session.groupCode,
      label: `${session.displayName}'s pin`,
      lat,
      lng,
      created_by: session.memberId,
      expires_at: expiresAt,
    })
  }

  const handleDropTent = async (lat: number, lng: number) => {
    if (!session) return
    await supabase.from('tents').upsert(
      {
        group_code: session.groupCode,
        member_id: session.memberId,
        name: pendingTentName,
        color: pendingTentColor,
        lat,
        lng,
      },
      { onConflict: 'group_code,member_id' },
    )
  }

  const handleDropTentOnMap = (name: string, color: string) => {
    setPendingTentName(name)
    setPendingTentColor(color)
    setDroppingTent(true)
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
        highAccuracy={highAccuracy}
        onToggleHighAccuracy={toggleHighAccuracy}
      />

      <MapView
        dropping={dropping}
        onDrop={handleDrop}
        onStopDropping={() => setDropping(false)}
        droppingTent={droppingTent}
        onDropTent={handleDropTent}
        onStopDroppingTent={() => setDroppingTent(false)}
      />

      {/* New message toast — tap to open messages */}
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
      <PinSheet onDropOnMap={() => setDropping(true)} />
      <TentSheet onDropOnMap={handleDropTentOnMap} />

      <BottomNav />
    </div>
  )
}
