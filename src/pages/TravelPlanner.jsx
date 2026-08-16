import { useEffect, useState } from 'react'
import { Clock, Droplets, Info, Route, Send, Train } from 'lucide-react'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import LocationSelector from '../components/weather/LocationSelector.jsx'
import TravelSuggestion from '../components/weather/TravelSuggestion.jsx'
import { useLocation as useStudentLocation } from '../hooks/useLocation.js'
import { useWeather } from '../hooks/useWeather.js'
import { riskFromHour } from '../utils/temperature.js'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const alternativeIndexes = [0, 1, 2, 3, 4, 5]

function defaultForm(t) {
  return {
    start: t('travelDefaults.start'),
    destination: t('travelDefaults.destination'),
    time: t('travelDefaults.time'),
    method: t('travelDefaults.method'),
    duration: t('travelDefaults.duration'),
  }
}

export default function TravelPlanner() {
  const { i18n, t } = useTranslation()
  const { prefs } = useOutletContext()
  const {
    location,
    status: locationStatus,
    error: locationError,
    requestCurrentLocation,
    selectLocation,
    useDefaultLocation,
  } = useStudentLocation()
  const { forecast } = useWeather(location)
  const [form, setForm] = useState(() => defaultForm(t))
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(defaultForm(t))
  }, [i18n.resolvedLanguage, t])

  function submit(event) {
    event.preventDefault()
    if (!form.start.trim() || !form.destination.trim()) {
      setError(t('travel.missing'))
      setResult(null)
      return
    }
    setError('')
    const risk = riskFromHour(form.time)
    setResult({
      risk,
      message:
        risk === 'Hot'
          ? t('travel.hot')
          : risk === 'Warm'
            ? t('travel.warm')
            : t('travel.comfortable'),
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <Badge tone="high">{t('travel.badge')}</Badge>
        <h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">{t('travel.title')}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">{t('travel.intro')}</p>
      </div>
      {(!location || locationStatus !== 'ready') && (
        <LocationSelector
          locationError={locationError}
          onUseLocation={requestCurrentLocation}
          onSelectLocation={selectLocation}
          onUseDefault={useDefaultLocation}
        />
      )}
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <form className="space-y-4" onSubmit={submit}>
            {[
              ['start', t('travel.start')],
              ['destination', t('travel.destination')],
              ['time', t('travel.time')],
              ['method', t('travel.method')],
              ['duration', t('travel.duration')],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-sm font-bold text-navy">{label}</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-ocean focus:ring-2 focus:ring-blue-100"
                  value={form[key]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                />
              </label>
            ))}
            {error && <p className="rounded-2xl bg-orange-50 p-3 text-sm font-semibold text-danger">{error}</p>}
            <Button className="w-full" type="submit">
              <Send className="size-4" />
              {t('travel.check')}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {result ? (
            <Card className="p-5">
              <div className="flex items-start gap-4">
                <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${result.risk === 'Hot' ? 'bg-orange-100 text-heat' : 'bg-skysoft text-ocean'}`}>
                  <Info className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <Badge tone={result.risk === 'Hot' ? 'high' : 'navy'}>{t('travel.conditions', { risk: result.risk })}</Badge>
                  <h2 className="mt-3 text-xl font-black text-navy">{result.message}</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <p className="rounded-2xl bg-slate-50 p-3 text-sm"><Clock className="mb-2 size-5 text-ocean" />{form.time}</p>
                    <p className="rounded-2xl bg-slate-50 p-3 text-sm"><Train className="mb-2 size-5 text-ocean" />{form.method}</p>
                    <p className="rounded-2xl bg-slate-50 p-3 text-sm"><Route className="mb-2 size-5 text-ocean" />{form.duration}</p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-lg font-black text-navy">{t('travel.resultTitle')}</p>
              <p className="mt-2 text-slate-600">{t('travel.resultBody')}</p>
            </Card>
          )}
          <Card className="p-5">
            <h2 className="text-lg font-black text-navy">{t('travel.alternativesTitle')}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {alternativeIndexes.map((index) => (
                <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                  <Droplets className="size-5 shrink-0 text-ocean" />
                  <span className="font-semibold text-slate-700">{t(`travel.alternatives.${index}`)}</span>
                </div>
              ))}
            </div>
          </Card>
          {forecast && <TravelSuggestion hourly={forecast.hourly} prefs={prefs} />}
        </div>
      </div>
    </div>
  )
}
