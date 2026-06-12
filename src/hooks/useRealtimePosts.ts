import { useEffect } from 'react'
import { supabase, type BulletinPost } from '../lib/supabase'
import { useGroupStore } from '../store/group'

export function useRealtimePosts(groupCode: string) {
  const { setPosts, addPost } = useGroupStore()

  useEffect(() => {
    if (!groupCode) return

    supabase
      .from('bulletin_posts')
      .select('*')
      .eq('group_code', groupCode)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setPosts(data as BulletinPost[])
      })

    const channel = supabase
      .channel(`group:${groupCode}:posts`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bulletin_posts',
          filter: `group_code=eq.${groupCode}`,
        },
        (payload) => {
          addPost(payload.new as BulletinPost)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupCode, setPosts, addPost])
}
