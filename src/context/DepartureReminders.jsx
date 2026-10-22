import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Clock, X } from 'lucide-react'
import AccessibleModal from '../components/AccessibleModal.jsx'
import Button from '../components/Button.jsx'
import DemoDirectionsModal from '../components/DemoDirectionsModal.jsx'
import TravelRecommendationModal from '../components/TravelRecommendationModal.jsx'

const STORAGE_KEY = 'heatsafe-departure-reminders-v1'
const Context = createContext(null)
const modes = { TRANSIT: 'Public transport', WALK: 'Walking', DRIVE: 'Driving', BICYCLE: 'Cycling' }
const localDate = value => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const validPlan = plan => plan && typeof plan.id === 'string' && plan.form && plan.places?.destination?.name && plan.places?.start && Number.isFinite(Date.parse(plan.checkedAt))
function readStore() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return { plans: (value?.plans || []).filter(validPlan), reminders: (value?.reminders || []).filter(r => typeof r.id === 'string' && validPlan(r.plan) && Number.isFinite(r.departure) && ['active', 'completed'].includes(r.status)).map(r => ({ ...r, notificationsEnabled: r.notificationsEnabled !== false })) }
  } catch { return { plans: [], reminders: [] } }
}
export function DepartureRemindersProvider({ children }) {
  const [store, setStore] = useState(readStore)
  const storeRef = useRef(store)
  const [overlay, setOverlay] = useState(null)
  const [toast, setToast] = useState('')
  const [now, setNow] = useState(Date.now())
  const commit = useCallback(next => {
    // Persist before changing the UI or presenting a departure alert.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    storeRef.current = next
    setStore(next)
  }, [])
  const savePlan = useCallback(plan => {
    const current = storeRef.current
    try { commit({ ...current, plans: [...current.plans.filter(p => p.id !== plan.id), plan] }) }
    catch { setToast('Your travel plan could not be saved on this device.') }
  }, [commit])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const timer = setInterval(tick, 1000)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    const sync = event => { if (event.key === STORAGE_KEY) { const next = readStore(); storeRef.current = next; setStore(next) } }
    window.addEventListener('storage', sync)
    return () => { clearInterval(timer); window.removeEventListener('focus', tick); document.removeEventListener('visibilitychange', tick); window.removeEventListener('storage', sync) }
  }, [])
  useEffect(() => {
    if (overlay || document.visibilityState === 'hidden' || document.querySelector('dialog[open]')) return
    const due = storeRef.current.reminders.filter(r => r.status === 'active' && r.notificationsEnabled && r.departure <= now).sort((a, b) => a.departure - b.departure)[0]
    if (!due) return
    try {
      commit({ ...storeRef.current, reminders: storeRef.current.reminders.map(r => r.id === due.id ? { ...r, status: 'completed' } : r) })
      setOverlay({ type: 'due', reminder: due })
    } catch { setToast('Unable to save reminder status. Please enable local storage.') }
  }, [now, overlay, commit])
  const addReminder = (plan, departure) => {
    if (!Number.isFinite(departure) || departure <= Date.now()) return 'Choose a departure date and time in the future.'
    const current = storeRef.current
    if (current.reminders.some(r => r.plan.id === plan.id && r.departure === departure)) return 'A reminder already exists for this travel plan and departure time.'
    try {
      commit({ plans: [...current.plans.filter(p => p.id !== plan.id), plan], reminders: [...current.reminders, { id: crypto.randomUUID(), plan, departure, status: 'active', notificationsEnabled: true }] })
      setOverlay(null)
      setToast(plan.recommendation ? 'Departure reminder added to your notifications.' : 'Departure time saved. Manage your reminder in the bell.')
      return ''
    } catch { return 'Unable to save this reminder. Please enable local storage and try again.' }
  }
  const deleteReminder = id => {
    try {
      commit({ ...storeRef.current, reminders: storeRef.current.reminders.filter(r => r.id !== id) })
      setToast('Departure reminder deleted')
    } catch { setToast('Unable to delete this reminder. Please try again.') }
  }
  const toggleNotifications = id => {
    const current = storeRef.current
    const reminder = current.reminders.find(r => r.id === id)
    if (!reminder) return
    const enabled = !reminder.notificationsEnabled
    if (enabled && (reminder.departure <= Date.now() || reminder.status === 'completed')) {
      setToast('Choose a future departure time to enable notifications.')
      return
    }
    try { commit({ ...current, reminders: current.reminders.map(r => r.id === id ? { ...r, notificationsEnabled: enabled } : r) }) }
    catch { setToast('Unable to save notification settings. Please try again.') }
  }
  const value = { reminders: store.reminders, upcomingCount: store.reminders.filter(r => r.notificationsEnabled && r.status === 'active' && r.departure > now).length, latestPlan: store.plans.at(-1), now, savePlan, deleteReminder, toggleNotifications, viewPlan: (plan, departure) => setOverlay({ type: 'plan', plan, departure }) }
  return <Context.Provider value={value}>
    {children}
    {overlay?.type === 'due' && <AccessibleModal title={`Time to leave for ${overlay.reminder.plan.places.destination.name}`} onClose={() => setOverlay(null)}>
      <p className="text-lg leading-7">Your planned departure for {overlay.reminder.plan.places.destination.name} is now.</p>
      <p>{modes[overlay.reminder.plan.form.method]} · {localDate(overlay.reminder.departure)}</p>
      <div className="flex flex-wrap gap-3"><Button onClick={() => setOverlay({ type: 'plan', plan: overlay.reminder.plan, departure: overlay.reminder.departure })}>View travel plan</Button><Button variant="ghost" onClick={() => setOverlay(null)}>Dismiss</Button></div>
    </AccessibleModal>}
    {overlay?.type === 'plan' && (overlay.plan.recommendation ? <TravelRecommendationModal plan={overlay.plan} onClose={() => setOverlay(null)} onSave={addReminder} /> : <DemoDirectionsModal plan={overlay.plan} destination={overlay.plan.places.destination} departureTime={overlay.departure} onClose={() => setOverlay(null)} onSave={addReminder} />)}
    {toast && createPortal(<p role="status" className="reminder-toast">{toast}</p>, document.body)}
  </Context.Provider>
}

export function useDepartureReminders() { return useContext(Context) }

export function NotificationBell() {
  const { reminders, upcomingCount, now, deleteReminder, toggleNotifications, viewPlan } = useDepartureReminders()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 80, right: 12 })
  const buttonRef = useRef(null)
  const popoverRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const positionPopover = () => {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 8, right: Math.min(Math.max(12, window.innerWidth - rect.right), Math.max(12, window.innerWidth - Math.min(440, window.innerWidth - 24) - 12)) })
    }
    positionPopover()
    window.addEventListener('resize', positionPopover)
    window.addEventListener('scroll', positionPopover, true)
    popoverRef.current?.querySelector('button')?.focus({ preventScroll: true })
    const outside = event => { if (!popoverRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) setOpen(false) }
    const escape = event => { if (event.key === 'Escape') { setOpen(false); buttonRef.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    const focus = event => { if (!popoverRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('focusin', focus)
    return () => { window.removeEventListener('resize', positionPopover); window.removeEventListener('scroll', positionPopover, true); document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); document.removeEventListener('focusin', focus) }
  }, [open])
  return <>
    <button ref={buttonRef} data-reminder-bell type="button" aria-label={`Departure reminders, ${upcomingCount} upcoming enabled`} aria-expanded={open} aria-controls="departure-notifications" aria-haspopup="dialog" onClick={() => setOpen(!open)} className="relative grid size-11 shrink-0 place-items-center rounded-full border border-orange-200 bg-cream text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-ocean">
      <Bell size={22} aria-hidden="true" /><span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-danger px-1 text-xs font-black text-white" aria-hidden="true">{upcomingCount}</span>
    </button>
    {open && createPortal(<div ref={popoverRef} id="departure-notifications" role="dialog" aria-label="Departure reminders" className="reminder-popover" style={{ ...position, maxHeight: `calc(100dvh - ${position.top + 12}px)` }}>
      <header className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Departure reminders</h2><button type="button" className="reminder-close" aria-label="Close departure reminders" onClick={() => { setOpen(false); buttonRef.current?.focus() }}><X aria-hidden="true" /></button></header>
      {reminders.length === 0 ? <p className="py-6">No departure reminders</p> : <ul className="mt-4 space-y-3">{[...reminders].sort((a, b) => a.departure - b.departure).map(reminder => <li key={reminder.id} className="rounded-2xl border border-orange-200 bg-cream p-4">
        <h3 className="font-extrabold overflow-wrap-anywhere">{reminder.plan.places.destination.name}</h3>
        <p className="mt-1">{modes[reminder.plan.form.method]}</p>
        <time dateTime={new Date(reminder.departure).toISOString()} className="mt-2 block">{localDate(reminder.departure)}</time>
        <p className="mt-2 flex items-center gap-2 font-bold"><Clock size={18} aria-hidden="true" />{reminder.status === 'completed' ? 'Notification completed' : reminder.departure <= now ? 'Departure time passed' : `Leaves in ${Math.ceil((reminder.departure - now) / 60000)} ${Math.ceil((reminder.departure - now) / 60000) === 1 ? 'minute' : 'minutes'}`}</p>
        <button type="button" role="switch" aria-checked={reminder.notificationsEnabled} aria-label={`Notifications for ${reminder.plan.places.destination.name}`} onClick={() => toggleNotifications(reminder.id)} className="notification-switch mt-3">
          <span>Notifications</span><span className={`notification-switch-track ${reminder.notificationsEnabled ? 'enabled' : ''}`} aria-hidden="true"><span /></span><span aria-hidden="true">{reminder.notificationsEnabled ? 'On' : 'Off'}</span>
        </button>
        <div className="mt-3 flex flex-wrap gap-2"><Button variant="ghost" onClick={() => { setOpen(false); buttonRef.current?.focus(); viewPlan(reminder.plan, reminder.departure) }}>View travel plan</Button><Button variant="ghost" onClick={() => { deleteReminder(reminder.id); popoverRef.current?.querySelector('button')?.focus({ preventScroll: true }) }}>Delete reminder</Button></div>
      </li>)}</ul>}
      <p className="mt-4 text-sm text-muted">Demo notifications appear while HeatSafe is open.</p>
    </div>, document.body)}
  </>
}
