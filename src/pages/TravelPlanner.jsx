import { useState } from 'react'
import { Navigation } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import LocationAutocomplete from '../components/LocationAutocomplete.jsx'
import { useDepartureReminders } from '../context/DepartureReminders.jsx'
import { recommendationModes } from '../utils/demoRecommendation.js'
import { createDeparturePlan } from '../utils/departureForecast.js'
import { isSelectedPlace } from '../services/placesService.js'

export default function TravelPlanner() {
  const { t } = useTranslation()
  const { latestPlan, viewPlan } = useDepartureReminders()
  const previous = latestPlan?.places
  const [places, setPlaces] = useState(() => ({ start: isSelectedPlace(previous?.start) ? previous.start : null, destination: isSelectedPlace(previous?.destination) ? previous.destination : null }))
  const [text, setText] = useState(() => ({ start: places.start?.displayName || '', destination: places.destination?.displayName || '' }))
  const [departure, setDeparture] = useState(() => latestPlan?.form.departure || '')
  const [method, setMethod] = useState(() => recommendationModes[latestPlan?.form.method] ? latestPlan.form.method : 'WALK')
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    if (!isSelectedPlace(places.start) || !isSelectedPlace(places.destination)) { setError('Choose your starting location and destination from the suggestions.'); return }
    try {
      const plan = createDeparturePlan({ destination: places.destination, start: places.start, method, departure })
      setError('')
      viewPlan(plan, undefined, setDeparture)
    } catch (failure) { setError(failure.message) }
  }
  return <div className="space-y-5">
    <div><Badge tone="high">{t('travel.badge')}</Badge><h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">{t('travel.title')}</h1><p className="mt-2 text-slate-600">Choose your journey and departure time to compare the temperature forecast at your starting location.</p></div>
    <Card className="w-full p-5 sm:p-6">
      <form className="space-y-4" onSubmit={submit}>
        <p id="journey-location-help" className="text-sm text-muted">Choose your starting location and destination from the suggestions. The recommendation uses the forecast at your starting location.</p>
        {['start', 'destination'].map(key => <LocationAutocomplete key={key} label={t(`travel.${key}`)} value={text[key]} selection={places[key]} required invalid={Boolean(error) && !isSelectedPlace(places[key])} helperId="journey-location-help"
          onChange={value => { setText(previous => ({ ...previous, [key]: value })); setPlaces(previous => ({ ...previous, [key]: null })) }}
          onSelect={place => { setText(previous => ({ ...previous, [key]: place.displayName })); setPlaces(previous => ({ ...previous, [key]: place })); setError('') }} />)}
        <label className="block font-bold">Departure date and time
          <input type="datetime-local" required step="1" value={departure} onChange={event => { setDeparture(event.target.value); setError('') }} aria-describedby="departure-time-help" className="mt-2 block w-full min-w-0 rounded-2xl border border-orange-200 bg-white p-3 focus:outline focus:outline-2 focus:outline-ocean" />
        </label>
        <p id="departure-time-help" className="text-sm text-muted">Local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        <div className="font-bold"><label htmlFor="travel-transportation">Transportation</label>
          <select id="travel-transportation" value={method} onChange={event => { setMethod(event.target.value); setError('') }} className="mt-2 block w-full rounded-2xl border border-orange-200 bg-white p-3 focus:outline focus:outline-2 focus:outline-ocean">
            {Object.entries(recommendationModes).map(([key, estimate]) => <option key={key} value={key}>{estimate.label}</option>)}
          </select>
        </div>
        {error && <p role="alert" className="font-bold text-danger">{error}</p>}
        <Button type="submit" className="w-full text-base"><Navigation size={20} aria-hidden="true" />Generate travel recommendation</Button>
        <p className="text-sm text-muted">Demo journey estimates: walking 12 minutes, public transport 8 minutes, driving 4 minutes. Your recommendation opens in a popup; saved reminders are managed in the bell.</p>
      </form>
    </Card>
  </div>
}
