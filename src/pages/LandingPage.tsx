import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateCode, isValidCode } from '../lib/group-code'

export function LandingPage() {
  const [creating, setCreating] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const createGroup = async () => {
    setCreating(true)
    setError(null)
    const code = generateCode()
    const { error: err } = await supabase.from('groups').insert({
      code,
      name: 'Southside 2026',
      expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    })
    if (err) {
      setError('Could not create group. Try again.')
      setCreating(false)
      return
    }
    navigate(`/join/${code}`)
  }

  const joinManual = () => {
    const code = manualCode.trim().toLowerCase()
    if (!isValidCode(code)) {
      setError('Invalid code. Must be 6 characters.')
      return
    }
    navigate(`/join/${code}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8 bg-zinc-950">
      <div className="text-center">
        <div className="text-6xl mb-4">🎪</div>
        <h1 className="text-3xl font-bold text-white">Festival Crew</h1>
        <p className="text-zinc-400 mt-2">Find your people. No accounts, no nonsense.</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <button
          onClick={createGroup}
          disabled={creating}
          className="h-16 w-full rounded-xl bg-rose-600 text-white text-xl font-bold disabled:opacity-50 active:scale-95 transition-transform"
        >
          {creating ? 'Creating...' : '🎉 Create a group'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-sm">or join with a code</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="6-char code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && joinManual()}
            maxLength={6}
            className="flex-1 h-14 px-4 rounded-xl bg-zinc-800 text-white text-center text-lg tracking-widest placeholder:text-zinc-500 border border-zinc-700 focus:outline-none focus:border-rose-500 uppercase"
          />
          <button
            onClick={joinManual}
            disabled={manualCode.length < 6}
            className="h-14 px-5 rounded-xl bg-zinc-700 text-white font-semibold disabled:opacity-40"
          >
            Join
          </button>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    </div>
  )
}
