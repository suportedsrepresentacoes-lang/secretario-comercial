// Serviço próprio de navegação: encaminha o representante para o app de
// navegação já instalado no aparelho (Google Maps ou Waze), sem manter
// nenhuma lógica de rota própria — só repassa o destino.

export type NavigationApp = 'google' | 'waze'

export interface NavigationResult {
  ok: boolean
  message?: string
}

function hasValidCoords(latitude?: number | null, longitude?: number | null): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  )
}

export function openNavigation(
  latitude?: number | null,
  longitude?: number | null,
  app: NavigationApp = 'google',
): NavigationResult {
  if (!hasValidCoords(latitude, longitude)) {
    return { ok: false, message: 'Sem coordenadas para traçar a navegação até este local.' }
  }
  const url =
    app === 'waze'
      ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
      : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (!win) {
      return { ok: false, message: 'Não foi possível abrir o app de navegação. Verifique o bloqueador de pop-ups.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Não foi possível abrir o app de navegação.' }
  }
}
