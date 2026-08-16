import Badge from '../Badge.jsx'
import Card from '../Card.jsx'
import { formatTemp } from '../../utils/temperature.js'
import { getWeatherIcon } from '../../utils/weatherCodes.js'
import { useTranslation } from 'react-i18next'

function formatDay(date) {
  return new Intl.DateTimeFormat('en-AU', { weekday: 'short' }).format(new Date(date))
}

function dayStatus(day, climate) {
  if (!climate) return { labelKey: 'weatherShared.forecast', tone: 'grey' }
  if (day.max - climate.monthlyAverageMax >= 5 || day.apparentMax >= 38) return { labelKey: 'weatherShared.highHeat', tone: 'danger' }
  if (day.max - climate.monthlyAverageMax >= 3 || day.apparentMax >= 32) return { labelKey: 'weatherShared.warm', tone: 'high' }
  return { labelKey: 'weatherShared.comfortable', tone: 'safe' }
}

export default function WeeklyForecast({ days, climate, prefs }) {
  const { t } = useTranslation()
  return (
    <Card className="p-5">
      <h2 className="text-xl font-black text-navy">{t('weatherShared.weeklyTitle')}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map((day) => {
          const WeatherIcon = getWeatherIcon(0)
          const status = dayStatus(day, climate)
          return (
            <article key={day.date} className="flex min-w-0 items-center gap-3 rounded-2xl bg-cream p-4 xl:block xl:text-center">
              <WeatherIcon className="size-7 shrink-0 text-ocean xl:mx-auto" aria-hidden="true" />
              <div className="min-w-0 flex-1 xl:mt-3">
                <p className="font-black text-navy">{formatDay(day.date)}</p>
                <p className="text-sm font-bold text-muted">
                  {formatTemp(Math.round(day.max), prefs.tempUnit)} / {formatTemp(Math.round(day.min), prefs.tempUnit)}
                </p>
              </div>
              <Badge tone={status.tone}>{t(status.labelKey)}</Badge>
            </article>
          )
        })}
      </div>
    </Card>
  )
}
