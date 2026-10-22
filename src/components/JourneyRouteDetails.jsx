import { useTranslation } from 'react-i18next'
import MapsDirectionsLink from './MapsDirectionsLink.jsx'
import { formatTemp } from '../utils/temperature.js'

export default function JourneyRouteDetails({ journey, timezone, locale, tempUnit, start, destination, method }) {
  const { t } = useTranslation()
  const format = (epoch) => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(epoch))
  const route = journey.recommended

  return <div className="mt-4 space-y-4">
    <div className="overflow-x-auto rounded-xl border border-cocoa/20 bg-white/80">
      <table className="w-full text-left text-sm">
        <caption className="p-3 text-left font-bold">{t('routePlanner.comparisonTitle')}</caption>
        <thead><tr><th className="p-3" scope="col">{t('routePlanner.option')}</th><th className="p-3" scope="col">{t('routePlanner.selected')}</th><th className="p-3" scope="col">{t('routePlanner.suggested')}</th></tr></thead>
        <tbody>{[
          ['departure', (r) => format(r.departure)], ['arrival', (r) => format(r.arrival)],
          ['duration', (r) => t('routePlanner.minutes', { count: r.durationMinutes })],
          ['peak', (r) => formatTemp(r.apparentTemperature, tempUnit)],
          ['uv', (r) => r.uvIndex.toFixed(1)],
          ['outdoors', (r) => Number.isFinite(r.outdoorMinutes) ? t('routePlanner.minutes', { count: r.outdoorMinutes }) : t('routePlanner.unknown')],
        ].map(([key, value]) => <tr key={key} className="border-t border-cocoa/10"><th scope="row" className="p-3 font-semibold">{t(`routePlanner.${key}`)}</th><td className="p-3">{value(journey.selected)}</td><td className="p-3">{value(route)}</td></tr>)}</tbody>
      </table>
    </div>
    <p className="text-sm">{t('routePlanner.coverage', { checked: journey.assessedCount, total: journey.requestedCount })}</p>
    <p className="text-xs leading-5">{t('routePlanner.exposureNote')}</p>
    {route.instructions?.length > 0 && <details className="rounded-xl bg-white/80 p-3 text-sm">
      <summary className="cursor-pointer font-bold">{t('routePlanner.directions')}</summary>
      <ol className="mt-3 list-decimal space-y-2 pl-5">{route.instructions.map((instruction, index) => <li key={index}>{instruction}</li>)}</ol>
    </details>}
    {route.warnings.map((warning, i) => <p key={i} className="text-sm font-semibold">{warning}</p>)}
    {['WALK', 'BICYCLE'].includes(method) && <p className="text-xs">{t('routePlanner.routeWarning')}</p>}
    <MapsDirectionsLink start={start} destination={destination} method={method} />
    <p className="text-xs">{t('routePlanner.estimateNote')}</p>
    <p className="text-xs">{t('routePlanner.attribution')} <a className="underline" href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p>
  </div>
}
