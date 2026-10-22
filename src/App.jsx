import React, { lazy, Suspense, useCallback, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout.jsx'
import { DepartureRemindersProvider } from './context/DepartureReminders.jsx'
import SplashOnboarding from './components/SplashOnboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import HeatRisk from './pages/HeatRisk.jsx'
import CoolPlaces from './pages/CoolPlaces.jsx'
import TravelPlanner from './pages/TravelPlanner.jsx'
import SafetyPlan from './pages/SafetyPlan.jsx'
import Learn from './pages/Learn.jsx'
import EmergencyHelp from './pages/EmergencyHelp.jsx'

const WeatherPreview = import.meta.env.DEV ? lazy(() => import('./dev/WeatherPreview.jsx')) : null

function PageTransition({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => window.localStorage.getItem('heatsafe-onboarding-complete') === 'true',
  )
  const [introSeen, setIntroSeen] = useState(false)
  const completeIntro = useCallback(() => {
    setOnboardingComplete(true)
    setIntroSeen(true)
  }, [])

  if (WeatherPreview && location.pathname === '/__dev/weather') {
    return <Suspense fallback={<p className="p-6">Loading development preview…</p>}><WeatherPreview /></Suspense>
  }

  if (!introSeen || !onboardingComplete) {
    return <SplashOnboarding showOnboarding={!onboardingComplete} onComplete={completeIntro} />
  }

  return (
    <DepartureRemindersProvider>
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route index element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="heat-risk" element={<PageTransition><HeatRisk /></PageTransition>} />
          <Route path="cool-places" element={<PageTransition><CoolPlaces /></PageTransition>} />
          <Route path="travel-planner" element={<PageTransition><TravelPlanner /></PageTransition>} />
          <Route path="safety-plan" element={<PageTransition><SafetyPlan /></PageTransition>} />
          <Route path="learn" element={<PageTransition><Learn /></PageTransition>} />
          <Route path="emergency-help" element={<PageTransition><EmergencyHelp /></PageTransition>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
    </DepartureRemindersProvider>
  )
}
