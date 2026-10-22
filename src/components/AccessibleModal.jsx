import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function AccessibleModal({ title, onClose, children }) {
  const ref = useRef(null)
  const id = useId()
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    dialog.showModal()
    dialog.querySelector('button')?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus({ preventScroll: true })
      else document.querySelector('[data-reminder-bell]')?.focus()
    }
  }, [])
  function keepFocusInside(event) {
    if (event.key !== 'Tab') return
    const controls = [...ref.current.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
      .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length)
    const first = controls[0]
    const last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }
  return createPortal(<dialog onKeyDown={keepFocusInside} ref={ref} className="reminder-modal" aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="flex items-start justify-between gap-3">
      <h2 id={id} className="text-2xl font-black overflow-wrap-anywhere">{title}</h2>
      <button type="button" aria-label={`Close ${title}`} onClick={onClose} className="reminder-close"><X aria-hidden="true" /></button>
    </header>
    <div className="mt-5 space-y-4">{children}</div>
  </dialog>, document.body)
}
