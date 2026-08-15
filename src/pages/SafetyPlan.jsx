import { useState } from 'react'
import { Edit3, Eye, Printer, Save, ShieldCheck } from 'lucide-react'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

const initialPlan = {
  home: 'Carlton student accommodation',
  university: 'Swinburne University',
  aircon: 'Sometimes',
  transport: 'Tram and train',
  contact: 'Asha - 04xx xxx xxx',
  coolPlace: 'State Library Victoria',
  medication: 'No regular reminder set',
  waterReminder: 'Every 45 minutes',
  healthConsiderations: 'None listed',
  alerts: 'SMS and app notifications',
}

export default function SafetyPlan() {
  const [savedPlan, setSavedPlan] = useLocalStorage('heatsafe-personal-plan', null)
  const [form, setForm] = useState(savedPlan || initialPlan)
  const [mode, setMode] = useState(savedPlan ? 'preview' : 'edit')
  const [success, setSuccess] = useState(false)

  function savePlan(event) {
    event.preventDefault()
    setSavedPlan(form)
    setSuccess(true)
    setMode('preview')
    window.setTimeout(() => setSuccess(false), 2200)
  }

  const plan = savedPlan || form

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="safe">Personal planning</Badge>
          <h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">Personal Safety Plan</h1>
          <p className="mt-2 text-slate-600">Create, save, preview, edit, or print your heatwave plan.</p>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            General safety guidance only. This app does not diagnose conditions or replace professional medical advice.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="ghost" onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}>
            {mode === 'edit' ? <Eye className="size-4" /> : <Edit3 className="size-4" />}
            {mode === 'edit' ? 'Preview' : 'Edit'}
          </Button>
          <Button variant="ghost" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>

      {success && <p className="rounded-2xl bg-emerald-50 p-4 font-semibold text-safe">Your safety plan has been saved to this device.</p>}

      {mode === 'edit' ? (
        <Card className="p-5">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={savePlan}>
            {[
              ['home', 'Home location'],
              ['university', 'University'],
              ['aircon', 'Availability of air conditioning'],
              ['transport', 'Normal transport method'],
              ['contact', 'Emergency contact'],
              ['coolPlace', 'Preferred cool place'],
              ['medication', 'Regular medication reminder'],
              ['waterReminder', 'Water reminder frequency'],
              ['healthConsiderations', 'Health considerations'],
              ['alerts', 'Notification preferences'],
            ].map(([key, label]) => (
              <label key={key} className={['alerts', 'healthConsiderations'].includes(key) ? 'md:col-span-2' : ''}>
                <span className="text-sm font-bold text-navy">{label}</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean focus:ring-2 focus:ring-blue-100"
                  value={form[key]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                />
              </label>
            ))}
            <div className="md:col-span-2">
              <Button type="submit">
                <Save className="size-4" />
                Save plan
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="bg-navy p-6 text-white">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-8" />
              <div>
                <h2 className="text-2xl font-black">Phanny's heatwave safety plan</h2>
                <p className="mt-1 text-blue-100">Saved cool location: {plan.coolPlace}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {[
              ['Recommended safe travel time', 'Before 10:30 AM or after 7:00 PM'],
              ['Saved cool location', plan.coolPlace],
              ['Emergency contact', plan.contact],
              ['Transport method', plan.transport],
              ['Medication reminder', plan.medication],
              ['Water reminder', plan.waterReminder],
              ['Health considerations', plan.healthConsiderations],
              ['Notifications', plan.alerts],
            ].map(([title, value]) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-500">{title}</p>
                <p className="mt-1 text-lg font-black text-navy">{value}</p>
              </div>
            ))}
            <div className="rounded-2xl bg-skysoft p-4">
              <h3 className="font-black text-navy">Preparation checklist</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>Carry water, sunscreen, hat, and charged phone.</li>
                <li>Check public transport disruptions before leaving.</li>
                <li>Save {plan.coolPlace} as your cooling stop.</li>
                <li>Tell {plan.contact.split('-')[0].trim()} your travel plan.</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-orange-50 p-4">
              <h3 className="font-black text-navy">Actions before a heatwave</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Close blinds early, chill water, prepare light meals, charge devices, and plan time in an air-conditioned place.</p>
              <h3 className="mt-4 font-black text-navy">Actions during a heatwave</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Stay indoors during peak heat, drink water regularly, avoid unnecessary outdoor travel, and seek help if you feel unwell.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
