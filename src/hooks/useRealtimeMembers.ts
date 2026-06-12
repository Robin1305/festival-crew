import { useEffect } from 'react'
import { supabase, type Member } from '../lib/supabase'
import { useGroupStore } from '../store/group'

export function useRealtimeMembers(groupCode: string) {
  const { setMembers, upsertMember } = useGroupStore()

  useEffect(() => {
    if (!groupCode) return

    supabase
      .from('members')
      .select('*')
      .eq('group_code', groupCode)
      .then(({ data }) => {
        if (data) setMembers(data as Member[])
      })

    const channel = supabase
      .channel(`group:${groupCode}:members`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `group_code=eq.${groupCode}` },
        (payload) => {
          if (payload.eventType === 'DELETE') return
          upsertMember(payload.new as Member)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupCode, setMembers, upsertMember])
}
