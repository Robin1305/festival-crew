// Southside Festival 2026 — Take-Off GewerbePark, Neuhausen ob Eck
// POI coordinates approximated from official festival grounds map.
// Zone polygons are rough estimates — calibrate at the venue.

export const SOUTHSIDE_CENTER: [number, number] = [47.9055, 8.834]

export const SOUTHSIDE_POIS = [
  { label: 'Green Stage', icon: 'stage', lat: 47.9062, lng: 8.833 },
  { label: 'Blue Stage', icon: 'stage', lat: 47.9055, lng: 8.836 },
  { label: 'Red Stage', icon: 'stage', lat: 47.904, lng: 8.831 },
  { label: 'White Stage', icon: 'stage', lat: 47.9048, lng: 8.838 },
  { label: 'Electric Wave X', icon: 'stage', lat: 47.9035, lng: 8.834 },
  { label: 'West Entrance', icon: 'entrance', lat: 47.9068, lng: 8.828 },
  { label: 'East Entrance', icon: 'entrance', lat: 47.9068, lng: 8.842 },
  { label: 'Erste Hilfe / First Aid', icon: 'medical', lat: 47.905, lng: 8.834 },
  { label: 'Info Point', icon: 'info', lat: 47.9065, lng: 8.832 },
  { label: 'Toiletten (Infield)', icon: 'toilet', lat: 47.9058, lng: 8.8355 },
  { label: 'Toiletten (Camping)', icon: 'toilet', lat: 47.9085, lng: 8.827 },
  { label: 'Toiletten (Parking)', icon: 'toilet', lat: 47.9015, lng: 8.831 },
  { label: 'Duschen', icon: 'shower', lat: 47.908, lng: 8.829 },
  { label: 'Trinkwasser', icon: 'water', lat: 47.907, lng: 8.831 },
  { label: 'Camping Outfield', icon: 'camping', lat: 47.9025, lng: 8.83 },
]

export const POI_ICONS: Record<string, string> = {
  stage: '🎵',
  entrance: '🚪',
  medical: '🏥',
  info: 'ℹ️',
  camping: '⛺',
  bar: '🍺',
  toilet: '🚻',
  shower: '🚿',
  water: '💧',
  food: '🍔',
  custom: '📍',
}

