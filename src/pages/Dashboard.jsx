import { Link, useOutletContext } from 'react-router-dom'
import { Bell, BellOff, Check, HeartPulse, Info, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import ProgressCircle from '../components/ProgressCircle.jsx'
import CurrentWeatherCard from '../components/weather/CurrentWeatherCard.jsx'
import HeatStatusCard from '../components/weather/HeatStatusCard.jsx'
import HourlyForecast from '../components/weather/HourlyForecast.jsx'
import LocationSelector from '../components/weather/LocationSelector.jsx'
import TravelSuggestion from '../components/weather/TravelSuggestion.jsx'
import WeatherSkeleton from '../components/weather/WeatherSkeleton.jsx'
import WeeklyForecast from '../components/weather/WeeklyForecast.jsx'
import { prepItems, quickActions } from '../data/mockData.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { useLocation as useStudentLocation } from '../hooks/useLocation.js'
import { useWeather } from '../hooks/useWeather.js'
import { formatTemp } from '../utils/temperature.js'

const SIX_HOURS = 6 * 60 * 60 * 1000

export default function Dashboard() {
  const { i18n, t } = useTranslation()
  const locale = i18n.resolvedLanguage || 'en'
  const { prefs } = useOutletContext()
  const [checked, setChecked] = useLocalStorage('heatsafe-prep-checklist', ['Carry a water bottle'])
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage('heatsafe-notifications-enabled', false)
  const progress = Math.round((checked.length / prepItems.length) * 100)
  const {
    location,
    status: locationStatus,
    error: locationError,
    requestCurrentLocation,
    selectLocation,
    useDefaultLocation,
    changeLocation,
  } = useStudentLocation()
  const { forecast, climate, heatStatus, loading, refreshing, error, climateError, isCached, refresh } = useWeather(location)

  function toggleItem(item) {
    setChecked(checked.includes(item) ? checked.filter((entry) => entry !== item) : [...checked, item])
  }

  async function enableNotifications() {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true)
      maybeSendHeatNotification()
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotificationsEnabled(true)
      maybeSendHeatNotification()
    }
  }

  function maybeSendHeatNotification() {
    if (!forecast || !heatStatus || heatStatus.priority < 2 || !('Notification' in window) || Notification.permission !== 'granted') return
    const last = Number(window.localStorage.getItem('heatsafe-last-heat-notification') || 0)
    if (Date.now() - last < SIX_HOURS) return
    const today = forecast.daily[0]
    const difference = heatStatus.temperatureDifference
    if (difference !== null && difference < 3 && forecast.current.apparentTemperature < 32) return
    new Notification(t('dashboard.notificationTitle'), {
      body: t('dashboard.notificationBody', {
        temp: formatTemp(Math.round(today.max), prefs.tempUnit),
        difference: difference !== null ? t('dashboard.warmerThanUsual', { difference }) : '',
      }),
    })
    window.localStorage.setItem('heatsafe-last-heat-notification', Date.now().toString())
  }

  if (!location || locationStatus === 'needs-choice' || locationStatus === 'denied') {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <LocationSelector
          locationError={locationError}
          onUseLocation={requestCurrentLocation}
          onSelectLocation={selectLocation}
          onUseDefault={useDefaultLocation}
        />
        <Card className="p-5">
          <h2 className="text-lg font-black text-navy">{t('dashboard.privacyTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t('dashboard.privacyBody')}
          </p>
        </Card>
      </div>
    )
  }

  if (loading && !forecast) {
    return <WeatherSkeleton />
  }

  if (!forecast) {
    return (
      <div className="space-y-5">
        <Card className="p-5">
          <Badge tone="high">{t('dashboard.weatherUnavailable')}</Badge>
          <h1 className="mt-4 text-2xl font-black text-navy">{t('dashboard.loadErrorTitle')}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {error || t('dashboard.loadErrorBody')}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={refresh}>{t('dashboard.tryAgain')}</Button>
            <Button variant="ghost" onClick={changeLocation}>
              {t('dashboard.changeLocation')}
            </Button>
          </div>
        </Card>
        <LocationSelector mode="inline" onUseLocation={requestCurrentLocation} onSelectLocation={selectLocation} onUseDefault={useDefaultLocation} />
      </div>
    )
  }

  const prominentStatus = heatStatus?.priority >= 3

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[1.4rem] bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black tracking-wide text-muted">{t('dashboard.currentLocation')}</p>
          <p className="mt-1 flex min-w-0 items-center gap-2 font-black text-navy">
            <MapPin className="size-4 shrink-0 text-ocean" />
            <span className="min-w-0 truncate">
              {location.name}, {location.state}
            </span>
          </p>
        </div>
        <Button variant="ghost" onClick={changeLocation}>
          {t('dashboard.changeLocation')}
        </Button>
      </div>

      {(error || isCached) && (
        <p className="rounded-2xl bg-orange-50 p-4 text-sm font-bold text-danger">
          {error} {isCached && forecast.fetchedAt ? t('dashboard.lastUpdated', { time: new Date(forecast.fetchedAt).toLocaleString(locale) }) : ''}
        </p>
      )}

      {prominentStatus && heatStatus && (
        <HeatStatusCard status={heatStatus} forecast={forecast} climate={climate} climateError={climateError} />
      )}

      <CurrentWeatherCard forecast={forecast} location={location} prefs={prefs} refreshing={refreshing} onRefresh={refresh} heatStatus={heatStatus} sceneUnavailable={Boolean(error || isCached)} />

      {!prominentStatus && heatStatus && (
        <HeatStatusCard status={heatStatus} forecast={forecast} climate={climate} climateError={climateError} />
      )}

      <HourlyForecast hours={forecast.hourly} prefs={prefs} />
      <TravelSuggestion hourly={forecast.hourly} prefs={prefs} />
      <WeeklyForecast days={forecast.daily} climate={climate} prefs={prefs} />

      {heatStatus?.priority >= 3 && (
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <HeartPulse className="size-7 text-ocean" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-black text-navy">{t('dashboard.signsTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {t('dashboard.signsBody')}
            </p>
          </Card>
          <Card className="p-5">
            <Phone className="size-7 text-ocean" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-black text-navy">{t('dashboard.healthdirectTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{t('dashboard.healthdirectBody')}</p>
          </Card>
          <Card className="p-5">
            <Info className="size-7 text-ocean" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-black text-navy">{t('dashboard.emergencyReminderTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {t('dashboard.emergencyReminderBody')}
            </p>
          </Card>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Card as={Link} to={action.path} key={action.title} className="group p-5 transition hover:-translate-y-1 hover:border-orange-200">
              <div className="grid size-12 place-items-center rounded-2xl bg-skysoft text-ocean transition group-hover:bg-ocean group-hover:text-white">
                <Icon className="size-6" aria-hidden="true" />
              </div>
              <p className="mt-4 font-bold text-navy">{t(action.path === '/' ? 'nav.dashboard' : action.path === '/cool-places' ? 'nav.coolPlaces' : action.path === '/travel-planner' ? 'nav.travelPlanner' : action.path === '/safety-plan' ? 'nav.safetyPlan' : 'nav.learn')}</p>
              <p className="mt-1 text-sm text-slate-500">{t('dashboard.openTool')}</p>
            </Card>
          )
        })}
      </section>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-navy">{t('dashboard.remindersTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('dashboard.remindersBody')}</p>
          </div>
          <ProgressCircle value={progress} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prepItems.map((item) => (
            <button
              key={item}
              className={`flex min-h-16 items-center gap-3 rounded-2xl border p-4 text-left transition ${
                checked.includes(item) ? 'border-emerald-200 bg-emerald-50' : 'border-orange-100 bg-white hover:bg-cream'
              }`}
              onClick={() => toggleItem(item)}
              aria-pressed={checked.includes(item)}
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-full ${checked.includes(item) ? 'bg-safe text-white' : 'bg-orange-100 text-muted'}`}>
                <Check className="size-4" aria-hidden="true" />
              </span>
              <span className="font-semibold text-slate-800">
                {t(item === 'Carry a water bottle' ? 'dashboard.prep.water' : item === 'Use sunscreen' ? 'dashboard.prep.sunscreen' : item === 'Wear light clothing' ? 'dashboard.prep.clothing' : item === 'Rest in the shade' ? 'dashboard.prep.shade' : 'dashboard.prep.avoid')}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-black text-navy">
              <ShieldCheck className="size-5 text-ocean" />
              {t('dashboard.notificationsTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t('dashboard.notificationsBody')}
            </p>
          </div>
          {notificationsEnabled ? (
            <Button variant="ghost" onClick={() => setNotificationsEnabled(false)}>
              <BellOff className="size-4" />
              {t('dashboard.disable')}
            </Button>
          ) : (
            <Button variant="ghost" onClick={enableNotifications}>
              <Bell className="size-4" />
              {t('dashboard.enable')}
            </Button>
          )}
        </div>
      </Card>

      <p className="pb-2 text-xs leading-5 text-muted">
        {t('dashboard.disclaimer')}
      </p>
    </div>
  )
}
