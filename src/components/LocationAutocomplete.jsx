import { useEffect, useId, useRef, useState } from 'react'
import { CheckCircle2, LoaderCircle, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { searchJourneyPlaces } from '../services/placesService.js'

export default function LocationAutocomplete({ label, value, selection, onChange, onSelect, disabled, invalid, helperId }) {
  const { t } = useTranslation()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [response, setResponse] = useState({ query: '', items: [], status: 'idle' })
  const [retry, setRetry] = useState(0)
  const [composing, setComposing] = useState(false)
  const listRef = useRef(null)
  const query = value.trim()
  const current = response.query === query ? response : { items: [], status: query ? 'loading' : 'idle' }
  const expanded = open && !selection && Boolean(query)
  const options = expanded ? current.items : []
  const status = ['configuration', 'credentials'].includes(current.status) ? 'unavailable' : current.status

  useEffect(() => {
    if (!open || selection || !query || composing || disabled) return
    const controller = new AbortController()
    let cancelled = false
    setActive(-1)
    setResponse({ query, items: [], status: 'loading' })
    const timer = window.setTimeout(async () => {
      try {
        const items = await searchJourneyPlaces(query, { signal: controller.signal })
        if (!cancelled) setResponse({ query, items, status: items.length ? 'ready' : 'empty' })
      } catch (error) {
        if (!cancelled) setResponse({ query, items: [], status: error.code || 'unavailable' })
      }
    }, 300)
    return () => { cancelled = true; window.clearTimeout(timer); controller.abort() }
  }, [query, selection, open, composing, disabled, retry])

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [active])

  function select(place) {
    onSelect(place)
    setOpen(false)
    setActive(-1)
  }

  function keyDown(event) {
    if (event.nativeEvent.isComposing || composing) return
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setActive(-1) }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      if (options.length) setActive((index) => event.key === 'ArrowDown' ? (index + 1) % options.length : (index <= 0 ? options.length - 1 : index - 1))
    }
    if (event.key === 'Enter' && expanded) {
      event.preventDefault()
      if (active >= 0 && options[active]) select(options[active])
    }
  }

  return (
    <div className="relative min-w-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <label htmlFor={id} className="text-sm font-bold text-navy">{label}</label>
      <div className="relative mt-2">
        <MapPin className="pointer-events-none absolute left-3 top-3.5 size-5 text-muted" aria-hidden="true" />
        <input id={id} role="combobox" autoComplete="off" spellCheck={false} required disabled={disabled}
          aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? `${id}-list` : undefined}
          aria-activedescendant={expanded && active >= 0 && options[active] ? `${id}-option-${active}` : undefined}
          aria-describedby={selection ? `${id}-help` : helperId} aria-invalid={invalid || undefined}
          placeholder={t('places.placeholder')} value={value}
          className="w-full min-w-0 rounded-2xl border border-orange-200 bg-white py-3 pl-10 pr-10 text-cocoa outline-none focus:border-ocean focus:ring-2 focus:ring-orange-100"
          onFocus={() => setOpen(true)} onKeyDown={keyDown}
          onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)}
          onChange={(event) => { onChange(event.target.value); setActive(-1); setOpen(true) }} />
        {selection && <CheckCircle2 className="pointer-events-none absolute right-3 top-3.5 size-5 text-[#55753a]" aria-hidden="true" />}
      </div>
      {expanded && <div className="relative z-10 mt-2 overflow-hidden rounded-2xl border border-orange-200 bg-cream shadow-soft">
        <ul ref={listRef} id={`${id}-list`} role="listbox" aria-label={label} className="max-h-[min(16rem,40dvh)] overflow-y-auto overscroll-contain">
          {options.map((place, index) => <li key={place.placeId} id={`${id}-option-${index}`} role="option" aria-selected={index === active}
            className={`min-h-14 cursor-pointer border-b border-orange-100 px-4 py-3 text-sm ${index === active ? 'bg-skysoft' : 'hover:bg-orange-50'}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => select(place)}>
            <span className="block font-extrabold text-cocoa">{place.name}</span>
            <span className="mt-1 block break-words text-xs text-muted">{place.address}</span>
          </li>)}
        </ul>
        {current.status !== 'ready' && <div className="p-4 text-sm text-cocoa">
          {current.status === 'loading' && <LoaderCircle className="mb-2 size-4 motion-safe:animate-spin" aria-hidden="true" />}
          {t(`places.${status}`)}
          {['unavailable', 'rateLimit'].includes(status) && <button type="button" className="mt-2 block min-h-11 rounded-full border border-danger px-4 font-bold focus:outline focus:outline-2 focus:outline-cocoa" onClick={() => setRetry((n) => n + 1)}>{t('places.retry')}</button>}
        </div>}
        <p className="border-t border-orange-100 px-4 py-2 text-xs text-muted">Powered by <a className="underline" href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a></p>
      </div>}
      {selection && <p id={`${id}-help`} className="mt-1.5 text-xs text-muted">{t('places.selected')}</p>}
      <span role="status" aria-live="polite" className="sr-only">{expanded ? current.status === 'ready' ? t('places.count', { count: options.length }) : t(`places.${status}`) : selection ? t('places.selected') : ''}</span>
    </div>
  )
}
