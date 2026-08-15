const tones = {
  safe: 'bg-emerald-50 text-safe ring-emerald-200',
  high: 'bg-orange-50 text-heat ring-orange-200',
  danger: 'bg-orange-50 text-danger ring-orange-200',
  navy: 'bg-skysoft text-navy ring-orange-100',
  grey: 'bg-cream text-muted ring-orange-100',
}

export default function Badge({ children, tone = 'grey' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>
      {children}
    </span>
  )
}
