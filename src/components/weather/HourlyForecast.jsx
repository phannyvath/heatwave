import Card from '../Card.jsx'
import { formatTemp } from '../../utils/temperature.js'
import { getHottestHour } from '../../utils/heatRisk.js'
import { getWeatherIcon } from '../../utils/weatherCodes.js'

function formatHour(isoTime) {
  return new Intl.DateTimeFormat('en-AU', { hour: 'numeric' }).format(new Date(isoTime))
}

export default function HourlyForecast({ hours, prefs }) {
  const todayHours = hours
    .filter((hour) => new Date(hour.time).toDateString() === new Date().toDateString())
    .slice(0, 24)
  const hottest = getHottestHour(todayHours)

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-navy">Hourly forecast</h2>
          <p className="mt-1 text-sm text-slate-600">Swipe sideways to compare the rest of today.</p>
        </div>
      </div>
      <div className="mt-5 flex gap-3 overflow-x-auto pb-2" aria-label="Hourly forecast">
        {todayHours.map((hour) => {
          const WeatherIcon = getWeatherIcon(hour.weatherCode)
          const isHottest = hottest?.time === hour.time
          return (
            <article
              key={hour.time}
              className={`min-w-28 rounded-2xl border p-3 text-center ${
                isHottest ? 'border-ocean bg-skysoft text-navy' : 'border-orange-100 bg-cream'
              }`}
              aria-label={`${formatHour(hour.time)}, ${formatTemp(Math.round(hour.temperature), prefs.tempUnit)}, feels like ${formatTemp(Math.round(hour.apparentTemperature), prefs.tempUnit)}`}
            >
              <p className="text-sm font-black">{formatHour(hour.time)}</p>
              <WeatherIcon className="mx-auto mt-3 size-7 text-ocean" aria-hidden="true" />
              <p className="mt-3 text-lg font-black">{formatTemp(Math.round(hour.temperature), prefs.tempUnit)}</p>
              <p className="text-xs font-bold text-muted">Feels {formatTemp(Math.round(hour.apparentTemperature), prefs.tempUnit)}</p>
              {hour.uvIndex >= 6 && <p className="mt-2 rounded-full bg-white px-2 py-1 text-xs font-black text-danger">UV {Math.round(hour.uvIndex)}</p>}
              {isHottest && <p className="mt-2 text-xs font-black text-ocean">Warmest</p>}
            </article>
          )
        })}
      </div>
    </Card>
  )
}
