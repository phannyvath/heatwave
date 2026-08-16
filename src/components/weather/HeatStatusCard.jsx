import { Link } from 'react-router-dom'
import { ExternalLink, HeartPulse, Info, Moon, ShieldCheck, Users, Waves } from 'lucide-react'
import Badge from '../Badge.jsx'
import Button from '../Button.jsx'
import Card from '../Card.jsx'
import { formatTemp } from '../../utils/temperature.js'
import { useTranslation } from 'react-i18next'

const statusKeyByLevel = {
  Comfortable: 'comfortable',
  'Warmer than usual': 'warmer',
  'High heat': 'high',
  'Persistent heat': 'persistent',
}

export default function HeatStatusCard({ status, forecast, climate, climateError }) {
  const { t } = useTranslation()
  const today = forecast.daily[0]
  const highHeat = status.priority >= 3
  const persistent = status.level === 'Persistent heat'
  const statusKey = statusKeyByLevel[status.level] || 'comfortable'

  return (
    <Card className={`p-5 sm:p-6 ${highHeat ? 'border-orange-200 bg-orange-50' : ''}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Badge tone={status.tone}>{t(`heatStatus.${statusKey}`)}</Badge>
          <h2 className="mt-4 text-[clamp(1.35rem,6vw,2rem)] font-black leading-tight text-navy">{t(`heatStatus.${statusKey}Msg`)}</h2>
          {climate ? (
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {t('heatStatus.comparison', {
                temp: formatTemp(Math.round(today.max), 'C'),
                difference: Math.abs(status.temperatureDifference),
                direction: status.temperatureDifference >= 0 ? t('heatStatus.warmerDirection') : t('heatStatus.coolerDirection'),
              })}
            </p>
          ) : (
            <p className="mt-3 text-sm font-bold text-muted">{climateError || t('weatherShared.averageUnavailable')}</p>
          )}
          <p className="mt-3 text-xs leading-5 text-muted">
            {t('weatherShared.prototypeRules')}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:w-64 md:grid-cols-1">
          <Button as={Link} to="/cool-places" variant={highHeat ? 'primary' : 'ghost'}>
            <Waves className="size-4" />
            {t('weatherShared.coolingPlaces')}
          </Button>
          <Button as={Link} to="/safety-plan" variant="ghost">
            <ShieldCheck className="size-4" />
            {t('weatherShared.safetyPlan')}
          </Button>
        </div>
      </div>

      {highHeat && (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            [t('weatherShared.drinkWater'), HeartPulse],
            [t('weatherShared.sunShade'), Info],
            [t('weatherShared.signs'), ShieldCheck],
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
              <p className="font-black text-navy">{new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(day.date))}</p>
              <p className="mt-1 text-sm font-bold text-muted">
                {formatTemp(Math.round(day.max), 'C')} / {formatTemp(Math.round(day.min), 'C')}
              </p>
            </div>
          ))}
          <p className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">
            <Moon className="size-5 shrink-0 text-ocean" />
            {t('heatStatus.warmNights')}
          </p>
          <p className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">
            <Users className="size-5 shrink-0 text-ocean" />
            {t('heatStatus.checkFriends')}
          </p>
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-white p-4">
        <p className="text-sm font-black text-navy">{t('weatherShared.officialInfo')}</p>
        <a
          href="https://www.bom.gov.au/weather-and-climate/specialised-forecasts-and-observations/heatwave"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-black text-ocean underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-ocean"
        >
          {t('weatherShared.officialLink')}
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
        <p className="mt-2 text-xs font-bold text-muted">{t('weatherShared.officialWarnings')}</p>
      </div>
    </Card>
  )
}
