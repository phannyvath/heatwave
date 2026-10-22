import { useState } from 'react'
import { Bell, Clock } from 'lucide-react'
import AccessibleModal from './AccessibleModal.jsx'
import Button from './Button.jsx'
import { recommendationModes } from '../utils/demoRecommendation.js'

const time = epoch => new Date(epoch).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
const dateTime = epoch => new Date(epoch).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function TravelRecommendationModal({ plan, onClose, onSave }) {
  const [error, setError] = useState('')
  const { arrival, departure, durationMinutes } = plan.recommendation
  return <AccessibleModal title="Your travel recommendation" onClose={onClose}>
    <p className="font-bold text-danger">Demo travel estimates</p>
    <dl className="grid gap-4 sm:grid-cols-2">
      <div><dt className="font-bold">Destination</dt><dd className="overflow-wrap-anywhere">{plan.places.destination.name}</dd></div>
      <div><dt className="font-bold">Transportation</dt><dd>{recommendationModes[plan.form.method].label}</dd></div>
      <div><dt className="font-bold">Estimated journey duration</dt><dd>Approximately {durationMinutes} minutes</dd></div>
      <div><dt className="font-bold">Desired arrival time</dt><dd><time dateTime={new Date(arrival).toISOString()}>{dateTime(arrival)}</time></dd></div>
    </dl>
    <section className="rounded-2xl border border-orange-200 bg-skysoft p-5">
      <h3 className="flex items-start gap-2 text-2xl font-black"><Clock className="mt-1 shrink-0" aria-hidden="true" />Recommended departure: {time(departure)}</h3>
      <time className="mt-2 block font-bold" dateTime={new Date(departure).toISOString()}>{dateTime(departure)}</time>
      <p className="mt-3 text-lg">Leave at {time(departure)} to arrive by {time(arrival)}.</p>
    </section>
    <p className="text-sm text-muted">Departure is your desired arrival time minus the estimated journey duration. Demo estimates do not include live traffic or service schedules. Times use your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
    <p className="text-sm text-muted">Demo alerts work while HeatSafe is open.</p>
    {error && <p role="alert" className="font-bold text-danger">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => setError(departure <= Date.now() ? 'This recommended departure has passed. Go back to edit your arrival time.' : onSave(plan, departure))}><Bell size={20} aria-hidden="true" />Set departure reminder</Button>
      <Button variant="ghost" onClick={onClose}>Back to edit</Button>
    </div>
  </AccessibleModal>
}
