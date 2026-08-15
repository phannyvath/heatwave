import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export default function MapBoundsController({ places, selectedPlace, studentPosition, visible }) {
  const map = useMap()

  useEffect(() => {
    if (!visible) return undefined
    const timeout = window.setTimeout(() => map.invalidateSize(), 80)
    return () => window.clearTimeout(timeout)
  }, [map, visible])

  useEffect(() => {
    if (!places.length) return
    const points = places.map((place) => [place.latitude, place.longitude])
    if (studentPosition) points.push([studentPosition.lat, studentPosition.lng])
    if (points.length === 1) {
      map.setView(points[0], Math.min(map.getZoom(), 14))
      return
    }
    map.fitBounds(points, { padding: [32, 32], maxZoom: 15 })
  }, [map, places, studentPosition])

  useEffect(() => {
    if (selectedPlace) {
      map.setView([selectedPlace.latitude, selectedPlace.longitude], Math.max(map.getZoom(), 15), { animate: true })
    }
  }, [map, selectedPlace])

  return null
}
