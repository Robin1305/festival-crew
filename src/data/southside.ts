// Southside Festival 2026 — Take-Off GewerbePark, Neuhausen ob Eck
// Coordinates approximated from official festival grounds map:
// southside.de/en/info/site-maps/

export const SOUTHSIDE_CENTER: [number, number] = [47.9055, 8.834]

export const SOUTHSIDE_POIS = [
  { label: 'Green Stage', icon: 'stage', lat: 47.9062, lng: 8.833 },
  { label: 'Blue Stage', icon: 'stage', lat: 47.9055, lng: 8.836 },
  { label: 'Red Stage', icon: 'stage', lat: 47.904, lng: 8.831 },
  { label: 'White Stage', icon: 'stage', lat: 47.9048, lng: 8.838 },
  { label: 'Electric Wave X', icon: 'stage', lat: 47.9035, lng: 8.834 },
  { label: 'West Entrance', icon: 'entrance', lat: 47.9068, lng: 8.828 },
  { label: 'East Entrance', icon: 'entrance', lat: 47.9068, lng: 8.842 },
  { label: 'Medical / First Aid', icon: 'medical', lat: 47.905, lng: 8.834 },
  { label: 'Info Point', icon: 'info', lat: 47.9065, lng: 8.832 },
  { label: 'Camping (Outfield)', icon: 'camping', lat: 47.9025, lng: 8.83 },
]

export const POI_ICONS: Record<string, string> = {
  stage: '🎵',
  entrance: '🚪',
  medical: '🏥',
  info: 'ℹ️',
  camping: '⛺',
  bar: '🍺',
  toilet: '🚽',
  food: '🍔',
  custom: '📍',
}
