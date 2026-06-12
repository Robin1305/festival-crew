import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colorFromName } from '../lib/group-code'
import { useGroupStore } from '../store/group'
import { saveSession } from '../store/group'

interface Props {
  groupCode: string
  groupName: string
}

export function JoinScreen({ groupCode, groupName }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setSession } = useGroupStore()
  const navigate = useNavigate()

  const join = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)

    const color = colorFromName(trimmed)
    const { data, error: err } = await supabase
      .from('members')
      .insert({ group_code: groupCode, display_name: trimmed, color })
      .select()
      .single()

    if (err || !data) {
      setError('Could not join. Try again.')
      setLoading(false)
      return
    }

    const session = { groupCode, memberId: data.id, displayName: trimmed, color }
    saveSession(session)
    setSession(session)
    navigate(`/${groupCode}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8 bg-zinc-950">
      <div className="text-center">
        <div className="text-5xl mb-4">🎪</div>
        <h1 className="text-2xl font-bold text-white">{groupName}</h1>
        <p className="text-zinc-400 mt-1 text-sm">Join the group to share your location</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="text"
          placeholder="Your name (e.g. Marco)"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          onKeyDown={(e) => e.key === 'Enter' && join()}
          autoFocus
          maxLength={20}
          className="w-full h-14 px-4 rounded-xl bg-zinc-800 text-white text-lg placeholder:text-zinc-500 border border-zinc-700 focus:outline-none focus:border-rose-500"
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          onClick={join}
          disabled={loading || name.trim().length === 0}
          className="h-16 w-full rounded-xl bg-rose-600 text-white text-xl font-bold disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? 'Joining...' : 'Join the group'}
        </button>

        <ul className="text-zinc-400 text-sm space-y-1 mt-2">
          <li>📍 Share your location with the group</li>
          <li>👥 See where your friends are</li>
          <li>📋 Leave messages on the bulletin board</li>
        </ul>
      </div>
    </div>
  )
}
