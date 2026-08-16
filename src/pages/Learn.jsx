import { useState } from 'react'
import { ChevronDown, GraduationCap } from 'lucide-react'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { learnTopics } from '../data/mockData.js'
import { useTranslation } from 'react-i18next'

const topicKeys = ['heatwave', 'feels', 'uv', 'home', 'travel', 'uni', 'help', 'doctor']

export default function Learn() {
  const { t } = useTranslation()
  const [open, setOpen] = useState('heatwave')
  const [answers, setAnswers] = useState({})

  return (
    <div className="space-y-5">
      <div>
        <Badge tone="navy">{t('learn.badge')}</Badge>
        <h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">{t('learn.title')}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">{t('learn.intro')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {learnTopics.map((topic, index) => {
          const topicKey = topicKeys[index]
          const Icon = topic.icon
          const isOpen = open === topicKey
          return (
            <Card key={topicKey} className="overflow-hidden">
              <button className="flex w-full items-start gap-4 p-5 text-left" onClick={() => setOpen(isOpen ? '' : topicKey)} aria-expanded={isOpen}>
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-skysoft text-ocean">
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-navy">{t(`learn.topics.${topicKey}.title`)}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{t(`learn.topics.${topicKey}.body`)}</p>
                </div>
                <ChevronDown className={`size-5 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                  <p className="text-sm font-bold text-navy">{t(`learn.topics.${topicKey}.quiz`)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => setAnswers({ ...answers, [topicKey]: t(`learn.topics.${topicKey}.answer`) })}>
                      <GraduationCap className="size-4" />
                      {t('learn.showAnswer')}
                    </Button>
                  </div>
                  {answers[topicKey] && (
                    <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-semibold text-safe">{t('learn.answer', { answer: answers[topicKey] })}</p>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-black text-navy">{t('learn.terminology')}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <p className="rounded-2xl bg-slate-50 p-4 text-sm">{t('learn.terms.triple')}</p>
          <p className="rounded-2xl bg-slate-50 p-4 text-sm">{t('learn.terms.ambulance')}</p>
          <p className="rounded-2xl bg-slate-50 p-4 text-sm">{t('learn.terms.gp')}</p>
        </div>
      </Card>
    </div>
  )
}
