export default function ProgressCircle({ value }) {
  const safeValue = Math.min(100, Math.max(0, value))
  return (
    <div
      className="grid size-24 place-items-center rounded-full"
      style={{ background: `conic-gradient(#11845B ${safeValue}%, #E2E8F0 ${safeValue}% 100%)` }}
      role="img"
      aria-label={`Preparation checklist ${safeValue}% complete`}
    >
      <div className="grid size-[4.7rem] place-items-center rounded-full bg-white text-center">
        <span className="text-xl font-bold text-navy">{safeValue}%</span>
        <span className="-mt-1 text-[0.65rem] font-semibold uppercase text-slate-500">ready</span>
      </div>
    </div>
  )
}
