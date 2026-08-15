import { Clock, Route } from 'lucide-react'
import Card from '../Card.jsx'
import { getTravelSuggestion } from '../../utils/heatRisk.js'
import { formatTemp } from '../../utils/temperature.js'

function formatTime(isoTime) {
  if (!isoTime) return 'Later today'
  return new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit' }).format(new Date(isoTime))
}

export default function TravelSuggestion({ hourly, prefs }) {
  const suggestion = getTravelSuggestion(hourly)

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-skysoft text-ocean">
          <Route className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-navy">More comfortable travel time</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{suggestion.message}</p>
          {suggestion.hottestHour && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <p className="rounded-2xl bg-cream p-3 text-sm font-bold text-muted">
                <Clock className="mb-2 size-5 text-ocean" />
                Warmest upcoming: {formatTime(suggestion.hottestHour.time)}
              </p>
              <p className="rounded-2xl bg-cream p-3 text-sm font-bold text-muted">
                <Clock className="mb-2 size-5 text-ocean" />
                Suggested: {formatTime(suggestion.suggestedHour?.time)} at{' '}
                {formatTemp(Math.round(suggestion.suggestedHour?.apparentTemperature || 0), prefs.tempUnit)} feels-like
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
