import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import CoolingMarker from './CoolingMarker.jsx'
import MapBoundsController from './MapBoundsController.jsx'
import { createStudentIcon } from './mapIcons.js'

const MELBOURNE_CENTRE = {
  lat: -37.8136,
  lng: 144.9631,
}

const DEFAULT_ZOOM = 14

export default function CoolingMap({
  places,
  selectedId,
  selectedPlace,
  studentPosition,
  visible,
  isSaved,
  onSelect,
  onSave,
  onViewInList,
}) {
  const { t } = useTranslation()

  return (
    <div className="relative">
      <MapContainer
        center={[MELBOURNE_CENTRE.lat, MELBOURNE_CENTRE.lng]}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="heat-safe-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsController places={places} selectedPlace={selectedPlace} studentPosition={studentPosition} visible={visible} />
        {places.map((place) => (
          <CoolingMarker
            key={place.id}
            place={place}
            selected={selectedId === place.id}
            saved={isSaved(place.id)}
            onSelect={onSelect}
            onSave={onSave}
            onViewInList={onViewInList}
          />
        ))}
        {studentPosition && (
          <>
            <Circle
              center={[studentPosition.lat, studentPosition.lng]}
              radius={Math.min(studentPosition.accuracy || 250, 1000)}
              pathOptions={{ color: '#4B3428', fillColor: '#4B3428', fillOpacity: 0.08, weight: 1 }}
            />
            <Marker position={[studentPosition.lat, studentPosition.lng]} icon={createStudentIcon()} title={t('coolPlaces.yourLocation')}>
              <Popup>{t('coolPlaces.yourLocation')}</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
      <Badge className="pointer-events-none absolute left-3 top-3 z-[500]">{t('coolPlaces.prototypeMap')}</Badge>
      <div className="pointer-events-none absolute right-3 top-3 z-[500] rounded-full bg-white/95 px-3 py-1 text-xs font-black text-muted shadow-sm">
        {t('coolPlaces.distanceNote')}
      </div>
    </div>
  )
}

function Badge({ children, className = '' }) {
  return (
    <span className={`rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-danger shadow-sm ${className}`}>
      {children}
    </span>
  )
}
