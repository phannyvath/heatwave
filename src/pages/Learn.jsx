import { useState } from 'react'
import { ChevronDown, GraduationCap } from 'lucide-react'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { learnTopics } from '../data/mockData.js'

export default function Learn() {
  const [open, setOpen] = useState('What an Australian heatwave is')
  const [answers, setAnswers] = useState({})

  return (
    <div className="space-y-5">
      <div>
        <Badge tone="navy">Plain English learning</Badge>
        <h1 className="mt-3 text-2xl font-black text-navy sm:text-3xl">Learn</h1>
        <p className="mt-2 max-w-3xl text-slate-600">Short explanations and quick quizzes for international students in Australia.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {learnTopics.map((topic) => {
          const Icon = topic.icon
          const isOpen = open === topic.title
          return (
            <Card key={topic.title} className="overflow-hidden">
              <button className="flex w-full items-start gap-4 p-5 text-left" onClick={() => setOpen(isOpen ? '' : topic.title)} aria-expanded={isOpen}>
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-skysoft text-ocean">
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-navy">{topic.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{topic.body}</p>
                </div>
                <ChevronDown className={`size-5 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                  <p className="text-sm font-bold text-navy">{topic.quiz}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => setAnswers({ ...answers, [topic.title]: topic.answer })}>
                      <GraduationCap className="size-4" />
                      Show answer
                    </Button>
                  </div>
                  {answers[topic.title] && (
                    <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-semibold text-safe">Answer: {answers[topic.title]}</p>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-black text-navy">Australian emergency terminology</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <p className="rounded-2xl bg-slate-50 p-4 text-sm"><strong>Triple Zero (000):</strong> call for police, fire, or ambulance emergencies.</p>
          <p className="rounded-2xl bg-slate-50 p-4 text-sm"><strong>Ambulance:</strong> medical emergency transport and urgent care.</p>
          <p className="rounded-2xl bg-slate-50 p-4 text-sm"><strong>GP:</strong> a general practitioner, often the first doctor for non-emergency health concerns.</p>
        </div>
      </Card>
    </div>
  )
}
