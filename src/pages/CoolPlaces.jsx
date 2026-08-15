import { useMemo, useRef, useState } from 'react'
import { Check, Droplets, ExternalLink, List, LocateFixed, Map as MapIcon, Snowflake, Train, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import CoolingMap from '../components/map/CoolingMap.jsx'
import { coolingPlaceFilters, demoCoolingPlaces } from '../data/demoCoolingPlaces.js'
import { useSavedCoolingPlaces } from '../hooks/useSavedCoolingPlaces.js'
import { useLocation as useStudentLocation } from '../hooks/useLocation.js'
import { formatApproxDistance } from '../utils/calculateDistance.js'

const MELBOURNE_CENTRE = { lat: -37.8136, lng: 144.9631 }

function PlaceCard({ place, selected, saved, distanceText, onSelect, onSave, onDirections, compact = false }) {
  const { t } = useTranslation()
  const Icon = place.icon
  const features = [
    ['airConditioning', 'airConditioning', Snowflake],
    ['drinkingWater', 'water', Droplets],
    ['accessible', 'accessible', Check],
    ['nearTransport', 'transport', Train],
  ]

  return (
    <Card className={`p-5 transition ${selected ? 'border-ocean bg-skysoft ring-2 ring-orange-100' : ''} ${compact ? 'min-w-[min(19rem,82vw)] snap-start' : ''}`}>
      <button type="button" className="w-full text-left focus:outline-none focus:ring-2 focus:ring-ocean" onClick={onSelect}>
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-ocean shadow-sm">
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 overflow-wrap-anywhere text-lg font-black text-navy">{place.name}</h2>
              <Badge tone={place.openNow ? 'safe' : 'grey'}>{place.openNow ? t('coolPlaces.openNow') : t('coolPlaces.closed')}</Badge>
              <Badge tone="grey">{t('coolPlaces.demo')}</Badge>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500">{place.type} · {distanceText}</p>
            <p className="mt-2 text-sm text-slate-600">{t('coolPlaces.hours', { hours: place.hours })}</p>
          </div>
        </div>
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {features.map(([key, labelKey, FeatureIcon]) => (
          <span key={key} className="flex items-center gap-2 rounded-full bg-cream px-3 py-2 text-xs font-bold text-slate-700">
            <FeatureIcon className={`size-4 ${place[key] ? 'text-ocean' : 'text-slate-300'}`} />
            {t(`coolPlaces.facilities.${labelKey}`)}
          </span>
        ))}
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button variant={saved ? 'blue' : 'ghost'} onClick={onSave}>
          {saved ? <Check className="size-4 fill-current" /> : <Snowflake className="size-4" />}
          {saved ? t('actions.saved') : t('actions.save')}
        </Button>
        <Button variant="primary" onClick={onDirections}>
          <ExternalLink className="size-4" />
          {t('actions.getDirections')}
        </Button>
      </div>
    </Card>
  )
}

export default function CoolPlaces() {
  const { t } = useTranslation()
  const [view, setView] = useState('map')
  const [filters, setFilters] = useState(['openNow'])
  const [selectedId, setSelectedId] = useState(demoCoolingPlaces[0].id)
  const [directionsPlace, setDirectionsPlace] = useState(null)
  const [toast, setToast] = useState('')
  const { savedPlaceIds, isSaved, toggleSavedPlace } = useSavedCoolingPlaces()
  const { location, requestCurrentLocation, status: locationStatus, error: locationError } = useStudentLocation()
  const cardRefs = useRef({})

  const studentPosition = location?.source === 'gps' ? { lat: location.latitude, lng: location.longitude, accuracy: location.accuracy } : null
  const distanceOrigin = studentPosition || MELBOURNE_CENTRE

  const placesWithDistance = useMemo(
    () =>
      demoCoolingPlaces.map((place) => ({
        ...place,
        distanceText: formatApproxDistance(distanceOrigin, { lat: place.latitude, lng: place.longitude }),
      })),
    [distanceOrigin],
  )

  const places = useMemo(
    () =>
      placesWithDistance.filter((place) =>
        filters.every((filter) => (filter === 'saved' ? savedPlaceIds.includes(place.id) : Boolean(place[filter]))),
      ),
    [filters, placesWithDistance, savedPlaceIds],
  )

  const selectedPlace = places.find((place) => place.id === selectedId) || places[0] || null

  function toggleFilter(filter) {
    setFilters(filters.includes(filter) ? filters.filter((entry) => entry !== filter) : [...filters, filter])
  }

  function handleSave(id) {
    const nowSaved = toggleSavedPlace(id)
    if (nowSaved) {
      setToast(t('coolPlaces.savedToast'))
      window.setTimeout(() => setToast(''), 1800)
    }
  }

  function selectPlace(id) {
    setSelectedId(id)
    window.setTimeout(() => {
      cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }, 80)
  }

  function openDirections() {
    if (!directionsPlace) return
    window.open(
      `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=;${directionsPlace.latitude},${directionsPlace.longitude}`,
      '_blank',
      'noopener,noreferrer',
    )
    setDirectionsPlace(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Badge tone="navy">{t('coolPlaces.badge')}</Badge>
          <h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">{t('coolPlaces.title')}</h1>
          <p className="mt-2 text-slate-600">{t('coolPlaces.description')}</p>
        </div>
        <div className="inline-grid grid-cols-2 rounded-full border border-orange-100 bg-white p-1">
          <button
            className={`flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${view === 'map' ? 'bg-navy text-white' : 'text-slate-600'}`}
            onClick={() => setView('map')}
            aria-pressed={view === 'map'}
          >
            <MapIcon className="size-4" /> {t('coolPlaces.map')}
          </button>
          <button
            className={`flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${view === 'list' ? 'bg-navy text-white' : 'text-slate-600'}`}
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
          >
            <List className="size-4" /> {t('coolPlaces.list')}
          </button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" aria-label={t('coolPlaces.filtersLabel')}>
            {coolingPlaceFilters.map((filter) => (
              <button
                key={filter.id}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${
                  filters.includes(filter.id) ? 'border-ocean bg-skysoft text-navy' : 'border-orange-100 text-slate-600 hover:bg-cream'
                }`}
                onClick={() => toggleFilter(filter.id)}
                aria-pressed={filters.includes(filter.id)}
              >
                {t(`coolPlaces.filters.${filter.id}`)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="grey">{t('coolPlaces.results', { count: places.length })}</Badge>
            {filters.length > 0 && (
              <Button variant="ghost" onClick={() => setFilters([])}>
                <X className="size-4" />
                {t('actions.clearFilters')}
              </Button>
            )}
            <Button variant="ghost" onClick={requestCurrentLocation}>
              <LocateFixed className="size-4" />
              {locationStatus === 'requesting' ? t('actions.checking') : t('actions.useMyLocation')}
            </Button>
          </div>
        </div>
      </Card>

      {locationStatus === 'denied' && (
        <p className="rounded-2xl bg-orange-50 p-4 text-sm font-bold text-danger">
          {locationError || t('coolPlaces.locationDenied')}
        </p>
      )}

      {view === 'map' && (
        <>
          <CoolingMap
            places={places}
            selectedId={selectedPlace?.id || ''}
            selectedPlace={selectedPlace}
            studentPosition={studentPosition}
            visible={view === 'map'}
            isSaved={isSaved}
            onSelect={selectPlace}
            onSave={handleSave}
            onViewInList={selectPlace}
          />
          <p className="text-xs font-bold leading-5 text-muted">{t('coolPlaces.disclaimer')}</p>
        </>
      )}

      {places.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-lg font-black text-navy">{t('coolPlaces.emptyTitle')}</p>
          <p className="mt-2 text-slate-600">{t('coolPlaces.emptyBody')}</p>
        </Card>
      ) : view === 'map' ? (
        <>
          <div className="flex snap-x gap-4 overflow-x-auto pb-2 lg:hidden">
            {places.map((place) => (
              <div key={place.id} ref={(node) => { cardRefs.current[place.id] = node }}>
                <PlaceCard
                  place={place}
                  selected={selectedPlace?.id === place.id}
                  saved={isSaved(place.id)}
                  distanceText={place.distanceText}
                  onSelect={() => selectPlace(place.id)}
                  onSave={() => handleSave(place.id)}
                  onDirections={() => setDirectionsPlace(place)}
                  compact
                />
              </div>
            ))}
          </div>
          <div className="hidden gap-4 lg:grid lg:grid-cols-2">
            {places.map((place) => (
              <div key={place.id} ref={(node) => { cardRefs.current[place.id] = node }}>
                <PlaceCard
                  place={place}
                  selected={selectedPlace?.id === place.id}
                  saved={isSaved(place.id)}
                  distanceText={place.distanceText}
                  onSelect={() => selectPlace(place.id)}
                  onSave={() => handleSave(place.id)}
                  onDirections={() => setDirectionsPlace(place)}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {places.map((place) => (
            <div key={place.id} ref={(node) => { cardRefs.current[place.id] = node }}>
              <PlaceCard
                place={place}
                selected={selectedPlace?.id === place.id}
                saved={isSaved(place.id)}
                distanceText={place.distanceText}
                onSelect={() => selectPlace(place.id)}
                onSave={() => handleSave(place.id)}
                onDirections={() => setDirectionsPlace(place)}
              />
            </div>
          ))}
        </div>
      )}

      {toast && <p className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-navy px-4 py-2 text-sm font-black text-white shadow-soft">{toast}</p>}

      {directionsPlace && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa/40 px-4">
          <Card className="max-w-sm p-5">
            <h2 className="text-xl font-black text-navy">{t('coolPlaces.directionsTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{t('coolPlaces.directionsBody')}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="ghost" onClick={() => setDirectionsPlace(null)}>
                {t('actions.cancel')}
              </Button>
              <Button onClick={openDirections}>
                <ExternalLink className="size-4" />
                {t('actions.previewDirections')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
