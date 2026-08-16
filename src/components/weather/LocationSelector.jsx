import { useEffect, useRef, useState } from 'react'
import { LocateFixed, MapPin, Search } from 'lucide-react'
import Button from '../Button.jsx'
import Card from '../Card.jsx'
import { searchAustralianLocations } from '../../services/geocodingService.js'
import { useTranslation } from 'react-i18next'

export default function LocationSelector({
  mode = 'card',
  locationError = '',
  onUseLocation,
  onSelectLocation,
  onUseDefault,
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setError('')
      return undefined
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const matches = await searchAustralianLocations(query.trim(), { signal: controller.signal })
        setResults(matches)
        setActiveIndex(matches.length ? 0 : -1)
      } catch {
        if (!controller.signal.aborted) setError(t('location.error'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 400)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [query, t])

  function choose(result) {
    onSelectLocation(result)
    setQuery('')
    setResults([])
    setActiveIndex(-1)
  }

  function handleKeyDown(event) {
    if (!results.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(results.length - 1, current + 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(0, current - 1))
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      choose(results[activeIndex])
    }
    if (event.key === 'Escape') {
      setResults([])
      setActiveIndex(-1)
    }
  }

  const content = (
    <>
      {mode === 'card' && (
        <div>
          <h2 className="text-2xl font-black text-navy">{t('location.title')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t('location.body')}
          </p>
        </div>
      )}

      {locationError && <p className="rounded-2xl bg-orange-50 p-3 text-sm font-bold text-danger">{locationError}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onUseLocation} className="min-h-11">
          <LocateFixed className="size-4" />
          {t('actions.useMyLocation')}
        </Button>
        <Button variant="ghost" onClick={onUseDefault} className="min-h-11">
          <MapPin className="size-4" />
          {t('location.useHawthorn')}
        </Button>
      </div>

      <div className="relative">
        <label className="block">
          <span className="text-sm font-black text-navy">{t('location.choose')}</span>
          <div className="mt-2 flex min-w-0 items-center gap-2 rounded-2xl border border-orange-100 bg-cream px-3 focus-within:border-ocean focus-within:ring-2 focus-within:ring-orange-100">
            <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
            <input
              className="min-h-11 min-w-0 flex-1 bg-transparent py-2 text-cocoa outline-none placeholder:text-muted"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('location.placeholder')}
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="location-results"
              aria-activedescendant={activeIndex >= 0 ? `location-result-${activeIndex}` : undefined}
            />
          </div>
        </label>

        {(loading || error || query.trim().length >= 2) && (
          <div
            id="location-results"
            ref={listRef}
            className="absolute left-0 right-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-orange-100 bg-white p-2 shadow-soft"
            role="listbox"
          >
            {loading && <p className="p-3 text-sm font-bold text-muted">{t('location.searching')}</p>}
            {error && <p className="p-3 text-sm font-bold text-danger">{error}</p>}
            {!loading && !error && results.length === 0 && <p className="p-3 text-sm font-bold text-muted">{t('location.none')}</p>}
            {!loading &&
              !error &&
              results.map((result, index) => (
                <button
                  id={`location-result-${index}`}
                  key={result.id}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  className={`flex min-h-11 w-full min-w-0 items-start gap-3 rounded-xl px-3 py-2 text-left ${
                    activeIndex === index ? 'bg-skysoft text-navy' : 'hover:bg-cream'
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(result)}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-ocean" aria-hidden="true" />
                  <span className="min-w-0 overflow-wrap-anywhere">
                    <span className="block font-black">{result.name}</span>
                    <span className="block text-xs font-bold text-muted">
                      {[result.state, result.postcode].filter(Boolean).join(' ') || 'Australia'}
                    </span>
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>
    </>
  )

  if (mode === 'inline') return <div className="space-y-4">{content}</div>
  return <Card className="space-y-4 p-5">{content}</Card>
}
