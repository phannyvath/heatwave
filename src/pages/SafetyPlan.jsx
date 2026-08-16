import { useEffect, useState } from 'react'
import { Edit3, Eye, Printer, Save, ShieldCheck } from 'lucide-react'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { useTranslation } from 'react-i18next'

const valueTranslationKeys = {
  'Carlton student accommodation': 'safetyValues.home',
  'Swinburne University': 'safetyValues.university',
  Sometimes: 'safetyValues.aircon',
  'Tram and train': 'safetyValues.transport',
  'Asha - 04xx xxx xxx': 'safetyValues.contact',
  'State Library Victoria': 'safetyValues.coolPlace',
  'No regular reminder set': 'safetyValues.medication',
  'Every 45 minutes': 'safetyValues.waterReminder',
  'None listed': 'safetyValues.healthConsiderations',
  'SMS and app notifications': 'safetyValues.alerts',
}

function translatedInitialPlan(t) {
  return {
    home: t('safetyValues.home'),
    university: t('safetyValues.university'),
    aircon: t('safetyValues.aircon'),
    transport: t('safetyValues.transport'),
    contact: t('safetyValues.contact'),
    coolPlace: t('safetyValues.coolPlace'),
    medication: t('safetyValues.medication'),
    waterReminder: t('safetyValues.waterReminder'),
    healthConsiderations: t('safetyValues.healthConsiderations'),
    alerts: t('safetyValues.alerts'),
  }
}

export default function SafetyPlan() {
  const { t } = useTranslation()
  const [savedPlan, setSavedPlan] = useLocalStorage('heatsafe-personal-plan', null)
  const [form, setForm] = useState(savedPlan || translatedInitialPlan(t))
  const [mode, setMode] = useState(savedPlan ? 'preview' : 'edit')
  const [success, setSuccess] = useState(false)

  function savePlan(event) {
    event.preventDefault()
    setSavedPlan(form)
    setSuccess(true)
    setMode('preview')
    window.setTimeout(() => setSuccess(false), 2200)
  }

  useEffect(() => {
    if (!savedPlan) setForm(translatedInitialPlan(t))
  }, [savedPlan, t])

  const plan = savedPlan || form
  const displayValue = (value) => (valueTranslationKeys[value] ? t(valueTranslationKeys[value]) : value)
  const displayPlan = Object.fromEntries(Object.entries(plan).map(([key, value]) => [key, displayValue(value)]))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="safe">{t('safety.badge')}</Badge>
          <h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">{t('safety.title')}</h1>
          <p className="mt-2 text-slate-600">{t('safety.intro')}</p>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            {t('safety.disclaimer')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="ghost" onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}>
            {mode === 'edit' ? <Eye className="size-4" /> : <Edit3 className="size-4" />}
            {mode === 'edit' ? t('safety.preview') : t('safety.edit')}
          </Button>
          <Button variant="ghost" onClick={() => window.print()}>
            <Printer className="size-4" />
            {t('safety.print')}
          </Button>
        </div>
      </div>

      {success && <p className="rounded-2xl bg-emerald-50 p-4 font-semibold text-safe">{t('safety.saved')}</p>}

      {mode === 'edit' ? (
        <Card className="p-5">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={savePlan}>
            {[
              ['home', t('safety.fields.home')],
              ['university', t('safety.fields.university')],
              ['aircon', t('safety.fields.aircon')],
              ['transport', t('safety.fields.transport')],
              ['contact', t('safety.fields.contact')],
              ['coolPlace', t('safety.fields.coolPlace')],
              ['medication', t('safety.fields.medication')],
              ['waterReminder', t('safety.fields.waterReminder')],
              ['healthConsiderations', t('safety.fields.healthConsiderations')],
              ['alerts', t('safety.fields.alerts')],
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
                {t('safety.savePlan')}
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
                <h2 className="text-2xl font-black">{t('safety.planTitle')}</h2>
                <p className="mt-1 text-blue-100">{t('safety.savedCoolLocation', { place: displayPlan.coolPlace })}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {[
              [t('safety.recommendedTravel'), t('safety.recommendedTravelValue')],
              [t('safety.summary.coolPlace'), displayPlan.coolPlace],
              [t('safety.summary.contact'), displayPlan.contact],
              [t('safety.summary.transport'), displayPlan.transport],
              [t('safety.summary.medication'), displayPlan.medication],
              [t('safety.summary.waterReminder'), displayPlan.waterReminder],
              [t('safety.summary.healthConsiderations'), displayPlan.healthConsiderations],
              [t('safety.summary.alerts'), displayPlan.alerts],
            ].map(([title, value]) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-500">{title}</p>
                <p className="mt-1 text-lg font-black text-navy">{value}</p>
              </div>
            ))}
            <div className="rounded-2xl bg-skysoft p-4">
              <h3 className="font-black text-navy">{t('safety.preparationChecklist')}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>{t('safety.checklist.0')}</li>
                <li>{t('safety.checklist.1')}</li>
                <li>{t('safety.checklist.2', { place: displayPlan.coolPlace })}</li>
                <li>{t('safety.checklist.3', { person: displayPlan.contact.split('-')[0].trim() })}</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-orange-50 p-4">
              <h3 className="font-black text-navy">{t('safety.actionsBefore')}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{t('safety.actionsBeforeBody')}</p>
              <h3 className="mt-4 font-black text-navy">{t('safety.actionsDuring')}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{t('safety.actionsDuringBody')}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
