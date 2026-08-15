import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  Gauge,
  Map,
  Menu,
  PhoneCall,
  Route,
  ShieldAlert,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './Button.jsx'
import LanguageMenu from './LanguageMenu.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import logo from '../assets/images/logo.png'

const navItems = [
  { labelKey: 'nav.dashboard', path: '/', icon: Gauge },
  { labelKey: 'nav.heatRisk', path: '/heat-risk', icon: ShieldAlert },
  { labelKey: 'nav.coolPlaces', path: '/cool-places', icon: Map },
  { labelKey: 'nav.travelPlanner', path: '/travel-planner', icon: Route },
  { labelKey: 'nav.safetyPlan', path: '/safety-plan', icon: ClipboardCheck },
  { labelKey: 'nav.learn', path: '/learn', icon: BookOpen },
  { labelKey: 'nav.emergencyHelp', path: '/emergency-help', icon: PhoneCall },
]

function NavItem({ item, compact = false, onClick }) {
  const Icon = item.icon
  const { t } = useTranslation()
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
          compact ? 'flex-col gap-1 rounded-xl px-2 py-2 text-[0.68rem]' : ''
        } ${
          isActive
            ? 'bg-navy text-white shadow-md shadow-slate-300'
            : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
        }`
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className={compact ? 'leading-tight' : ''}>{t(item.labelKey)}</span>
    </NavLink>
  )
}

export default function Layout() {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [prefs, setPrefs] = useLocalStorage('heatsafe-preferences', {
    tempUnit: window.localStorage.getItem('heatSafe.temperatureUnit') || 'celsius',
    largeText: false,
  })
  const navigate = useNavigate()

  return (
    <div className={`min-h-screen bg-cream text-cocoa ${prefs.largeText ? 'text-[18px]' : ''}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow-soft"
      >
        {t('app.skip')}
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-orange-100 bg-white px-5 py-6 lg:block">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="HeatSafe Student logo"
            className="size-12 rounded-2xl object-contain"
          />
          <div>
            <p className="text-lg font-black text-navy">{t('app.name')}</p>
            <p className="text-xs font-medium text-slate-500">{t('app.tagline')}</p>
          </div>
        </div>
        <nav className="mt-8 space-y-2" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-[1.4rem] border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-bold text-navy">{t('header.emergencyAustralia')}</p>
          <p className="mt-1 text-sm text-slate-600">{t('header.tripleZero')}</p>
          <Button className="mt-4 w-full" variant="danger" onClick={() => navigate('/emergency-help')}>
            <PhoneCall className="size-4" aria-hidden="true" />
            {t('header.getHelp')}
          </Button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-orange-100 bg-white/95 px-4 py-3 backdrop-blur lg:ml-72">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <button
            className="grid size-11 place-items-center rounded-full border border-slate-200 text-navy lg:hidden"
            aria-label={t('header.openMenu')}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <img src={logo} alt="HeatSafe Student logo" className="size-9 rounded-xl object-contain lg:hidden" />
            <p className="truncate text-sm font-bold text-navy lg:hidden">{t('app.name')}</p>
            <p className="hidden text-sm font-medium text-slate-500 sm:block">
              {t('app.demoGuidance')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageMenu />
            <button
              className="grid size-11 place-items-center rounded-full bg-danger text-white shadow-sm"
              onClick={() => navigate('/emergency-help')}
              aria-label={t('header.emergencyHelp')}
            >
              <PhoneCall className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-navy/40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-full w-[min(22rem,88vw)] bg-white p-5 shadow-soft"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={logo}
                    alt="HeatSafe Student logo"
                    className="size-10 rounded-xl object-contain"
                  />
                  <p className="truncate text-lg font-black text-navy">{t('app.name')}</p>
                </div>
                <button
                  className="grid size-10 place-items-center rounded-full border border-slate-200"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label={t('header.closeMenu')}
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="mt-6 space-y-2" aria-label="Mobile menu">
                {navItems.map((item) => (
                  <NavItem key={item.path} item={item} onClick={() => setMobileMenuOpen(false)} />
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content" className="pb-24 lg:ml-72 lg:pb-8">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Outlet context={{ prefs, setPrefs }} />
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] lg:hidden"
        aria-label="Bottom navigation"
      >
        {navItems.slice(0, 4).map((item) => (
          <NavItem key={item.path} item={item} compact />
        ))}
      </nav>

      <div className="fixed bottom-24 right-4 z-20 lg:bottom-5">
        <Button variant="danger" onClick={() => navigate('/emergency-help')} className="shadow-lg shadow-orange-200">
          <AlertCircle className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('nav.emergencyHelp')}</span>
          <span className="sm:hidden">{t('header.getHelp')}</span>
        </Button>
      </div>
    </div>
  )
}
