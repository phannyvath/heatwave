import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Clock, Droplets, RefreshCw, Sun, ThermometerSun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import TemperatureUnitSelector from '../components/TemperatureUnitSelector.jsx'
import WeatherSkeleton from '../components/weather/WeatherSkeleton.jsx'
import { useLocation as useStudentLocation } from '../hooks/useLocation.js'
import { useWeather } from '../hooks/useWeather.js'
import { calculateDailyHeatRisk, calculateHeatRisk, heatRiskContent } from '../utils/calculateHeatRisk.js'
import { formatTemp } from '../utils/temperature.js'

const MELBOURNE_CBD = {
  name: 'Melbourne CBD',
  state: 'VIC',
  latitude: -37.8136,
  longitude: 144.9631,
  source: 'default',
}

const circumstances = ['newWeather', 'noAircon', 'university', 'outdoors', 'alone']

function formatHour(isoTime, locale = 'en') {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(isoTime))
}

function getDayHours(hourly) {
  return hourly.filter((hour) => {
    const date = new Date(hour.time)
    const hourNumber = date.getHours()
    return date.toDateString() === new Date().toDateString() && hourNumber >= 8 && hourNumber <= 20
  })
}

function getWarmestWindow(hours, locale, t) {
  if (!hours.length) return null
  const peak = Math.max(...hours.map((hour) => hour.apparentTemperature))
  const hotHours = hours.filter((hour) => peak - hour.apparentTemperature <= 1.5)
  const start = hotHours[0]
  const end = hotHours[hotHours.length - 1]
  const maxUv = Math.max(...hotHours.map((hour) => hour.uvIndex || 0))
  const averageHumidity = Math.round(hotHours.reduce((sum, hour) => sum + hour.humidity, 0) / hotHours.length)
  const now = new Date()
  const futureCooler = hours.filter((hour) => new Date(hour.time) > now && peak - hour.apparentTemperature >= 3)
  const morning = futureCooler.find((hour) => new Date(hour.time).getHours() < 12)
  const evening = futureCooler.find((hour) => new Date(hour.time).getHours() >= 18)

  return {
    label: `${formatHour(start.time, locale)} – ${formatHour(end.time, locale)}`,
    peak,
    maxUv,
    averageHumidity,
    comfortable:
      morning || evening
        ? `${morning ? t('heatRisk.before', { time: formatHour(morning.time, locale) }) : ''}${morning && evening ? ' / ' : ''}${
            evening ? t('heatRisk.after', { time: formatHour(evening.time, locale) }) : ''
          }.`
        : '',
  }
}

function getWarmestLabelForDate(hourly, date, locale, t) {
  const hours = hourly.filter((hour) => hour.time.slice(0, 10) === date)
  const window = getWarmestWindow(hours, locale, t)
  return window?.label || formatHour(`${date}T15:00`, locale)
}

function getChartDomain(hours) {
  const values = hours.flatMap((hour) => [hour.temperature, hour.apparentTemperature]).filter(Number.isFinite)
  if (!values.length) return [0, 40]
  return [Math.floor(Math.min(...values) - 2), Math.ceil(Math.max(...values) + 2)]
}

function HeatRiskSkeleton() {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      <div>
        <div className="h-7 w-40 animate-pulse rounded-full bg-orange-100" />
        <div className="mt-4 h-9 w-44 animate-pulse rounded-full bg-orange-100" />
        <p className="mt-3 text-sm font-bold text-muted">{t('heatRisk.checking')}</p>
      </div>
      <WeatherSkeleton />
    </div>
  )
}

export default function HeatRisk() {
  const { prefs, setPrefs } = useOutletContext()
  const { i18n, t } = useTranslation()
  const locale = i18n.resolvedLanguage || 'en'
  const { location } = useStudentLocation()
  const activeLocation = location || MELBOURNE_CBD
  const { forecast, loading, refreshing, error, isCached, refresh } = useWeather(activeLocation)
  const [selected, setSelected] = useState(['newWeather'])
  const tempUnit = prefs.tempUnit === 'F' ? 'fahrenheit' : prefs.tempUnit || 'celsius'

  const dayHours = useMemo(() => (forecast ? getDayHours(forecast.hourly) : []), [forecast])
  const warmestWindow = useMemo(() => getWarmestWindow(dayHours, locale, t), [dayHours, locale, t])

  function setTemperatureUnit(tempUnitValue) {
    setPrefs({ ...prefs, tempUnit: tempUnitValue })
    window.localStorage.setItem('heatSafe.temperatureUnit', tempUnitValue)
  }

  function toggle(item) {
    setSelected(selected.includes(item) ? selected.filter((entry) => entry !== item) : [...selected, item])
  }

  if (loading && !forecast) return <HeatRiskSkeleton />

  if (!forecast) {
    return (
      <Card className="p-6">
        <Badge tone="high">{t('nav.heatRisk')}</Badge>
        <h1 className="mt-4 text-2xl font-black text-navy">{t('heatRisk.unavailableTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t('heatRisk.unavailableBody')}</p>
        <Button className="mt-5" onClick={refresh}>
          <RefreshCw className="size-4" />
          {t('actions.retry')}
        </Button>
      </Card>
    )
  }

  const today = forecast.daily[0]
  const currentRisk = calculateHeatRisk({
    apparentTemperature: forecast.current.apparentTemperature,
    dailyMaximum: today.max,
    dailyMinimum: today.min,
    uvIndex: today.uvMax,
  })
  const currentContent = heatRiskContent[currentRisk]
  const peakFeelsLike = Math.round(warmestWindow?.peak ?? forecast.current.apparentTemperature)
  const chartData = dayHours.map((hour) => ({
    time: formatHour(hour.time, locale),
    temperature: Math.round(hour.temperature),
    feelsLike: Math.round(hour.apparentTemperature),
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Badge tone={currentContent.tone}>{t(`heatRisk.badge.${currentRisk}`)}</Badge>
          <h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">{t('heatRisk.title')}</h1>
          <p className="mt-2 max-w-3xl text-slate-600">{t('heatRisk.intro')}</p>
          <p className="mt-1 text-xs font-bold text-muted">{t('heatRisk.source')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <TemperatureUnitSelector value={tempUnit} onChange={setTemperatureUnit} />
          <Button variant="ghost" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('actions.retry')}
          </Button>
        </div>
      </div>

      {(error || isCached) && (
        <p className="rounded-2xl bg-orange-50 p-4 text-sm font-bold text-danger" role="status">
          {error || t('heatRisk.cached')} {t('heatRisk.lastUpdated', { time: new Date(forecast.fetchedAt).toLocaleString(locale) })}
        </p>
      )}

      <Card className={`p-5 sm:p-6 ${currentRisk === 'comfortable' ? '' : 'border-orange-200 bg-orange-50'}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-navy">{t(`heatRisk.status.${currentRisk}`)}</h2>
            <p className="mt-2 text-base leading-7 text-slate-700">{t(`heatRisk.message.${currentRisk}`)}</p>
            <p className="mt-2 text-sm font-bold text-muted">{t(`heatRisk.advice.${currentRisk}`)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:w-[30rem]">
            {[
              ['Now', formatTemp(Math.round(forecast.current.temperature), tempUnit), ThermometerSun],
              ['Feels like', formatTemp(Math.round(forecast.current.apparentTemperature), tempUnit), ThermometerSun],
              ['UV max', Math.round(today.uvMax), Sun],
              ['Humidity', `${forecast.current.humidity}%`, Droplets],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-2xl bg-white p-3">
                <Icon className="size-5 text-ocean" aria-hidden="true" />
                <p className="mt-2 text-xs font-bold text-muted">{label}</p>
                <p className="text-lg font-black text-navy">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="min-w-0 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-black text-navy">{t('heatRisk.hourly')}</h2>
            <p className="text-sm font-semibold text-slate-500">{t('heatRisk.feelsPeak', { temp: formatTemp(peakFeelsLike, tempUnit) })}</p>
          </div>
          <p className="sr-only">{t('heatRisk.chartSummary', { temp: formatTemp(peakFeelsLike, tempUnit) })}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-black text-muted" aria-hidden="true">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-ocean" />{t('heatRisk.legendTemp')}</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-muted" />{t('heatRisk.legendFeels')}</span>
          </div>
          <div className="mt-5 h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <defs>
                  <linearGradient id="liveTempFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F47B20" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FFE1C7" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5DAC6" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={12} />
                <YAxis domain={getChartDomain(dayHours)} tickLine={false} axisLine={false} width={36} tickFormatter={(value) => formatTemp(value, tempUnit)} />
                <Tooltip formatter={(value) => formatTemp(value, tempUnit)} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 800 }} />
                <Area name={t('heatRisk.chartTemperature')} type="monotone" dataKey="temperature" stroke="#F47B20" strokeWidth={3} fill="url(#liveTempFill)" />
                <Area name={t('heatRisk.chartFeelsLike')} type="monotone" dataKey="feelsLike" stroke="#806B60" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-black text-navy">{t('heatRisk.warmestWindow')}</h2>
          <p className="mt-4 text-3xl font-black text-danger sm:text-4xl">{warmestWindow?.label || formatHour(forecast.current.time, locale)}</p>
          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <p><strong>{t('heatRisk.maxUv')}:</strong> {Math.round(warmestWindow?.maxUv ?? today.uvMax)}</p>
            <p><strong>{t('heatRisk.averageHumidity')}:</strong> {warmestWindow?.averageHumidity ?? forecast.current.humidity}%</p>
            <p>
              {warmestWindow?.comfortable ? (
                <>
                  <strong>{t('heatRisk.comfortableTimes')}</strong> {warmestWindow.comfortable}
                </>
              ) : (
                t('heatRisk.similarEvening')
              )}
            </p>
          </div>
          <p className="mt-5 flex items-center gap-2 rounded-2xl bg-cream p-3 text-sm font-bold text-muted">
            <Clock className="size-5 text-ocean" />
            {t('heatRisk.basedOnFeels')}
          </p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {forecast.daily.slice(0, 3).map((day, index) => {
          const risk = calculateDailyHeatRisk(day)
          const content = heatRiskContent[risk]
          const dayLabel = index === 0 ? t('heatRisk.today') : index === 1 ? t('heatRisk.tomorrow') : new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date(day.date))
          return (
            <Card key={day.date} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black text-navy">{dayLabel}</h3>
                <Badge tone={content.tone}>{t(`heatRisk.status.${risk}`)}</Badge>
              </div>
              <p className="mt-4 text-3xl font-black text-navy">{formatTemp(Math.round(day.max), tempUnit)}</p>
              <p className="mt-1 text-sm text-slate-500">{t('heatRisk.low', { temp: formatTemp(Math.round(day.min), tempUnit) })}</p>
              <p className="mt-3 text-sm font-bold text-muted">{t('heatRisk.hottestExpected', { time: getWarmestLabelForDate(forecast.hourly, day.date, locale, t) })}</p>
              <p className="mt-4 text-sm text-slate-600">{t(`heatRisk.advice.${risk}`)}</p>
            </Card>
          )
        })}
      </section>

      <Card className="p-5">
        <h2 className="text-lg font-black text-navy">{t('heatRisk.scale')}</h2>
        <p className="mt-2 text-base font-semibold text-muted">{t('heatRisk.scaleDescription')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(heatRiskContent).map(([key, risk]) => {
            const active = key === currentRisk
            return (
              <div
                key={key}
                className={`rounded-2xl border p-4 ${active ? 'border-ocean bg-skysoft ring-2 ring-orange-100' : 'border-orange-100 bg-white'}`}
                aria-current={active ? 'true' : undefined}
              >
                <span className={`block h-2 rounded-full ${risk.color}`} />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="font-black text-navy">{t(`heatRisk.status.${key}`)}</p>
                  {active && <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-ocean">{t('heatRisk.current')}</span>}
                </div>
                <p className="mt-3 text-lg font-extrabold text-navy">{t(`heatRisk.temperatureRanges.${key}`)}</p>
                <p className="mt-1 text-sm text-slate-600">{t(`heatRisk.message.${key}`)}</p>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">{t('heatRisk.scaleNote')}</p>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-black text-navy">{t('heatRisk.personalCircumstances')}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {circumstances.map((item) => (
            <button
              key={item}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selected.includes(item) ? 'border-ocean bg-skysoft text-navy' : 'border-orange-100 bg-white text-slate-600'
              }`}
              onClick={() => toggle(item)}
              aria-pressed={selected.includes(item)}
            >
              {t(`circumstances.${item}.label`)}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {selected.length === 0 ? (
            <p className="rounded-2xl bg-cream p-4 text-slate-600">{t('heatRisk.selectCircumstances')}</p>
          ) : (
            selected.map((item) => (
              <div key={item} className="rounded-2xl border border-orange-100 bg-skysoft p-4">
                <p className="font-bold text-navy">{t(`circumstances.${item}.label`)}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{t(`circumstances.${item}.text`)}</p>
              </div>
            ))
          )}
        </div>
        <Button as={Link} to="/cool-places" className="mt-5">
          {t('heatRisk.viewCoolingPlaces')}
        </Button>
      </Card>
    </div>
  )
}
