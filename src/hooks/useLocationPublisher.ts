import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { haversineDistance } from '../lib/group-code'

export function useLocationPublisher(memberId: string | undefined, paused: boolean, highAccuracy: boolean) {
  const lastPos = useRef<{ lat: number; lng: number } | null>(null)
  const lastSent = useRef<number>(0)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!memberId || paused) return

    const INTERVAL_MS = 30_000
    const MIN_MOVE_M = 10

    const send = async (lat: number, lng: number, acc: number) => {
      const now = Date.now()
      const prev = lastPos.current
      const moved = prev ? haversineDistance(prev.lat, prev.lng, lat, lng) : Infinity
      const elapsed = now - lastSent.current

      if (moved < MIN_MOVE_M && elapsed < INTERVAL_MS) return

      lastPos.current = { lat, lng }
      lastSent.current = now

      await supabase
        .from('members')
        .update({ lat, lng, accuracy_m: Math.round(acc), last_seen: new Date().toISOString() })
        .eq('id', memberId)
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords
        setAccuracy(acc)
        setError(null)
        send(latitude, longitude, acc)
      },
      (err) => setError(err.message),
      {
        enableHighAccuracy: highAccuracy,
        timeout: 15_000,
        maximumAge: highAccuracy ? 5_000 : 20_000,
      },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [memberId, paused, highAccuracy])

  return { accuracy, error }
}
