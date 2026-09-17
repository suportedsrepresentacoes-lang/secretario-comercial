// Serviço próprio de visualização de fachada (Street View).
// Não depende de nenhuma API paga: abre o Google Maps no modo Street View
// usando apenas latitude/longitude, em uma nova aba/app externo.

export interface StreetViewResult {
  ok: boolean
  message?: string
}

function hasValidCoords(latitude?: number | null, longitude?: number | null): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0)
  )
}

export function openStreetView(latitude?: number | null, longitude?: number | null): StreetViewResult {
  if (!hasValidCoords(latitude, longitude)) {
    return { ok: false, message: 'Street View não disponível para este local.' }
  }
  try {
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (!win) {
      return { ok: false, message: 'Não foi possível abrir o Street View. Verifique o bloqueador de pop-ups.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Street View não disponível para este local.' }
  }
}
