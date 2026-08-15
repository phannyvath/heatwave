import L from 'leaflet'

export function createStudentIcon() {
  return L.divIcon({
    className: '',
    html: '<div class="student-location-marker" role="img" aria-hidden="true"><span></span></div>',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  })
}
