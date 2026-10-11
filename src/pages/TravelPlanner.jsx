import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Droplets, LoaderCircle, MapPin, RefreshCw, Route, Send, ShieldCheck, Train, TreePine, Users } from 'lucide-react'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import LocationAutocomplete from '../components/LocationAutocomplete.jsx'
import { isSelectedPlace } from '../services/placesService.js'
import { checkJourneyWeather } from '../services/journeyWeatherService.js'
import { formatTemp } from '../utils/temperature.js'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const suggestions = [[1, Train], [2, TreePine], [3, MapPin], [4, Droplets], [5, Users]]
const tones = {
  comfortable: 'border-[#55753a] bg-[#f1f3e4]',
  warm: 'border-[#a96916] bg-[#fff0cc]',
  hot: 'border-danger bg-[#ffe1c7]',
  'very-hot': 'border-[#863b22] bg-[#ffd5bd]',
  unavailable: 'border-muted bg-[#f3e9df]',
}

const initialForm = { start: '', destination: '', time: '', method: '', duration: '' }

export default function TravelPlanner() {
  const { i18n, t } = useTranslation()
  const { prefs } = useOutletContext()
  const [form, setForm] = useState(initialForm)
  const [places, setPlaces] = useState({ start: null, destination: null })
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const headingRef = useRef(null)
  const panelRef = useRef(null)
  const requestRef = useRef(null)
  const locale = i18n.resolvedLanguage || 'en'
  const signature = JSON.stringify({ form, places })
  const changed = Boolean(result && result.signature !== signature)
  const formatTime = (time) => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(`2000-01-01T${time}:00Z`))
  const heading = result ? t(result.journey ? `journey.headings.${result.journey.risk}` : 'journey.unavailable') : ''

  useEffect(() => () => { requestRef.current?.abort(); requestRef.current = null }, [])
  useEffect(() => {
    if (!result) return
    headingRef.current?.focus({ preventScroll: true })
    if (window.matchMedia('(max-width: 1279px)').matches) {
      panelRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
    }
  }, [result])

  function changeLocation(key, text) {
    setForm((previous) => ({ ...previous, [key]: text }))
    setPlaces((previous) => ({ ...previous, [key]: null }))
  }

  function selectPlace(key, place) {
    setForm((previous) => ({ ...previous, [key]: place.displayName }))
    setPlaces((previous) => ({ ...previous, [key]: place }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (checking) return
    if (!isSelectedPlace(places.start) || !isSelectedPlace(places.destination)) {
      setError(t('places.required'))
      return
    }
    setError('')
    setChecking(true)
    const controller = new AbortController()
    requestRef.current?.abort()
    requestRef.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 20000)
    const startedAt = Date.now()
    let weather = { journey: null }
    try {
      weather = await checkJourneyWeather({ ...places, time: form.time, signal: controller.signal })
    } catch {
      // No location-independent or synthetic fallback may be shown as live data.
    } finally {
      window.clearTimeout(timeout)
    }
    // Keep feedback perceptible even when a provider responds very quickly.
    await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, 450 - (Date.now() - startedAt))))
    if (requestRef.current !== controller) return
    // A timeout produces an explicit unavailable result; unmounts do not update state.
    setResult({ ...weather, form: { ...form }, places: { ...places }, signature, checkedAt: new Date() })
    setChecking(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <Badge tone="high">{t('travel.badge')}</Badge>
        <h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">{t('travel.title')}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">{t('travel.intro')}</p>
      </div>
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {checking ? t('journey.checking') : changed ? t('journey.changed') : result ? `${t('journey.checked')}. ${heading} ${result.checkedAt.toLocaleTimeString(locale)}` : ''}
      </p>
      <div className="grid items-start gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <form className="space-y-4" onSubmit={submit}>
            <fieldset disabled={checking} className="space-y-4 disabled:opacity-70">
              <p id="journey-location-help" className="text-xs leading-5 text-muted">{t('places.hint')}</p>
              {['start', 'destination'].map((key) => (
                <LocationAutocomplete key={key} label={t(`travel.${key}`)} value={form[key]} selection={places[key]}
                  disabled={checking} invalid={Boolean(error && !places[key])} helperId="journey-location-help"
                  onChange={(text) => changeLocation(key, text)} onSelect={(place) => selectPlace(key, place)} />
              ))}
              {[
                ['time', t('travel.time')], ['method', t('travel.method')], ['duration', t('places.duration')],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-sm font-bold text-navy">{label}</span>
                  <input
                    type={key === 'time' ? 'time' : key === 'duration' ? 'number' : 'text'} required={key === 'time'}
                    min={key === 'duration' ? '1' : undefined} step={key === 'duration' ? '1' : undefined}
                    placeholder={key === 'method' ? t('places.methodPlaceholder') : key === 'duration' ? t('places.durationPlaceholder') : undefined}
                    aria-describedby={key === 'time' ? 'journey-time-help' : key === 'duration' ? 'journey-duration-help' : undefined}
                    className="mt-2 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-ocean focus:ring-2 focus:ring-orange-100"
                    value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  />
                  {key === 'time' && <span id="journey-time-help" className="mt-2 block text-xs text-muted">{t('journey.nextDeparture', { timezone: places.start?.timezone || t('places.originTimezone') })}</span>}
                  {key === 'duration' && <span id="journey-duration-help" className="mt-2 block text-xs text-muted">{t('places.durationHelp')}</span>}
                </label>
              ))}
            </fieldset>
            <p className="text-xs leading-5 text-muted">{t('places.scope')}</p>
            {error && <p role="alert" className="rounded-2xl bg-orange-50 p-3 text-sm font-semibold text-danger">{error}</p>}
            <Button className="w-full disabled:cursor-wait disabled:opacity-80" type="submit" disabled={checking} aria-busy={checking} aria-controls="journey-result">
              {checking ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
              {t(checking ? 'journey.checking' : 'travel.check')}
            </Button>
          </form>
        </Card>
        <div className="min-w-0 space-y-4">
          {result ? (
            <section key={result.checkedAt.toISOString()} ref={panelRef} id="journey-result" aria-labelledby="journey-result-heading" className={`journey-result rounded-3xl border-2 border-l-[6px] p-5 text-cocoa shadow-soft sm:p-6 ${tones[result.journey?.risk || 'unavailable']}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4" aria-hidden="true" />{t('journey.checked')}</span>
                <time dateTime={result.checkedAt.toISOString()}>{result.checkedAt.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</time>
              </div>
              {changed && <p className="mt-4 flex items-center gap-2 rounded-xl border border-danger bg-cream p-3 text-sm font-extrabold"><RefreshCw className="size-5 shrink-0" aria-hidden="true" />{t('journey.changed')}</p>}
              <div className="mt-5 flex items-start gap-3">
                {result.journey?.risk === 'comfortable' ? <ShieldCheck className="size-9 shrink-0" aria-hidden="true" /> : <AlertTriangle className="size-9 shrink-0" aria-hidden="true" />}
                <h2 ref={headingRef} tabIndex={-1} id="journey-result-heading" className="rounded-lg text-2xl font-black leading-tight focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-cocoa sm:text-3xl">{heading}</h2>
              </div>
              <p className="mt-4 text-sm leading-6">{result.journey ? t('places.explanation', {
                time: formatTime(result.form.time), date: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${result.journey.date}T00:00:00Z`)),
                start: result.places.start.name, destination: result.places.destination.name,
                originTemp: formatTemp(result.journey.selected.endpoints[0].apparentTemperature, prefs.tempUnit),
                destinationTemp: formatTemp(result.journey.selected.endpoints[1].apparentTemperature, prefs.tempUnit),
                originUv: result.journey.selected.endpoints[0].uvIndex, destinationUv: result.journey.selected.endpoints[1].uvIndex,
              }) : t('journey.noWeather')}</p>
              <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <div><dt className="sr-only">{t('travel.method')}</dt><dd className="flex items-center gap-2"><Train className="size-4 shrink-0" aria-hidden="true" />{result.form.method || t('places.notEntered')}</dd></div>
                <div><dt className="sr-only">{t('places.duration')}</dt><dd className="flex items-center gap-2"><Route className="size-4 shrink-0" aria-hidden="true" />{result.form.duration ? t('places.minutes', { count: Number(result.form.duration) }) : t('places.notEntered')}</dd></div>
              </dl>
              {result.journey ? (
                <div className="mt-5 rounded-2xl border border-cocoa/20 bg-cream/90 p-4">
                  <h3 className="flex items-start gap-2 text-xl font-black"><Clock className="mt-1 size-5 shrink-0" aria-hidden="true" />{t('journey.recommended', { time: formatTime(result.journey.recommendedTime) })}</h3>
                  <p className="mt-2 text-sm leading-6">{t(result.journey.recommendedTime === result.form.time ? 'journey.sameTime' : 'journey.comparison')}</p>
                  <Button variant="danger" className="mt-3 w-full disabled:opacity-60 sm:w-auto" disabled={checking || form.time === result.journey.recommendedTime} onClick={() => setForm({ ...form, time: result.journey.recommendedTime })}>{t('journey.useTime')}</Button>
                </div>
              ) : <p className="mt-4 font-bold">{t('journey.unavailableRecommendation')}</p>}
              {result.journey && <div className="mt-4 space-y-1 text-xs leading-5">
                <p>{t('places.source', { timezone: result.timezone })}</p>
                {result.fetchedAt && <p className="font-bold">{t('journey.live', { time: new Date(result.fetchedAt).toLocaleString(locale) })}</p>}
              </div>}
            </section>
          ) : (
            <Card id="journey-result" className="p-8 text-center">
              <p className="text-lg font-black text-navy">{t('travel.resultTitle')}</p>
              <p className="mt-2 text-slate-600">{t('travel.resultBody')}</p>
            </Card>
          )}
          <Card className="p-5">
            <h2 className="text-lg font-black text-navy">{t(result?.journey ? 'journey.priority' : 'journey.general')}</h2>
            <ol className="mt-4 space-y-3">
              {suggestions.map(([index, Icon], priority) => (
                <li key={index} className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-cream p-3">
                  <span className="text-xs font-black text-muted">{priority + 1}</span>
                  <Icon className="size-5 shrink-0 text-danger" aria-hidden="true" />
                  <span className="text-sm font-semibold text-cocoa">{t(`travel.alternatives.${index}`)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  )
}
