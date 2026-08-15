import { useState } from 'react'
import { HeartPulse, Info, PhoneCall, UserRoundCheck } from 'lucide-react'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'

const options = [
  {
    id: 'advice',
    title: 'I need general safety advice',
    icon: Info,
    tone: 'navy',
    body: 'Move to a cooler place, drink water, avoid outdoor activity, and check on friends or housemates.',
  },
  {
    id: 'unwell',
    title: 'I feel unwell',
    icon: HeartPulse,
    tone: 'high',
    body: 'Stop activity, move to air conditioning or shade, sip water, loosen tight clothing, and contact a health professional if symptoms continue.',
  },
  {
    id: 'emergency',
    title: 'This may be an emergency',
    icon: PhoneCall,
    tone: 'danger',
    body: 'Call Triple Zero (000) for emergency assistance in Australia.',
  },
]

export default function EmergencyHelp() {
  const [selected, setSelected] = useState('emergency')
  const [confirmCall, setConfirmCall] = useState(false)
  const current = options.find((option) => option.id === selected)

  return (
    <div className="space-y-5">
      <div>
        <Badge tone="danger">Emergency Help</Badge>
        <h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">Choose the situation</h1>
        <p className="mt-2 max-w-3xl text-slate-600">This prototype provides general information and does not replace professional medical advice.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {options.map((option, index) => {
          const Icon = option.icon
          return (
            <button
              key={option.id}
              className={`rounded-[1.4rem] border bg-white p-5 text-left shadow-soft transition hover:-translate-y-1 ${selected === option.id ? 'border-ocean ring-2 ring-blue-100' : 'border-slate-200'}`}
              onClick={() => setSelected(option.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`grid size-12 place-items-center rounded-2xl ${option.id === 'emergency' ? 'bg-orange-50 text-danger' : option.id === 'unwell' ? 'bg-orange-50 text-heat' : 'bg-skysoft text-ocean'}`}>
                  <Icon className="size-6" />
                </div>
                <span className="text-sm font-black text-slate-400">{index + 1}</span>
              </div>
              <h2 className="mt-4 text-lg font-black text-navy">{option.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{option.body}</p>
            </button>
          )
        })}
      </div>

      <Card className={`p-6 ${selected === 'emergency' ? 'border-orange-200 bg-orange-50' : ''}`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge tone={current.tone}>{current.title}</Badge>
            <p className={`mt-4 text-2xl font-black ${selected === 'emergency' ? 'text-danger' : 'text-navy'}`}>{current.body}</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              If you are unsure and symptoms are serious, seek urgent help. Heat illness can worsen quickly.
            </p>
          </div>
          <Button variant={selected === 'emergency' ? 'danger' : 'primary'} onClick={() => setConfirmCall(true)} className="w-full md:w-auto">
            <PhoneCall className="size-4" />
            Call 000
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-black text-navy">Other helpful contacts</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {['Healthdirect: 1800 022 222', 'Campus security', 'A trusted person', 'Nearest medical service'].map((item) => (
            <p key={item} className="flex items-center gap-3 rounded-2xl bg-cream p-4 text-sm font-bold text-slate-700">
              <UserRoundCheck className="size-5 text-ocean" />
              {item}
            </p>
          ))}
        </div>
      </Card>

      {confirmCall && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa/40 px-4">
          <Card className="max-w-sm p-5">
            <h2 className="text-xl font-black text-navy">Call Triple Zero?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Only call 000 if someone may need urgent police, fire, or ambulance help.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="ghost" onClick={() => setConfirmCall(false)}>
                Cancel
              </Button>
              <Button variant="danger" as="a" href="tel:000">
                <PhoneCall className="size-4" />
                Yes, call 000
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
