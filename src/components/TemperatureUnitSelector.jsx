import { useTranslation } from 'react-i18next'

const units = [
  { value: 'celsius', labelKey: 'temperature.celsius' },
  { value: 'fahrenheit', labelKey: 'temperature.fahrenheit' },
]

export default function TemperatureUnitSelector({ value, onChange }) {
  const { t } = useTranslation()

  return (
    <div
      className="inline-flex min-h-10 rounded-full border border-orange-200 bg-cream p-1"
      role="group"
      aria-label={t('temperature.label')}
    >
      {units.map((unit) => {
        const active = value === unit.value || (value === 'C' && unit.value === 'celsius') || (value === 'F' && unit.value === 'fahrenheit')
        return (
          <button
            key={unit.value}
            type="button"
            className={`min-h-10 min-w-10 rounded-full px-3 text-sm font-black transition duration-150 focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2 ${
              active ? 'bg-ocean text-white shadow-sm' : 'text-navy hover:bg-orange-50'
            }`}
            onClick={() => onChange(unit.value)}
            aria-pressed={active}
          >
            {t(unit.labelKey)}
          </button>
        )
      })}
    </div>
  )
}
