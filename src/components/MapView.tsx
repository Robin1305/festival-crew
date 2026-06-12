import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useGroupStore } from '../store/group'
import { POI_ICONS } from '../data/southside'
import { haversineDistance, getBearing, getCompassDirection, formatDistance } from '../lib/group-code'

const STALE_MS = 5 * 60 * 1000

function makeFriendIcon(color: string, initial: string, stale: boolean, sos: boolean) {
  return L.divIcon({
    className: 'friend-marker',
    iconAnchor: [18, 18],
    html: `
      <div class="friend-dot ${stale ? 'stale' : ''} ${sos ? 'sos' : ''}" style="background:${sos ? '#dc2626' : color}">
        ${initial}
      </div>
      <div class="friend-name">${initial}</div>
    `,
  })
}

function makePoiIcon(emoji: string) {
  return L.divIcon({
    className: 'poi-marker',
    iconAnchor: [15, 15],
    html: `<div class="poi-dot">${emoji}</div>`,
  })
}

function makeMeetPinIcon() {
  return L.divIcon({
    className: 'meet-pin',
    iconAnchor: [16, 16],
    html: `<div class="meet-pin-inner">📍</div>`,
  })
}

interface MapViewProps {
  dropping: boolean
  onDrop: (lat: number, lng: number) => void
  onStopDropping: () => void
}

export function MapView({ dropping, onDrop, onStopDropping }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const accuracyRingsRef = useRef<Map<string, L.Circle>>(new Map())
  const poiMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const pinMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const [tracking, setTracking] = useState(false)

  const { session, members, pois, pins, setActiveSheet } = useGroupStore()

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    const map = L.map(mapRef.current, {
      zoomControl: false,
      doubleClickZoom: false,
      attributionControl: true,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    map.setView([47.9055, 8.834], 15)
    leafletRef.current = map

    return () => {
      map.remove()
      leafletRef.current = null
    }
  }, []) // eslint-disable-line

  // Drop-pin mode: tap map to place
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return

    if (!dropping) return

    const handler = (e: L.LeafletMouseEvent) => {
      onDrop(e.latlng.lat, e.latlng.lng)
      onStopDropping()
    }

    map.once('click', handler)
    return () => { map.off('click', handler) }
  }, [dropping, onDrop, onStopDropping])

  // Update friend markers
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return

    const now = Date.now()
    const existingIds = new Set(markersRef.current.keys())

    for (const m of members) {
      if (!m.lat || !m.lng) continue

      const stale = now - new Date(m.last_seen).getTime() > STALE_MS
      const initial = m.display_name[0].toUpperCase()
      const icon = makeFriendIcon(m.color, initial, stale, m.is_sos)
      const isMe = m.id === session?.memberId

      existingIds.delete(m.id)

      if (markersRef.current.has(m.id)) {
        const marker = markersRef.current.get(m.id)!
        marker.setLatLng([m.lat, m.lng])
        marker.setIcon(icon)
      } else {
        const marker = L.marker([m.lat, m.lng], { icon, zIndexOffset: isMe ? 1000 : 0 })
          .addTo(map)
          .bindTooltip(m.display_name, { permanent: false, direction: 'top' })

        if (!isMe) {
          marker.on('click', () => setActiveSheet('friend-detail', m.id))
        }

        markersRef.current.set(m.id, marker)
      }

      // Accuracy ring
      if (m.accuracy_m && m.accuracy_m > 30) {
        if (accuracyRingsRef.current.has(m.id)) {
          accuracyRingsRef.current.get(m.id)!.setLatLng([m.lat, m.lng]).setRadius(m.accuracy_m)
        } else {
          const ring = L.circle([m.lat, m.lng], {
            radius: m.accuracy_m,
            color: m.color,
            fillColor: m.color,
            fillOpacity: 0.08,
            weight: 1,
          }).addTo(map)
          accuracyRingsRef.current.set(m.id, ring)
        }
      } else {
        accuracyRingsRef.current.get(m.id)?.remove()
        accuracyRingsRef.current.delete(m.id)
      }
    }

    // Remove gone members
    for (const id of existingIds) {
      markersRef.current.get(id)?.remove()
      markersRef.current.delete(id)
      accuracyRingsRef.current.get(id)?.remove()
      accuracyRingsRef.current.delete(id)
    }
  }, [members, session?.memberId, setActiveSheet])

  // POI markers
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return

    const existingIds = new Set(poiMarkersRef.current.keys())

    for (const poi of pois) {
      existingIds.delete(poi.id)
      if (poiMarkersRef.current.has(poi.id)) continue

      const emoji = POI_ICONS[poi.icon] ?? '📍'
      const icon = makePoiIcon(emoji)
      const marker = L.marker([poi.lat, poi.lng], { icon, zIndexOffset: -100 })
        .addTo(map)
        .bindTooltip(poi.label, { permanent: false, direction: 'top' })
      poiMarkersRef.current.set(poi.id, marker)
    }

    for (const id of existingIds) {
      poiMarkersRef.current.get(id)?.remove()
      poiMarkersRef.current.delete(id)
    }
  }, [pois])

  // Meet-me pin markers
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return

    const now = Date.now()
    const existingIds = new Set(pinMarkersRef.current.keys())

    for (const pin of pins) {
      if (new Date(pin.expires_at).getTime() < now) continue
      existingIds.delete(pin.id)
      if (pinMarkersRef.current.has(pin.id)) continue

      const icon = makeMeetPinIcon()
      const marker = L.marker([pin.lat, pin.lng], { icon, zIndexOffset: 500 })
        .addTo(map)
        .bindTooltip(`${pin.label}`, { permanent: false, direction: 'top' })
      pinMarkersRef.current.set(pin.id, marker)
    }

    for (const id of existingIds) {
      pinMarkersRef.current.get(id)?.remove()
      pinMarkersRef.current.delete(id)
    }
  }, [pins])

  // Auto-fit to members on initial load
  const initialFit = useRef(false)
  useEffect(() => {
    const map = leafletRef.current
    if (!map || initialFit.current) return
    const located = members.filter((m) => m.lat && m.lng)
    if (located.length === 0) return
    initialFit.current = true
    const bounds = L.latLngBounds(located.map((m) => [m.lat!, m.lng!]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 })
  }, [members])

  // Tracking: keep map centered on me
  useEffect(() => {
    if (!tracking || !session) return
    const me = members.find((m) => m.id === session.memberId)
    if (me?.lat && me?.lng && leafletRef.current) {
      leafletRef.current.setView([me.lat, me.lng], leafletRef.current.getZoom())
    }
  }, [tracking, members, session])

  const locateMe = () => {
    const me = session && members.find((m) => m.id === session.memberId)
    if (me?.lat && me?.lng && leafletRef.current) {
      leafletRef.current.setView([me.lat, me.lng], 17)
    }
    setTracking((t) => !t)
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={mapRef} className="absolute inset-0" />

      {/* Locate-me button */}
      <button
        onClick={locateMe}
        className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-zinc-900/90 border border-zinc-700 text-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform z-10"
        title="Center on my location"
      >
        {tracking ? '🎯' : '⊕'}
      </button>
    </div>
  )
}

export function FriendDetailCard() {
  const { members, session, selectedMemberId, setActiveSheet } = useGroupStore()
  const me = session && members.find((m) => m.id === session.memberId)
  const friend = members.find((m) => m.id === selectedMemberId)

  if (!friend || !selectedMemberId) return null

  let distance: string | null = null
  let direction: string | null = null

  if (me?.lat && me?.lng && friend.lat && friend.lng) {
    const dist = haversineDistance(me.lat, me.lng, friend.lat, friend.lng)
    const bearing = getBearing(me.lat, me.lng, friend.lat, friend.lng)
    distance = formatDistance(dist)
    direction = getCompassDirection(bearing)
  }

  const lastSeen = new Date(friend.last_seen)
  const minAgo = Math.floor((Date.now() - lastSeen.getTime()) / 60000)

  return (
    <div
      className="absolute bottom-20 left-0 right-0 mx-4 rounded-2xl bg-zinc-900 border border-zinc-700 p-4 z-20 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg"
          style={{ background: friend.color }}
        >
          {friend.display_name[0].toUpperCase()}
        </div>
        <div>
          <div className="text-white font-semibold">{friend.display_name}</div>
          <div className="text-zinc-400 text-xs">
            {minAgo < 1 ? 'just now' : `${minAgo}m ago`}
          </div>
        </div>
        <button
          onClick={() => setActiveSheet('none')}
          className="ml-auto text-zinc-400 text-xl"
        >
          ×
        </button>
      </div>

      {distance && direction && (
        <div className="text-center py-2">
          <span className="text-2xl font-bold text-white">{distance}</span>
          <span className="text-zinc-400 ml-2">↗ {direction}</span>
        </div>
      )}

      {(!friend.lat || !friend.lng) && (
        <p className="text-zinc-500 text-sm text-center">Location not shared yet</p>
      )}
    </div>
  )
}
