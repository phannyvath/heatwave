import { useTranslation } from 'react-i18next'

export default function MapsDirectionsLink({ start, destination, method }) {
  const { t } = useTranslation()
  const params = new URLSearchParams({ api: '1', origin: `${start.latitude},${start.longitude}`, destination: `${destination.latitude},${destination.longitude}`, travelmode: { TRANSIT: 'transit', DRIVE: 'driving', WALK: 'walking', BICYCLE: 'bicycling' }[method] })
  return <div className="space-y-2">
    <a className="text-sm font-bold underline" href={`https://www.google.com/maps/dir/?${params}`} target="_blank" rel="noreferrer">{t('routePlanner.openMaps')}</a>
    <p className="text-xs">{t('routePlanner.mapsNote')}</p>
  </div>
}
