import { useEffect } from 'react'
import { supabase, type Car } from '../lib/supabase'
import { useGroupStore } from '../store/group'

export function useRealtimeCars(groupCode: string) {
  const { setCars, upsertCar, removeCar } = useGroupStore()

  useEffect(() => {
    if (!groupCode) return

    supabase
      .from('cars')
      .select('*')
      .eq('group_code', groupCode)
      .then(({ data }) => { if (data) setCars(data as Car[]) })

    const channel = supabase
      .channel(`group:${groupCode}:cars`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cars', filter: `group_code=eq.${groupCode}` },
        (payload) => upsertCar(payload.new as Car))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cars', filter: `group_code=eq.${groupCode}` },
        (payload) => upsertCar(payload.new as Car))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cars', filter: `group_code=eq.${groupCode}` },
        (payload) => removeCar(payload.old.id))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupCode, setCars, upsertCar, removeCar])
}
