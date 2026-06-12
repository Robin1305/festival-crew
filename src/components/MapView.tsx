import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useGroupStore } from '../store/group'
import { POI_ICONS } from '../data/southside'
import { haversineDistance, getBearing, getCompassDirection, formatDistance } from '../lib/group-code'

const STALE_MS = 2 * 60 * 1000

function makeFriendIcon(color: string, initial: string, stale: boolean) {
  return L.divIcon({
    className: 'friend-marker',
    iconAnchor: [18, 30],
    html: `
      <div class="friend-dot ${stale ? 'stale' : ''}" style="background:${color}">${initial}</div>
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

function makeMeetPinIcon(label: string) {
  return L.divIcon({
    className: 'meet-pin',
    iconAnchor: [16, 16],
    html: `<div class="meet-pin-inner" title="${label}">📍</div>`,
  })
}

function getSpotSize(zoom: number): number {
  if (zoom <= 13) return 18
  if (zoom <= 15) return 24
  if (zoom <= 17) return 30
  return 36
}

function makeSpotIcon(emoji: string, color: string, size: number) {
  const half = size / 2
  return L.divIcon({
    className: '',
    iconAnchor: [half, half],
    iconSize: [size, size],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};border-radius:50%;
      border:2px solid rgba(255,255,255,0.9);
      display:flex;align-items:center;justify-content:center;
      font-size:${Math.round(size * 0.55)}px;line-height:1;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    ">${emoji}</div>`,
  })
}

export type DroppingMode = 'pin' | 'tent' | 'car' | null

const DROPPING_LABELS: Record<string, string> = {
  pin: 'Tap the map to place your pin',
  tent: 'Tap the map to place your tent ⛺',
  car: 'Tap the map to mark your car 🚗',
}

interface MapViewProps {
  droppingMode: DroppingMode
  onDropped: (lat: number, lng: number) => void
  onCancelDrop?: () => void
}

export function MapView({ droppingMode, onDropped }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const accuracyRingsRef = useRef<Map<string, L.Circle>>(new Map())
  const poiMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const pinMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const tentMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const carMarkersRef = useRef<Map<string, L.Marker>>(new Map())

  const { session, members, pois, pins, tents, cars, flyToTarget, clearFlyTo, setActiveSheet } = useGroupStore()

  // Init map + static zone overlay
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    const map = L.map(mapRef.current, {
      zoomControl: false,
      doubleClickZoom: false,
      attributionControl: true,
      maxZoom: 22,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxNativeZoom: 19,
      maxZoom: 22,
    }).addTo(map)

    map.setView([47.9055, 8.834], 15)
    leafletRef.current = map

    return () => {
      map.remove()
      leafletRef.current = null
    }
  }, []) // eslint-disable-line

  // flyTo from store
  useEffect(() => {
    if (!flyToTarget || !leafletRef.current) return
    leafletRef.current.setView(flyToTarget, 17, { animate: true })
    clearFlyTo()
  }, [flyToTarget, clearFlyTo])

  // Drop mode: one handler for all modes
  useEffect(() => {
    const map = leafletRef.current
    if (!map || !droppingMode) return
    const handler = (e: L.LeafletMouseEvent) => {
      onDropped(e.latlng.lat, e.latlng.lng)
    }
    map.once('click', handler)
    return () => { map.off('click', handler) }
  }, [droppingMode, onDropped])

  // Friend markers
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return
    const now = Date.now()
    const existingIds = new Set(markersRef.current.keys())

    for (const m of members) {
      if (!m.lat || !m.lng) continue
      const stale = now - new Date(m.last_seen).getTime() > STALE_MS
      const icon = makeFriendIcon(m.color, m.display_name[0].toUpperCase(), stale)
      const isMe = m.id === session?.memberId
      existingIds.delete(m.id)

      if (markersRef.current.has(m.id)) {
        const marker = markersRef.current.get(m.id)!
        marker.setLatLng([m.lat, m.lng]).setIcon(icon)
      } else {
        const marker = L.marker([m.lat, m.lng], { icon, zIndexOffset: isMe ? 1000 : 0 }).addTo(map)
        if (!isMe) marker.on('click', () => setActiveSheet('friend-detail', m.id))
        markersRef.current.set(m.id, marker)
      }

      if (m.accuracy_m && m.accuracy_m > 30) {
        if (accuracyRingsRef.current.has(m.id)) {
          accuracyRingsRef.current.get(m.id)!.setLatLng([m.lat, m.lng]).setRadius(m.accuracy_m)
        } else {
          const ring = L.circle([m.lat, m.lng], { radius: m.accuracy_m, color: m.color, fillColor: m.color, fillOpacity: 0.08, weight: 1 }).addTo(map)
          accuracyRingsRef.current.set(m.id, ring)
        }
      } else {
        accuracyRingsRef.current.get(m.id)?.remove()
        accuracyRingsRef.current.delete(m.id)
      }
    }

    for (const id of existingIds) {
      markersRef.current.get(id)?.remove(); markersRef.current.delete(id)
      accuracyRingsRef.current.get(id)?.remove(); accuracyRingsRef.current.delete(id)
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
      const marker = L.marker([poi.lat, poi.lng], { icon: makePoiIcon(emoji), zIndexOffset: -100 })
        .addTo(map).bindTooltip(poi.label, { direction: 'top' })
      poiMarkersRef.current.set(poi.id, marker)
    }
    for (const id of existingIds) { poiMarkersRef.current.get(id)?.remove(); poiMarkersRef.current.delete(id) }
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
      const marker = L.marker([pin.lat, pin.lng], { icon: makeMeetPinIcon(pin.label), zIndexOffset: 500 })
        .addTo(map).bindTooltip(pin.label, { direction: 'top' })
      pinMarkersRef.current.set(pin.id, marker)
    }
    for (const id of existingIds) { pinMarkersRef.current.get(id)?.remove(); pinMarkersRef.current.delete(id) }
  }, [pins])

  // Tent markers
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return
    const zoom = map.getZoom() ?? 15
    const existingIds = new Set(tentMarkersRef.current.keys())
    for (const tent of tents) {
      existingIds.delete(tent.id)
      const icon = makeSpotIcon('⛺', tent.color, getSpotSize(zoom))
      if (tentMarkersRef.current.has(tent.id)) {
        tentMarkersRef.current.get(tent.id)!.setLatLng([tent.lat, tent.lng]).setIcon(icon)
      } else {
        const owner = members.find((m) => m.id === tent.member_id)
        const marker = L.marker([tent.lat, tent.lng], { icon, zIndexOffset: 200 })
          .addTo(map)
          .bindPopup(`<b style="font-size:14px">${tent.name}</b><br><span style="color:#555;font-size:12px">${owner?.display_name ?? '?'}'s tent</span>`)
        tentMarkersRef.current.set(tent.id, marker)
      }
    }
    for (const id of existingIds) { tentMarkersRef.current.get(id)?.remove(); tentMarkersRef.current.delete(id) }
  }, [tents, members])

  // Car markers
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return
    const zoom = map.getZoom() ?? 15
    const existingIds = new Set(carMarkersRef.current.keys())
    for (const car of cars) {
      existingIds.delete(car.id)
      const icon = makeSpotIcon('🚗', car.color, getSpotSize(zoom))
      if (carMarkersRef.current.has(car.id)) {
        carMarkersRef.current.get(car.id)!.setLatLng([car.lat, car.lng]).setIcon(icon)
      } else {
        const owner = members.find((m) => m.id === car.member_id)
        const marker = L.marker([car.lat, car.lng], { icon, zIndexOffset: 200 })
          .addTo(map)
          .bindPopup(`<b style="font-size:14px">${car.name}</b><br><span style="color:#555;font-size:12px">${owner?.display_name ?? '?'}'s car</span>`)
        carMarkersRef.current.set(car.id, marker)
      }
    }
    for (const id of existingIds) { carMarkersRef.current.get(id)?.remove(); carMarkersRef.current.delete(id) }
  }, [cars, members])

  // Scale spot markers on zoom
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return
    const handler = () => {
      const zoom = map.getZoom()
      for (const [id, marker] of tentMarkersRef.current) {
        const t = tents.find((x) => x.id === id)
        if (t) marker.setIcon(makeSpotIcon('⛺', t.color, getSpotSize(zoom)))
      }
      for (const [id, marker] of carMarkersRef.current) {
        const c = cars.find((x) => x.id === id)
        if (c) marker.setIcon(makeSpotIcon('🚗', c.color, getSpotSize(zoom)))
      }
    }
    map.on('zoomend', handler)
    return () => { map.off('zoomend', handler) }
  }, [tents, cars])

  // Auto-fit to members on first load
  const initialFit = useRef(false)
  useEffect(() => {
    const map = leafletRef.current
    if (!map || initialFit.current) return
    const located = members.filter((m) => m.lat && m.lng)
    if (located.length === 0) return
    initialFit.current = true
    map.fitBounds(L.latLngBounds(located.map((m) => [m.lat!, m.lng!])), { padding: [60, 60], maxZoom: 17 })
  }, [members])

  const locateMe = () => {
    const me = session && members.find((m) => m.id === session.memberId)
    if (me?.lat && me?.lng && leafletRef.current) {
      leafletRef.current.setView([me.lat, me.lng], 17, { animate: true })
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={mapRef} className="absolute inset-0" />

      {droppingMode && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-900/90 text-amber-200 text-sm font-medium px-4 py-2 rounded-full z-10 shadow-lg pointer-events-none"
        >
          {DROPPING_LABELS[droppingMode]}
        </div>
      )}

      <button
        onClick={locateMe}
        className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white/90 border border-zinc-200 text-zinc-600 flex items-center justify-center shadow-lg active:scale-95 transition-all z-10"
        title="Center on my location"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M12 2L4 20l8-4 8 4L12 2z" />
        </svg>
      </button>
    </div>
  )
}

export function FriendDetailCard() {
  const { members, session, selectedMemberId, setActiveSheet, flyTo } = useGroupStore()
  const me = session && members.find((m) => m.id === session.memberId)
  const friend = members.find((m) => m.id === selectedMemberId)

  useEffect(() => {
    if (friend?.lat && friend?.lng) flyTo(friend.lat, friend.lng)
  }, [selectedMemberId]) // eslint-disable-line

  if (!friend || !selectedMemberId) return null

  const stale = Date.now() - new Date(friend.last_seen).getTime() > STALE_MS
  const minAgo = Math.floor((Date.now() - new Date(friend.last_seen).getTime()) / 60000)

  let distance: string | null = null
  let direction: string | null = null
  if (me?.lat && me?.lng && friend.lat && friend.lng) {
    distance = formatDistance(haversineDistance(me.lat, me.lng, friend.lat, friend.lng))
    direction = getCompassDirection(getBearing(me.lat, me.lng, friend.lat, friend.lng))
  }

  return (
    <div className="absolute bottom-24 left-4 right-4 rounded-2xl bg-zinc-900 border border-zinc-700 p-4 z-20 shadow-xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl shrink-0 ${stale ? 'opacity-50' : ''}`} style={{ background: friend.color }}>
          {friend.display_name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-white font-semibold text-lg">{friend.display_name}</div>
          <div className={`text-xs ${stale ? 'text-red-400' : 'text-green-400'}`}>
            {stale ? `offline · ${minAgo}m ago` : minAgo < 1 ? 'online now' : `${minAgo}m ago`}
          </div>
        </div>
        <button onClick={() => setActiveSheet('none')} className="text-zinc-400 text-2xl w-10 h-10 flex items-center justify-center">×</button>
      </div>
      {distance && direction ? (
        <div className="bg-zinc-800 rounded-xl p-3 text-center">
          <span className="text-3xl font-bold text-white">{distance}</span>
          <span className="text-zinc-400 ml-2 text-lg">↗ {direction}</span>
        </div>
      ) : (
        <p className="text-zinc-500 text-sm text-center py-2">Location not shared yet</p>
      )}
    </div>
  )
}
