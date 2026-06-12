import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useGroupStore } from '../../store/group'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

const KIND_ICON: Record<string, string> = {
  message: '',
  sos: '🆘 ',
  meetme: '📍 ',
}

export function BulletinSheet() {
  const { activeSheet, posts, session, setActiveSheet, markPostsRead } = useGroupStore()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeSheet === 'bulletin') markPostsRead()
  }, [activeSheet, markPostsRead])

  const visible = activeSheet === 'bulletin'

  const send = async () => {
    if (!session || !text.trim()) return
    setSending(true)
    await supabase.from('bulletin_posts').insert({
      group_code: session.groupCode,
      author_name: session.displayName,
      content: text.trim(),
      kind: 'message',
    })
    setText('')
    setSending(false)
  }

  if (!visible) return null

  return (
    <>
      <div
        className="absolute inset-0 bg-black/40 z-30"
        onClick={() => setActiveSheet('none')}
      />
      <div className="absolute bottom-16 left-0 right-0 rounded-t-2xl bg-zinc-950 border-t border-zinc-800 z-40 flex flex-col max-h-[70vh]">
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 shrink-0">
          <div className="w-8 h-1 bg-zinc-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <h2 className="text-white font-semibold mt-2">Bulletin Board</h2>
          <button onClick={() => setActiveSheet('none')} className="ml-auto text-zinc-400 text-2xl mt-2">×</button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {posts.length === 0 && (
            <p className="text-zinc-500 text-center py-8 text-sm">No messages yet. Be the first!</p>
          )}
          {posts.map((post) => (
            <div key={post.id} className={`rounded-xl p-3 ${post.kind === 'sos' ? 'bg-red-950 border border-red-800' : 'bg-zinc-900'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold" style={{ color: '#a855f7' }}>
                  {post.author_name}
                </span>
                <span className="text-zinc-500 text-xs ml-auto">{timeAgo(post.created_at)}</span>
              </div>
              <p className="text-white text-sm leading-relaxed">
                {KIND_ICON[post.kind]}{post.content}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-zinc-800 shrink-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 160))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Write a message..."
            rows={2}
            className="flex-1 bg-zinc-800 text-white rounded-xl px-3 py-2 resize-none placeholder:text-zinc-500 border border-zinc-700 focus:outline-none focus:border-rose-500"
            style={{ fontSize: '16px' }}
          />
          <div className="flex flex-col justify-end">
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            >
              ✓
            </button>
            <span className="text-zinc-600 text-[10px] text-center mt-1">{160 - text.length}</span>
          </div>
        </div>
      </div>
    </>
  )
}
