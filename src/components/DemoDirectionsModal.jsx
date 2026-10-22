import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bike, Car, Footprints, MapPin, Train, X } from 'lucide-react'
import { CircleMarker, ImageOverlay, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import Button from './Button.jsx'
import MapsDirectionsLink from './MapsDirectionsLink.jsx'
import { demoMapBounds, demoRoute, demoTravelModes } from '../data/demoDirections.js'

const icons = { walking: Footprints, transit: Train, driving: Car, cycling: Bike }
const routeStyle = { color: '#a34f1b', weight: 7, opacity: 1 }

function FitDemoRoute() {
  const map = useMap()
  useEffect(() => {
    const fit = () => {
      map.invalidateSize()
      map.fitBounds(demoRoute, { paddingTopLeft: [45, 60], paddingBottomRight: [45, 65], maxZoom: 16, animate: false })
    }
    const observer = new ResizeObserver(fit)
    observer.observe(map.getContainer())
    const frame = requestAnimationFrame(fit)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [map])
  return null
}

function DemoMap({ destination, mode }) {
  const [fallback, setFallback] = useState(false)
  const loaded = useRef(false)
  useEffect(() => {
    const timer = setTimeout(() => { if (!loaded.current) setFallback(true) }, 7000)
    return () => clearTimeout(timer)
  }, [])
  const firstStop = [-37.80982, 144.96209]
  const lastStop = [-37.81232, 144.96175]
  return <div>
    <div className="demo-directions-map-frame" role="region" aria-label={`Demo route map to ${destination}`}>
      <MapContainer center={demoRoute[0]} zoom={15} minZoom={13} maxZoom={18} className="demo-directions-map" scrollWheelZoom>
        <ImageOverlay pane="tilePane" zIndex={1} url="/maps/demo-streets.svg" bounds={demoMapBounds} attribution="HeatSafe demo illustration" />
        {!fallback && <TileLayer zIndex={2} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{ tileload: () => { loaded.current = true }, tileerror: () => setFallback(true) }} />}
        <FitDemoRoute />
        <Polyline positions={demoRoute} pathOptions={{ color: '#fff', weight: 12 }} />
        {mode === 'transit' ? <>
          <Polyline positions={[demoRoute[0], firstStop]} pathOptions={{ ...routeStyle, dashArray: '4 10' }} />
          <Polyline positions={[firstStop, demoRoute[1], demoRoute[2], lastStop]} pathOptions={routeStyle} />
          <Polyline positions={[lastStop, demoRoute[3]]} pathOptions={{ ...routeStyle, dashArray: '4 10' }} />
          {[firstStop, lastStop].map((stop, index) => <CircleMarker key={index} center={stop} radius={6} pathOptions={{ color: '#4b3428', fillColor: '#fff', fillOpacity: 1 }}><Tooltip>Demo stop</Tooltip></CircleMarker>)}
        </> : <Polyline positions={demoRoute} pathOptions={routeStyle} />}
        <CircleMarker center={demoRoute[0]} radius={10} pathOptions={{ color: '#fff', weight: 3, fillColor: '#4b3428', fillOpacity: 1 }}>
          <Tooltip permanent direction="top" className="demo-map-label">Your location (demo)</Tooltip>
        </CircleMarker>
        <CircleMarker center={demoRoute.at(-1)} radius={11} pathOptions={{ color: '#4b3428', weight: 3, fillColor: '#f47b20', fillOpacity: 1 }}>
          <Tooltip permanent direction="bottom" className="demo-map-label">{destination}</Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
    <p className="mt-2 text-sm text-muted" role="status">{fallback ? 'Map tiles unavailable. Showing a local demo street illustration.' : 'Fixed demo route · Melbourne CBD'}{mode === 'transit' && ' · Dashed sections: short walks'}</p>
  </div>
}

export default function DemoDirectionsModal({ destination, plan, departureTime, onClose, onSave }) {
  const [mode, setMode] = useState(() => ({ WALK: 'walking', TRANSIT: 'transit', DRIVE: 'driving', BICYCLE: 'cycling' }[plan?.form.method] || 'walking'))
  const [departure, setDeparture] = useState(() => {
    const date = new Date(departureTime || Date.now() + 20 * 60000)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace(/:00$/, '')
  })
  const [error, setError] = useState('')
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const id = useId()
  const selected = demoTravelModes[mode]
  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    const dialog = dialogRef.current
    dialog.showModal()
    closeRef.current.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
      else document.querySelector('[data-reminder-bell]')?.focus()
    }
  }, [])
  return createPortal(
    <dialog ref={dialogRef} className="demo-directions-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-notice`}
      onCancel={(event) => { event.preventDefault(); onClose() }}>
      <div className="space-y-5 p-4 sm:p-7">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-extrabold text-danger">Demo directions</p>
            <h2 id={`${id}-title`} className="mt-1 text-2xl font-black text-navy overflow-wrap-anywhere">Directions to {destination.name}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close demo directions" className="grid size-12 shrink-0 place-items-center rounded-full border border-orange-200 bg-white text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-ocean"><X aria-hidden="true" /></button>
        </header>
        <p id={`${id}-notice`} className="rounded-2xl bg-skysoft p-3 font-semibold text-navy">Sample route and travel times for demonstration only. Not for navigation.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block font-bold">Starting point<input readOnly value="Your location (demo)" className="mt-1 w-full rounded-xl border border-orange-200 bg-white p-3 text-navy" /></label>
          <label className="block font-bold">Destination<input readOnly value={destination.name} title={destination.name} className="mt-1 w-full rounded-xl border border-orange-200 bg-white p-3 text-navy" /></label>
        </div>
        <div role="group" aria-label="Transport options" className="grid gap-2 sm:grid-cols-3">
          {Object.entries(demoTravelModes).filter(([key]) => key !== 'cycling' || plan?.form.method === 'BICYCLE').map(([key, option]) => {
            const Icon = icons[key]
            return <button type="button" key={key} aria-pressed={mode === key} onClick={() => setMode(key)} className={`demo-transport-option ${mode === key ? 'is-selected' : ''}`}>
              <span className="flex items-center gap-2 font-extrabold"><Icon size={22} aria-hidden="true" />{option.label}</span>
              <span className="block mt-1">Approx. {option.time}</span>
              <span className="block text-sm">{option.distance}</span>
            </button>
          })}
        </div>
        <MapsDirectionsLink start={plan?.places.start} destination={destination} method={{ walking: 'WALK', transit: 'TRANSIT', driving: 'DRIVE', cycling: 'BICYCLE' }[mode]} />
        <DemoMap destination={destination.name} mode={mode} />
        <section aria-live="polite" aria-atomic="true" className="rounded-2xl border border-orange-200 bg-white p-4">
          <h3 className="flex items-center gap-2 text-lg font-extrabold"><MapPin aria-hidden="true" size={22} />Sample journey · {selected.label}</h3>
          <p className="mt-2 font-bold">Approximately {selected.time} · {selected.distance}</p>
          <p className="mt-2 leading-7">{selected.journey} {destination.name}.</p>
        </section>
        {onSave && <form className="space-y-3 rounded-2xl border border-orange-200 bg-white p-4" onSubmit={event => {
          event.preventDefault()
          const method = { walking: 'WALK', transit: 'TRANSIT', driving: 'DRIVE', cycling: 'BICYCLE' }[mode]
          const updated = { ...plan, id: JSON.stringify([plan.places.start.name, destination.name, method]), form: { ...plan.form, method } }
          setError(onSave(updated, new Date(departure).getTime()))
        }}>
          <label className="block font-bold" htmlFor={`${id}-departure`}>Departure date and time</label>
          <input id={`${id}-departure`} type="datetime-local" required step="1" value={departure} onChange={event => { setDeparture(event.target.value); setError('') }} aria-invalid={Boolean(error)} aria-describedby={`${id}-time-note ${id}-error`} className="block w-full min-w-0 rounded-xl border border-orange-200 p-3" />
          <p id={`${id}-time-note`} className="text-sm text-muted">Local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Notifications are enabled by default; manage them in the bell.</p>
          <p id={`${id}-error`} role="alert" className="font-bold text-danger">{error}</p>
          <Button type="submit" className="text-base">Set departure time</Button>
        </form>}
        <div className="flex justify-end"><Button onClick={onClose} className="text-base">Close directions</Button></div>
      </div>
    </dialog>, document.body,
  )
}
