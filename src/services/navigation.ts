// Serviço próprio de navegação: encaminha o representante para o app de navegação já instalado
// no aparelho (Google Maps ou Waze), sem manter nenhuma lógica de rota própria.

export type NavigationApp = 'google' | 'waze'

export interface NavigationResult {
  ok: boolean
  message?: string
}

function hasValidCoords(lat?: number | null, lng?: number | null): boolean {
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
}

export function openNavigation(lat?: number | null, lng?: number | null, app: NavigationApp = 'google'): NavigationResult {
  if (!hasValidCoords(lat, lng)) {
    return { ok: false, message: 'Sem coordenadas para traçar a navegação até este local.' }
  }
  const url =
    app === 'waze'
      ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (!win) return { ok: false, message: 'Não foi possível abrir o app de navegação. Verifique o bloqueador de pop-ups.' }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Não foi possível abrir o app de navegação.' }
  }
}
