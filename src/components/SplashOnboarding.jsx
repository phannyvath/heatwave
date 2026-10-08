import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Navigation, ShieldCheck, Sun } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Button from './Button.jsx'
import logo from '../assets/images/logo.png'

const slides = [
  {
    title: "Understand Today's Heat",
    body: 'See the temperature, heat risk and personalised advice for your day.',
    icon: Sun,
  },
  {
    title: 'Find a Cool Place',
    body: 'Discover nearby libraries, community centres and other comfortable places.',
    icon: MapPin,
  },
  {
    title: 'Plan Before You Go',
    body: 'Choose safer travel times and prepare what you need before leaving.',
    icon: Navigation,
  },
]

export default function SplashOnboarding({ onComplete, showOnboarding = true }) {
  const [showSplash, setShowSplash] = useState(true)
  const [index, setIndex] = useState(0)
  const [language, setLanguage] = useState('English')
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (showOnboarding) {
        setShowSplash(false)
      } else {
        onComplete()
      }
    }, reduceMotion ? 300 : 2000)
    return () => window.clearTimeout(timeout)
  }, [onComplete, reduceMotion, showOnboarding])

  function finish() {
    window.localStorage.setItem('heatsafe-onboarding-complete', 'true')
    onComplete()
  }

  const slide = slides[index]
  const Icon = slide.icon

  return (
    <div className="min-h-screen overflow-hidden bg-cream text-cocoa">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.section
            key="splash"
            className="relative grid min-h-screen place-items-center px-6"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,154,74,0.34),transparent_34%),radial-gradient(circle_at_12%_18%,rgba(255,225,199,0.8),transparent_28%)]" />
            <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(90deg,#4B3428_1px,transparent_1px),linear-gradient(#4B3428_1px,transparent_1px)] [background-size:28px_28px]" />
            {!reduceMotion && (
              <>
                <motion.span className="absolute left-[12%] top-[18%] h-10 w-20 rounded-full bg-white/80 shadow-soft" animate={{ y: [0, 12, 0] }} transition={{ duration: 5, repeat: Infinity }} />
                <motion.span className="absolute right-[10%] top-[28%] h-8 w-16 rounded-full bg-white/75 shadow-soft" animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity }} />
                <motion.span className="absolute bottom-[22%] left-[16%] h-7 w-4 rounded-full bg-safe/40" animate={{ rotate: [0, 10, -6, 0], y: [0, 10, 0] }} transition={{ duration: 4.8, repeat: Infinity }} />
              </>
            )}
            <div className="relative z-10 mx-auto max-w-sm text-center">
              <motion.img
                src={logo}
                alt="HeatSafe logo"
                className="mx-auto h-28 w-28 rounded-[2rem] object-contain drop-shadow-sm"
                animate={reduceMotion ? undefined : { scale: [1, 1.03, 1] }}
                transition={{ duration: 3.2, repeat: Infinity }}
              />
              <h1 className="mt-7 text-2xl font-black leading-tight">Please protect your health during this heatwave.</h1>
              <p className="mt-3 text-base leading-7 text-muted">Small steps can help you stay cool, comfortable and safe.</p>
            </div>
            <div className="absolute bottom-10 left-0 right-0 text-center">
              <div className="mx-auto mb-3 h-2 w-32 overflow-hidden rounded-full bg-white shadow-inner">
                <motion.span className="block h-full rounded-full bg-ocean" animate={reduceMotion ? undefined : { x: ['-100%', '100%'] }} transition={{ duration: 1.4, repeat: Infinity }} />
              </div>
              <p className="text-sm font-bold text-muted">Preparing your heat-safety guide...</p>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="onboarding"
            className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
          >
            <div className="flex items-center justify-between">
              <img src={logo} alt="HeatSafe logo" className="h-12 w-12 rounded-2xl object-contain" />
              <button className="rounded-full px-4 py-2 text-sm font-black text-muted" onClick={finish}>
                Skip
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center py-8">
              <div className="rounded-[2rem] bg-white p-5 shadow-soft">
                <div className="grid min-h-56 place-items-center rounded-[1.5rem] bg-skysoft/70">
                  <div className="relative grid size-36 place-items-center rounded-full bg-white text-ocean shadow-soft">
                    <Icon className="size-16" aria-hidden="true" />
                    <span className="absolute -right-2 bottom-6 grid size-11 place-items-center rounded-full bg-safe text-white">
                      <ShieldCheck className="size-6" aria-hidden="true" />
                    </span>
                  </div>
                </div>
                <h2 className="mt-7 text-3xl font-black leading-tight">{slide.title}</h2>
                <p className="mt-3 text-base leading-7 text-muted">{slide.body}</p>
              </div>

              <div className="mt-5 flex justify-center gap-2" aria-label="Onboarding progress">
                {slides.map((item, dotIndex) => (
                  <span key={item.title} className={`h-2 rounded-full transition-all ${dotIndex === index ? 'w-8 bg-ocean' : 'w-2 bg-skysoft'}`} />
                ))}
              </div>

              {index === slides.length - 1 && (
                <div className="mt-5 rounded-[1.5rem] bg-white p-4 shadow-soft">
                  <label className="block">
                    <span className="text-sm font-black text-cocoa">Language</span>
                    <select
                      className="mt-2 w-full rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-bold text-cocoa outline-none focus:border-ocean"
                      value={language}
                      onChange={(event) => setLanguage(event.target.value)}
                    >
                      {['English', 'Khmer', 'Simplified Chinese', 'Hindi', 'Vietnamese'].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <p className="mt-4 text-sm leading-6 text-muted">
                    You can choose your location after onboarding so HeatSafe can show local weather when you are ready.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-3">
              <Button variant="ghost" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
                <ChevronLeft className="size-4" />
                Back
              </Button>
              {index < slides.length - 1 ? (
                <Button onClick={() => setIndex(index + 1)}>
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button onClick={finish}>Start Staying Safe</Button>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
