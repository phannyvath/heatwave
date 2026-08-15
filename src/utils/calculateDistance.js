const EARTH_RADIUS_KM = 6371

function toRadians(value) {
  return (value * Math.PI) / 180
}

export function calculateDistanceKm(from, to) {
  const latDelta = toRadians(to.lat - from.lat)
  const lngDelta = toRadians(to.lng - from.lng)
  const startLat = toRadians(from.lat)
  const endLat = toRadians(to.lat)

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatApproxDistance(from, to) {
  const distance = calculateDistanceKm(from, to)
  const walkingMinutes = Math.max(2, Math.round((distance / 4.8) * 60))
  return `${distance.toFixed(distance < 10 ? 1 : 0)} km · approximately ${walkingMinutes} min walk`
}
