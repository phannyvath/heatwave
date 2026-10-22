import { ExternalLink } from 'lucide-react'
import Button from './Button.jsx'
import { googleMapsDirectionsUrl } from '../utils/googleMapsDirections.js'

export default function MapsDirectionsLink({ start, destination, method, showNote = true, className = '' }) {
  const href = googleMapsDirectionsUrl({ start, destination, method })
  if (!href) return null
  return <div className="space-y-2">
    <Button as="a" variant="ghost" className={`text-base ${className}`} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open in Google Maps: ${destination.name || destination.displayName} (opens in a new tab)`}>
      <ExternalLink size={20} aria-hidden="true" />Open in Google Maps
    </Button>
    {showNote && <p className="text-sm text-muted">{destination.demo ? 'This is a demo cooling location. Google Maps opens its map coordinates; the named venue is not verified.' : 'Opens Google Maps for route options and travel times. Set your preferred departure time there.'}</p>}
  </div>
}
