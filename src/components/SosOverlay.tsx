import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGroupStore } from '../store/group'

export function SosOverlay() {
  const { activeSheet, session, members, setActiveSheet } = useGroupStore()
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const visible = activeSheet === 'sos'
  const me = session && members.find((m) => m.id === session.memberId)
  const alreadySos = me?.is_sos

  const sendSos = async () => {
    if (!session) return
    setSending(true)

    await supabase.from('members').update({ is_sos: true }).eq('id', session.memberId)
    await supabase.from('bulletin_posts').insert({
      group_code: session.groupCode,
      author_name: session.displayName,
      content: `🆘 ${session.displayName} needs help! Check the map for their location.`,
      kind: 'sos',
      lat: me?.lat ?? null,
      lng: me?.lng ?? null,
    })

    setSending(false)
    setSent(true)
  }

  const cancelSos = async () => {
    if (!session) return
    await supabase.from('members').update({ is_sos: false }).eq('id', session.memberId)
    setSent(false)
    setActiveSheet('none')
  }

  if (!visible) return null

  return (
    <div className="absolute inset-0 bg-zinc-950/95 z-50 flex flex-col items-center justify-center px-6 gap-6">
      {sent || alreadySos ? (
        <>
          <div className="text-6xl">✅</div>
          <h2 className="text-white text-2xl font-bold text-center">SOS sent</h2>
          <p className="text-zinc-400 text-center text-sm">
            Your group can see your location and knows you need help.
          </p>
          <button
            onClick={cancelSos}
            className="h-16 w-full max-w-sm rounded-2xl bg-zinc-700 text-white text-xl font-bold active:scale-95 transition-transform"
          >
            I'm OK now — cancel SOS
          </button>
          <button
            onClick={() => setActiveSheet('none')}
            className="text-zinc-500 text-sm"
          >
            Close
          </button>
        </>
      ) : (
        <>
          <div className="text-6xl">🆘</div>
          <h2 className="text-white text-2xl font-bold text-center">Send SOS?</h2>
          <ul className="text-zinc-300 text-sm space-y-2 text-left w-full max-w-sm">
            <li>• Your exact location is shared with everyone</li>
            <li>• "Needs help!" is posted to the bulletin board</li>
            <li>• Your marker flashes red on the map</li>
          </ul>

          <button
            onClick={sendSos}
            disabled={sending}
            className="h-16 w-full max-w-sm rounded-2xl bg-red-600 text-white text-xl font-bold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {sending ? 'Sending...' : 'Send SOS now'}
          </button>

          <button
            onClick={() => setActiveSheet('none')}
            className="text-zinc-400 text-sm"
          >
            Cancel — I'm fine
          </button>
        </>
      )}
    </div>
  )
}
