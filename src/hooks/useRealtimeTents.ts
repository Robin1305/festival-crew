import { useEffect } from 'react'
import { supabase, type Tent } from '../lib/supabase'
import { useGroupStore } from '../store/group'

export function useRealtimeTents(groupCode: string) {
  const { setTents, upsertTent, removeTent } = useGroupStore()

  useEffect(() => {
    if (!groupCode) return

    supabase
      .from('tents')
      .select('*')
      .eq('group_code', groupCode)
      .then(({ data }) => {
        if (data) setTents(data as Tent[])
      })

    const channel = supabase
      .channel(`group:${groupCode}:tents`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tents', filter: `group_code=eq.${groupCode}` },
        (payload) => upsertTent(payload.new as Tent))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tents', filter: `group_code=eq.${groupCode}` },
        (payload) => upsertTent(payload.new as Tent))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tents', filter: `group_code=eq.${groupCode}` },
        (payload) => removeTent(payload.old.id))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupCode, setTents, upsertTent, removeTent])
}
