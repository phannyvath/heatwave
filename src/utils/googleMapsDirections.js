export function googleMapsDirectionsUrl({ start, destination, method }) {
  const coordinates = place => Number.isFinite(place?.latitude) && Math.abs(place.latitude) <= 90 && Number.isFinite(place?.longitude) && Math.abs(place.longitude) <= 180 ? `${place.latitude},${place.longitude}` : null
  const end = coordinates(destination) || destination?.displayName || destination?.name
  if (!end) return null
  const params = new URLSearchParams({ api: '1', destination: end })
  const origin = coordinates(start)
  if (origin) params.set('origin', origin)
  const mode = { TRANSIT: 'transit', DRIVE: 'driving', WALK: 'walking', BICYCLE: 'bicycling' }[method]
  if (mode) params.set('travelmode', mode)
  return `https://www.google.com/maps/dir/?${params}`
}
