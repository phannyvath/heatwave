import Card from '../Card.jsx'
import { useTranslation } from 'react-i18next'

export default function WeatherSkeleton() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <p className="text-sm font-bold text-muted">{t('weatherShared.checking')}</p>
      <Card className="p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded-full bg-orange-100" />
          <div className="h-12 w-40 rounded-full bg-orange-100" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 rounded-2xl bg-orange-50" />
            <div className="h-20 rounded-2xl bg-orange-50" />
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 min-w-24 animate-pulse rounded-2xl bg-orange-50" />
          ))}
        </div>
      </Card>
    </div>
  )
}
