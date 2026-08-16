import { Clock, Route } from 'lucide-react'
import Card from '../Card.jsx'
import { getTravelSuggestion } from '../../utils/heatRisk.js'
import { formatTemp } from '../../utils/temperature.js'
import { useTranslation } from 'react-i18next'

function formatTime(isoTime, locale = 'en') {
  if (!isoTime) return ''
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(isoTime))
}

export default function TravelSuggestion({ hourly, prefs }) {
  const { i18n, t } = useTranslation()
  const locale = i18n.resolvedLanguage || 'en'
  const suggestion = getTravelSuggestion(hourly)
  const message =
    suggestion.difference >= 2 && suggestion.suggestedHour
      ? t('weatherShared.leavingCooler', {
          time: formatTime(suggestion.suggestedHour.time, locale),
          difference: suggestion.difference,
        })
      : t('weatherShared.similarTravel')

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-skysoft text-ocean">
          <Route className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-navy">{t('weatherShared.travelTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{message}</p>
          {suggestion.hottestHour && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <p className="rounded-2xl bg-cream p-3 text-sm font-bold text-muted">
                <Clock className="mb-2 size-5 text-ocean" />
                {t('weatherShared.warmestUpcoming', { time: formatTime(suggestion.hottestHour.time, locale) })}
              </p>
              <p className="rounded-2xl bg-cream p-3 text-sm font-bold text-muted">
                <Clock className="mb-2 size-5 text-ocean" />
                {t('weatherShared.suggestedAt', {
                  time: formatTime(suggestion.suggestedHour?.time, locale),
                  temp: formatTemp(Math.round(suggestion.suggestedHour?.apparentTemperature || 0), prefs.tempUnit),
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
