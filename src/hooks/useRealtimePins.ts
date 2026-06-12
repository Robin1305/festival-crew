import { useEffect } from 'react'
import { supabase, type MeetPin } from '../lib/supabase'
import { useGroupStore } from '../store/group'

export function useRealtimePins(groupCode: string) {
  const { setPins, addPin, removePin } = useGroupStore()

  useEffect(() => {
    if (!groupCode) return

    const now = new Date().toISOString()
    supabase
      .from('meet_pins')
      .select('*')
      .eq('group_code', groupCode)
      .gt('expires_at', now)
      .then(({ data }) => {
        if (data) setPins(data as MeetPin[])
      })

    const channel = supabase
      .channel(`group:${groupCode}:pins`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meet_pins',
          filter: `group_code=eq.${groupCode}`,
        },
        (payload) => {
          addPin(payload.new as MeetPin)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'meet_pins',
          filter: `group_code=eq.${groupCode}`,
        },
        (payload) => {
          removePin(payload.old.id)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupCode, setPins, addPin, removePin])
}
