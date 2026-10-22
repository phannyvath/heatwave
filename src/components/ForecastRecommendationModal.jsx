import { useEffect, useRef, useState } from 'react'
import { Bell, Clock, LoaderCircle, MapPin, Thermometer, RefreshCw } from 'lucide-react'
import AccessibleModal from './AccessibleModal.jsx'
import Button from './Button.jsx'
import MapsDirectionsLink from './MapsDirectionsLink.jsx'
import { fetchForecast } from '../services/weatherService.js'
import { heatRiskContent } from '../utils/calculateHeatRisk.js'
import { localDateTime, recommendDeparture } from '../utils/departureForecast.js'
import { recommendationModes } from '../utils/demoRecommendation.js'

const dateTime = epoch => new Date(epoch).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })
const time = epoch => new Date(epoch).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
const tones = { comfortable: 'border-green-300 bg-green-50', warm: 'border-amber-300 bg-amber-50', hot: 'border-orange-400 bg-orange-100', 'very-hot': 'border-red-400 bg-red-50' }
function ForecastCard({ title, option }) {
  return <section className={`rounded-2xl border-2 p-4 ${tones[option.category]}`}>
    <h3 className="font-black">{title}</h3>
    <time dateTime={new Date(option.departure).toISOString()} className="mt-2 block font-bold">{dateTime(option.departure)}</time>
    <p className="mt-3 flex items-center gap-2 text-xl font-black"><Thermometer aria-hidden="true" size={22} />{option.apparentTemperature}°C feels like · {heatRiskContent[option.category].label}</p>
    <p className="mt-1">Air temperature: {option.temperature}°C</p>
  </section>
}
export default function ForecastRecommendationModal({ plan, onClose, onSave, onTimeChange }) {
  const [result, setResult] = useState(plan.forecastRecommendation || null)
  const [loading, setLoading] = useState(!plan.forecastRecommendation)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [choice, setChoice] = useState(plan.chosenDeparture ? 'saved' : null)
  const actionRef = useRef(null)
  const estimate = recommendationModes[plan.form.method]
  useEffect(() => {
    if (plan.forecastRecommendation && attempt === 0) return
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 15000)
    setLoading(true)
    setError('')
    fetchForecast({ latitude: plan.places.start.latitude, longitude: plan.places.start.longitude, timeformat: 'unixtime', signal: controller.signal })
      .then(data => recommendDeparture(data, plan.selectedDeparture, estimate.minutes))
      .then(value => { if (active) { setResult(value); setChoice(null) } })
      .catch(failure => { if (active) { setResult(null); setError(failure.message.includes('forecast') ? failure.message : 'We couldn’t load the starting-location forecast. Please retry.') } })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false) })
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [plan, attempt, estimate.minutes])
  useEffect(() => { if (choice) actionRef.current?.focus({ preventScroll: true }) }, [choice])
  const selected = result?.selected
  const recommended = result?.recommended
  const chosen = choice === 'selected' || result?.kind === 'keep' ? selected : choice === 'saved' && plan.chosenDeparture === selected?.departure ? selected : recommended
  const needsChoice = result && result.kind !== 'keep' && result.kind !== 'no-upcoming' && !choice
  function choose(which) {
    const option = which === 'selected' ? selected : recommended
    setChoice(which)
    setSaveError('')
    onTimeChange?.(localDateTime(option.departure))
  }
  function save() {
    const option = result.kind === 'no-upcoming' ? selected : chosen
    if (option.departure <= Date.now()) { setSaveError('This departure time has passed. Go back to edit your journey.'); return }
    const saved = { ...plan, form: { ...plan.form, departure: localDateTime(option.departure) }, forecastRecommendation: result, chosenDeparture: option.departure }
    setSaveError(onSave(saved, option.departure))
  }
  return <AccessibleModal title="Your travel recommendation" onClose={onClose}>
    <div className="rounded-2xl bg-white p-4 border border-orange-100">
      <p className="flex items-start gap-2 text-lg font-bold"><MapPin className="mt-1 shrink-0" size={22} aria-hidden="true" />{plan.places.start.name} → {plan.places.destination.name}</p>
      <p className="mt-2">{estimate.label} · Approximately {estimate.minutes} minutes <span className="text-muted">(demo travel estimate)</span></p>
    </div>
    {loading ? <p role="status" className="flex items-center gap-3 py-6 text-lg"><LoaderCircle className="animate-spin" aria-hidden="true" />Checking the starting-location forecast…</p> : error ? <div className="space-y-4 rounded-2xl bg-orange-50 p-5"><p role="alert" className="font-bold">{error}</p><Button onClick={() => setAttempt(value => value + 1)}><RefreshCw size={20} aria-hidden="true" />Retry forecast</Button></div> : result && <>
      <div aria-live="polite" className="space-y-3">
        <p className="text-xl font-black">{choice ? 'Your chosen departure' : result.kind === 'keep' ? 'You’re good to go' : result.kind === 'cooler' ? `A cooler time to leave is ${time(recommended.departure)}.` : 'No Comfortable or Warm period found'}</p>
        <section className={`rounded-2xl border-2 p-5 ${tones[chosen.category]}`}>
          <p className="flex items-center gap-2 font-bold"><Clock size={22} aria-hidden="true" />{choice ? 'Chosen departure' : 'Recommended departure'}</p>
          <time data-testid="recommended-departure" dateTime={new Date(chosen.departure).toISOString()} className="mt-2 block text-2xl font-black leading-snug">{dateTime(chosen.departure)}</time>
          <p className="mt-3 text-lg font-bold">{chosen.apparentTemperature}°C feels like · {heatRiskContent[chosen.category].label}</p>
          <p className="mt-2">Estimated arrival: <time dateTime={new Date(chosen.arrival).toISOString()}>{dateTime(chosen.arrival)}</time></p>
        </section>
      </div>
      {result.kind === 'keep' ? <p>Your selected departure at {time(selected.departure)} is {heatRiskContent[selected.category].label.toLowerCase()}. You can keep your exact selected date and time.</p> : <>
        <div className="grid gap-3 sm:grid-cols-2"><ForecastCard title="Selected" option={selected} /><ForecastCard title={result.kind === 'no-upcoming' ? 'Selected time retained' : 'Recommended'} option={recommended} /></div>
        {result.kind === 'cooler' ? <p>Leaving later may reduce your exposure to high temperatures.</p> : result.kind === 'no-mild' ? <p>No Comfortable or Warm period exists in the available upcoming forecast. The coolest available upcoming option is shown, but it remains <strong>{heatRiskContent[recommended.category].label}</strong>. {recommended.apparentTemperature >= selected.apparentTemperature && 'It is not cooler than your selected time.'}</p> : <p>No later forecast periods are available. Your selected time remains {heatRiskContent[selected.category].label}; no cooler recommendation can be made.</p>}
      </>}
      <p className="text-sm leading-6 text-muted">Temperature-only recommendation using HeatSafe’s existing feels-like temperature categories. This forecast does not guarantee safety. Hourly forecast intervals are used: your selected {time(selected.departure)} departure uses the {time(selected.epoch)}–{time(selected.epoch + 3600000)} interval. These are not exact-minute weather readings. Journey times are demo estimates, without live traffic or service schedules.</p>
      <p className="text-sm text-muted">{plan.forecastRecommendation ? 'Saved forecast snapshot' : 'Forecast'}: {result.provider} for {plan.places.start.name} · retrieved {dateTime(Date.parse(result.fetchedAt))}. All journey times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
      {result.missingPeriods > 0 && <p className="text-sm text-danger">Some future forecast periods are missing. Recommendations use only available periods.</p>}
      {saveError && <p role="alert" className="font-bold text-danger">{saveError}</p>}
      <div className="flex flex-wrap gap-3">
        {needsChoice ? <Button onClick={() => choose('recommended')}>Use recommended time</Button> : <Button ref={actionRef} onClick={save}><Bell size={20} aria-hidden="true" />Set departure reminder</Button>}
        {result.kind !== 'keep' && result.kind !== 'no-upcoming' && choice !== 'selected' && <Button variant="ghost" onClick={() => choose('selected')}>Keep my selected time</Button>}
      </div>
    </>}
    <MapsDirectionsLink start={plan.places.start} destination={plan.places.destination} method={plan.form.method} />
    <p className="text-sm text-muted">In-app demo reminders appear only while HeatSafe is open. These are not device or background notifications.</p>
    <Button variant="ghost" onClick={onClose}>Back to edit</Button>
  </AccessibleModal>
}
