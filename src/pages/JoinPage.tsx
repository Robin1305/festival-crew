import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { loadSession, useGroupStore } from '../store/group'
import { JoinScreen } from '../components/JoinScreen'

export function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { setSession } = useGroupStore()
  const [groupName, setGroupName] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!code) return

    // If already joined, go straight to the map
    const existing = loadSession(code)
    if (existing) {
      setSession(existing)
      navigate(`/${code}`, { replace: true })
      return
    }

    supabase
      .from('groups')
      .select('name')
      .eq('code', code)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setGroupName(data.name)
        }
      })
  }, [code, navigate, setSession])

  if (!code) return null

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-4 bg-zinc-950">
        <div className="text-5xl">🤷</div>
        <h1 className="text-xl font-bold text-white">Group not found</h1>
        <p className="text-zinc-400 text-sm text-center">
          This link may have expired. Ask your crew to share a new one.
        </p>
      </div>
    )
  }

  if (!groupName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <span className="text-zinc-500">Loading...</span>
      </div>
    )
  }

  return <JoinScreen groupCode={code} groupName={groupName} />
}
