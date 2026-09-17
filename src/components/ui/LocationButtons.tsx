import { useState } from 'react'
import { Navigation, Camera } from 'lucide-react'
import { Button } from './Button'
import { openStreetView } from '../../services/streetView'
import { openNavigation } from '../../services/navigation'

export function LocationButtons({
  lat,
  lng,
  size = 'md',
  className = '',
}: {
  lat?: number | null
  lng?: number | null
  size?: 'md' | 'sm'
  className?: string
}) {
  const [notice, setNotice] = useState<string | null>(null)
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : ''

  function handleNavigate(app: 'google' | 'waze') {
    const res = openNavigation(lat, lng, app)
    setNotice(res.ok ? null : res.message ?? null)
  }

  function handleStreetView() {
    const res = openStreetView(lat, lng)
    setNotice(res.ok ? null : res.message ?? null)
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className={`flex-1 ${pad}`} onClick={() => handleNavigate('google')}>
          <Navigation size={13} /> Google Maps
        </Button>
        <Button variant="secondary" className={`flex-1 ${pad}`} onClick={() => handleNavigate('waze')}>
          <Navigation size={13} /> Waze
        </Button>
        <Button variant="secondary" className={`flex-1 ${pad}`} onClick={handleStreetView}>
          <Camera size={13} /> Street View
        </Button>
      </div>
      {notice && <p className="mt-1.5 text-[11px] text-[#F59E0B]">{notice}</p>}
    </div>
  )
}
