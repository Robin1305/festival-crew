import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { loadSession, useGroupStore } from '../store/group'
import { useRealtimeMembers } from '../hooks/useRealtimeMembers'
import { useRealtimePosts } from '../hooks/useRealtimePosts'
import { useRealtimePins } from '../hooks/useRealtimePins'
import { useLocationPublisher } from '../hooks/useLocationPublisher'
import { MapView, FriendDetailCard } from '../components/MapView'
import { BottomNav } from '../components/BottomNav'
import { TopBar } from '../components/TopBar'
import { BulletinSheet } from '../components/sheets/BulletinSheet'
import { FriendsSheet } from '../components/sheets/FriendsSheet'
import { PinSheet } from '../components/sheets/PinSheet'

export function FestivalPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, setSession, setPois, activeSheet } = useGroupStore()
  const [dropping, setDropping] = useState(false)
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

  useRealtimeMembers(code ?? '')
  useRealtimePosts(code ?? '')
  useRealtimePins(code ?? '')

  const { accuracy } = useLocationPublisher(session?.memberId, paused)

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

      <MapView
        dropping={dropping}
        onDrop={handleDrop}
        onStopDropping={() => setDropping(false)}
      />

      {activeSheet === 'friend-detail' && <FriendDetailCard />}

      <BulletinSheet />
      <FriendsSheet />
      <PinSheet onDropOnMap={() => setDropping(true)} />

      <BottomNav />
    </div>
  )
}
