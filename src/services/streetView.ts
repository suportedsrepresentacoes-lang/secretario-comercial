// Serviço próprio de visualização de fachada (Street View): não depende de nenhuma API paga,
// só abre o Google Maps no modo Street View a partir de latitude/longitude.

export interface StreetViewResult {
  ok: boolean
  message?: string
}

function hasValidCoords(lat?: number | null, lng?: number | null): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  )
}

export function openStreetView(lat?: number | null, lng?: number | null): StreetViewResult {
  if (!hasValidCoords(lat, lng)) {
    return { ok: false, message: 'Street View não disponível para este local.' }
  }
  try {
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (!win) return { ok: false, message: 'Não foi possível abrir o Street View. Verifique o bloqueador de pop-ups.' }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Street View não disponível para este local.' }
  }
}
