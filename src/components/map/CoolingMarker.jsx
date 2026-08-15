import L from 'leaflet'
import { Check, Snowflake } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import Badge from '../Badge.jsx'
import Button from '../Button.jsx'

function createCoolingIcon(selected) {
  return L.divIcon({
    className: '',
    html: `
      <div class="cooling-marker ${selected ? 'cooling-marker-selected' : ''}" role="img" aria-hidden="true">
        <span class="cooling-marker-centre">⌂</span>
      </div>
    `,
    iconSize: selected ? [50, 50] : [44, 44],
    iconAnchor: selected ? [25, 44] : [22, 40],
    popupAnchor: [0, -38],
  })
}

export default function CoolingMarker({ place, selected, saved, onSelect, onSave, onViewInList }) {
  const { t } = useTranslation()
  const markerRef = useRef(null)
  const icon = useMemo(() => createCoolingIcon(selected), [selected])

  useEffect(() => {
    if (selected) markerRef.current?.openPopup()
  }, [selected])

  const facilities = [
    place.airConditioning && t('coolPlaces.facilities.airConditioning'),
    place.drinkingWater && t('coolPlaces.facilities.drinkingWater'),
    place.accessible && t('coolPlaces.facilities.accessible'),
    place.nearTransport && t('coolPlaces.facilities.nearTransport'),
    place.freeEntry && t('coolPlaces.facilities.freeEntry'),
  ].filter(Boolean)

  return (
    <Marker
      ref={markerRef}
      position={[place.latitude, place.longitude]}
      icon={icon}
      title={place.name}
      alt={t('coolPlaces.selectPlace', { name: place.name })}
      eventHandlers={{ click: () => onSelect(place.id) }}
      keyboard
    >
      <Popup>
        <div className="max-w-60 text-cocoa">
          <Badge tone="grey">{t('coolPlaces.demoLocation')}</Badge>
          <p className="mt-2 font-black">{place.name}</p>
          <p className="mt-1 text-sm">{place.type}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">{t('coolPlaces.hours', { hours: place.hours })}</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">{facilities.join(' · ')}</p>
          <div className="mt-3 grid gap-2">
            <Button variant={saved ? 'blue' : 'ghost'} onClick={() => onSave(place.id)}>
              {saved ? <Check className="size-4" /> : <Snowflake className="size-4" />}
              {saved ? t('actions.saved') : t('actions.save')}
            </Button>
            <Button variant="ghost" onClick={() => onViewInList(place.id)}>
              {t('actions.viewInList')}
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
