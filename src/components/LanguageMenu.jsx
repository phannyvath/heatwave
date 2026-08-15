import { Check, Languages } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { languageOptions } from '../i18n/index.js'

export default function LanguageMenu() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function changeLanguage(code) {
    i18n.changeLanguage(code)
    window.localStorage.setItem('heatSafe.language', code)
    setOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full border border-orange-100 bg-white text-navy transition hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2"
        aria-label={t('actions.changeLanguage')}
        title={t('actions.changeLanguage')}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Languages className="size-5" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-orange-100 bg-white p-2 shadow-soft">
          {languageOptions.map((language) => {
            const active = i18n.resolvedLanguage === language.code
            return (
              <button
                key={language.code}
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-black text-navy hover:bg-cream focus:outline-none focus:ring-2 focus:ring-ocean"
                onClick={() => changeLanguage(language.code)}
              >
                <span>{language.label}</span>
                {active && <Check className="size-4 text-ocean" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
