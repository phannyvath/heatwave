import { Link } from 'react-router-dom'
import { ExternalLink, HeartPulse, Info, Moon, ShieldCheck, Users, Waves } from 'lucide-react'
import Badge from '../Badge.jsx'
import Button from '../Button.jsx'
import Card from '../Card.jsx'
import { formatTemp } from '../../utils/temperature.js'

export default function HeatStatusCard({ status, forecast, climate, climateError }) {
  const today = forecast.daily[0]
  const highHeat = status.priority >= 3
  const persistent = status.level === 'Persistent heat'

  return (
    <Card className={`p-5 sm:p-6 ${highHeat ? 'border-orange-200 bg-orange-50' : ''}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Badge tone={status.tone}>{status.level}</Badge>
          <h2 className="mt-4 text-[clamp(1.35rem,6vw,2rem)] font-black leading-tight text-navy">{status.message}</h2>
          {climate ? (
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Today may reach {formatTemp(Math.round(today.max), 'C')}, around {Math.abs(status.temperatureDifference)}°C{' '}
              {status.temperatureDifference >= 0 ? 'warmer' : 'cooler'} than usual for this location.
            </p>
          ) : (
            <p className="mt-3 text-sm font-bold text-muted">{climateError || 'Local average is currently unavailable.'}</p>
          )}
          <p className="mt-3 text-xs leading-5 text-muted">
            HeatSafe Student uses prototype guidance rules. This is not an official Bureau of Meteorology heatwave classification.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:w-64 md:grid-cols-1">
          <Button as={Link} to="/cool-places" variant={highHeat ? 'primary' : 'ghost'}>
            <Waves className="size-4" />
            Nearby cool places
          </Button>
          <Button as={Link} to="/safety-plan" variant="ghost">
            <ShieldCheck className="size-4" />
            Safety plan
          </Button>
        </div>
      </div>

      {highHeat && (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ['Drink water regularly', HeartPulse],
            ['Use sunscreen, shade and light clothing', Info],
            ['Know signs of heat exhaustion', ShieldCheck],
          ].map(([text, Icon]) => (
            <p key={text} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">
              <Icon className="size-5 shrink-0 text-ocean" />
              {text}
            </p>
          ))}
        </div>
      )}

      {persistent && (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {forecast.daily.slice(0, 3).map((day) => (
            <div key={day.date} className="rounded-2xl bg-white p-4">
              <p className="font-black text-navy">{new Intl.DateTimeFormat('en-AU', { weekday: 'long' }).format(new Date(day.date))}</p>
              <p className="mt-1 text-sm font-bold text-muted">
                {formatTemp(Math.round(day.max), 'C')} / {formatTemp(Math.round(day.min), 'C')}
              </p>
            </div>
          ))}
          <p className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">
            <Moon className="size-5 shrink-0 text-ocean" />
            Warm nights can reduce recovery, so prepare cool rest options.
          </p>
          <p className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">
            <Users className="size-5 shrink-0 text-ocean" />
            Check in with friends or housemates.
          </p>
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-white p-4">
        <p className="text-sm font-black text-navy">Official information</p>
        <a
          href="https://www.bom.gov.au/weather-and-climate/specialised-forecasts-and-observations/heatwave"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-black text-ocean underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-ocean"
        >
          Check official Australian heatwave forecasts and warnings
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
        <p className="mt-2 text-xs font-bold text-muted">Official warnings: Bureau of Meteorology</p>
      </div>
    </Card>
  )
}
