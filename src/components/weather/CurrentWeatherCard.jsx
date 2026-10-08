import { Clock, CloudMoon, Droplets, Moon, RefreshCw, Sun, ThermometerSun, Wind } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Badge from '../Badge.jsx'
import Button from '../Button.jsx'
import Card from '../Card.jsx'
import { formatTemp } from '../../utils/temperature.js'
import { getHottestHour, getUvLabel } from '../../utils/heatRisk.js'
import { getWeatherDescription, getWeatherIcon } from '../../utils/weatherCodes.js'
import { getWeatherScene } from '../../utils/weatherScene.js'
import WeatherScene from './WeatherScene.jsx'

function formatTime(isoTime, locale = 'en') {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(isoTime))
}

export default function CurrentWeatherCard({ forecast, location, prefs, refreshing, onRefresh, heatStatus, sceneUnavailable = false }) {
  const { i18n, t } = useTranslation()
  const locale = i18n.resolvedLanguage || 'en'
  const scene = getWeatherScene(forecast, heatStatus, sceneUnavailable)
  const WeatherIcon = scene.night && ['clear', 'partly-cloudy', 'overcast'].includes(scene.kind)
    ? (scene.kind === 'clear' ? Moon : CloudMoon)
    : getWeatherIcon(forecast.current.weatherCode)
  const hottest = getHottestHour(forecast.hourly.filter((hour) => new Date(hour.time).toDateString() === new Date().toDateString()))
  const today = forecast.daily[0]

  const metrics = [
    { label: t('weatherCard.feelsLike'), value: formatTemp(forecast.current.apparentTemperature, prefs.tempUnit), icon: ThermometerSun },
    { label: t('weatherCard.today'), value: `${formatTemp(today.max, prefs.tempUnit)} / ${formatTemp(today.min, prefs.tempUnit)}`, icon: Sun },
    { label: t('weatherCard.humidity'), value: `${forecast.current.humidity}%`, icon: Droplets },
    { label: t('weatherCard.wind'), value: `${Math.round(forecast.current.windSpeed)} km/h`, icon: Wind },
    { label: t('weatherCard.uvIndex'), value: `${Math.round(today.uvMax)} ${getUvLabel(today.uvMax)}`, icon: Sun },
    { label: t('weatherCard.hottestTime'), value: hottest ? formatTime(hottest.time, locale) : t('weatherCard.laterToday'), icon: Clock },
  ]

  return (
    <Card className="weather-card overflow-hidden p-5 sm:p-6" data-scene={scene.kind} data-night={scene.night} data-hot={scene.hot} data-artwork={scene.artwork || 'neutral'} data-dark={scene.night || scene.kind === 'storm'} aria-label={t('weatherCard.greeting')}>
      <WeatherScene scene={scene} />
      <div className="weather-card__content">
        <div className="weather-card__top">
          <div className="weather-card__summary min-w-0">
            <Badge tone="navy">{t('weatherCard.forecastSource')}</Badge>
            <h1 className="weather-card__heading mt-4 text-[clamp(1.55rem,7vw,2.35rem)] font-black leading-tight text-navy">
              {t('weatherCard.greeting')}
            </h1>
            <p className="weather-card__secondary mt-2 flex min-w-0 items-center gap-2 text-sm font-bold text-muted">
              <span className="min-w-0 truncate">
                {location.name}, {location.state}
              </span>
            </p>
            <div className="mt-6 flex flex-wrap items-end gap-4">
              <p className="weather-card__temperature text-6xl font-black leading-none text-navy">{formatTemp(Math.round(forecast.current.temperature), prefs.tempUnit)}</p>
              <div className="pb-1">
                <p className="weather-card__condition font-black text-cocoa">{getWeatherDescription(forecast.current.weatherCode)}</p>
                <p className="weather-card__updated weather-card__secondary text-sm font-semibold text-muted">{t('weatherCard.lastUpdated', { time: formatTime(forecast.fetchedAt, locale) })}</p>
              </div>
            </div>
          </div>
          <div className="weather-card__controls flex shrink-0 items-center gap-3">
            <div className="weather-card__icon grid size-14 place-items-center rounded-full bg-white/90 text-ocean shadow-soft">
              <WeatherIcon className="size-7" aria-hidden="true" />
            </div>
            <Button variant="ghost" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw aria-hidden="true" className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('weatherCard.refresh')}
            </Button>
          </div>
        </div>

        <div className="weather-card__metrics mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="weather-card__metric flex min-w-0 items-center gap-3 rounded-2xl p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-ocean">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-muted">{metric.label}</span>
                  <span className="block overflow-wrap-anywhere text-base font-black text-navy">{metric.value}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
