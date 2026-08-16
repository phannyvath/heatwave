import { useState } from 'react'
import { HeartPulse, Info, PhoneCall, UserRoundCheck } from 'lucide-react'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { useTranslation } from 'react-i18next'

const options = [
  {
    id: 'advice',
    titleKey: 'emergency.options.advice.title',
    icon: Info,
    tone: 'navy',
    bodyKey: 'emergency.options.advice.body',
  },
  {
    id: 'unwell',
    titleKey: 'emergency.options.unwell.title',
    icon: HeartPulse,
    tone: 'high',
    bodyKey: 'emergency.options.unwell.body',
  },
  {
    id: 'emergency',
    titleKey: 'emergency.options.emergency.title',
    icon: PhoneCall,
    tone: 'danger',
    bodyKey: 'emergency.options.emergency.body',
  },
]

export default function EmergencyHelp() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState('emergency')
  const [confirmCall, setConfirmCall] = useState(false)
  const current = options.find((option) => option.id === selected)

  return (
    <div className="space-y-5">
      <div>
        <Badge tone="danger">{t('emergency.badge')}</Badge>
        <h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">{t('emergency.title')}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">{t('emergency.intro')}</p>
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
              <h2 className="mt-4 text-lg font-black text-navy">{t(option.titleKey)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t(option.bodyKey)}</p>
            </button>
          )
        })}
      </div>

      <Card className={`p-6 ${selected === 'emergency' ? 'border-orange-200 bg-orange-50' : ''}`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge tone={current.tone}>{t(current.titleKey)}</Badge>
            <p className={`mt-4 text-2xl font-black ${selected === 'emergency' ? 'text-danger' : 'text-navy'}`}>{t(current.bodyKey)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {t('emergency.unsure')}
            </p>
          </div>
          <Button variant={selected === 'emergency' ? 'danger' : 'primary'} onClick={() => setConfirmCall(true)} className="w-full md:w-auto">
            <PhoneCall className="size-4" />
            {t('emergency.call000')}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-black text-navy">{t('emergency.contactsTitle')}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <p key={index} className="flex items-center gap-3 rounded-2xl bg-cream p-4 text-sm font-bold text-slate-700">
              <UserRoundCheck className="size-5 text-ocean" />
              {t(`emergency.contacts.${index}`)}
            </p>
          ))}
        </div>
      </Card>

      {confirmCall && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa/40 px-4">
          <Card className="max-w-sm p-5">
            <h2 className="text-xl font-black text-navy">{t('emergency.confirmTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {t('emergency.confirmBody')}
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="ghost" onClick={() => setConfirmCall(false)}>
                {t('actions.cancel')}
              </Button>
              <Button variant="danger" as="a" href="tel:000">
                <PhoneCall className="size-4" />
                {t('emergency.yesCall')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
