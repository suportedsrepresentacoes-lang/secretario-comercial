// Serviço próprio de navegação: encaminha o representante para o app de navegação já instalado
// no aparelho (Google Maps ou Waze), sem manter nenhuma lógica de rota própria.

export type NavigationApp = 'google' | 'waze'

export interface NavigationResult {
  ok: boolean
  message?: string
}

export function hasValidCoords(lat?: number | null, lng?: number | null): boolean {
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

export interface RouteLink {
  label: string
  url: string
}

export interface FullRouteNavigation {
  /** Um único link do Google Maps com origem + waypoints + destino, na ordem da rota — dividido em
   *  mais de um link só se o número de paradas passar do limite prático de waypoints do Google Maps. */
  googleMaps: RouteLink[]
  /** O deep link público do Waze não aceita origem nem múltiplos destinos — só um "ll" de destino,
   *  sempre partindo da localização atual do aparelho. Por isso a rota completa no Waze vira uma
   *  sequência de trechos (um link por perna), abertos um de cada vez, na ordem da rota. */
  wazeLegs: RouteLink[]
  /** Paradas descartadas por não terem coordenadas válidas (lat/lng ausentes ou inválidos) —
   *  a rota continua sendo gerada com as demais, mas o usuário precisa saber o que ficou de fora. */
  skipped: { nome: string }[]
}

// O Google Maps aceita bem mais que isso na prática, mas 23 waypoints + origem + destino (25 pontos)
// é o limite documentado de forma mais consistente entre versões web/app — acima disso, a rota é
// dividida em mais de um link em vez de gerar uma URL que pode falhar silenciosamente.
const GOOGLE_MAPS_MAX_WAYPOINTS = 23

export function buildFullRouteNavigation(
  origin: { lat: number; lng: number },
  stops: { nome: string; lat?: number | null; lng?: number | null }[],
): FullRouteNavigation | null {
  const valid = stops.filter((s) => hasValidCoords(s.lat, s.lng)) as { nome: string; lat: number; lng: number }[]
  const skipped = stops.filter((s) => !hasValidCoords(s.lat, s.lng)).map((s) => ({ nome: s.nome }))
  if (valid.length === 0) return null

  const googleMaps: RouteLink[] = []
  const chunks: { nome: string; lat: number; lng: number }[][] = []
  for (let i = 0; i < valid.length; i += GOOGLE_MAPS_MAX_WAYPOINTS + 1) {
    chunks.push(valid.slice(i, i + GOOGLE_MAPS_MAX_WAYPOINTS + 1))
  }
  let chunkOrigin = origin
  chunks.forEach((chunk, i) => {
    const destination = chunk[chunk.length - 1]
    const waypoints = chunk.slice(0, -1)
    const params = new URLSearchParams({
      api: '1',
      origin: `${chunkOrigin.lat},${chunkOrigin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      travelmode: 'driving',
    })
    if (waypoints.length) params.set('waypoints', waypoints.map((w) => `${w.lat},${w.lng}`).join('|'))
    googleMaps.push({
      label: chunks.length === 1 ? `Rota completa (${chunk.length} parada${chunk.length > 1 ? 's' : ''})` : `Etapa ${i + 1} de ${chunks.length} (${chunk.length} paradas)`,
      url: `https://www.google.com/maps/dir/?${params.toString()}`,
    })
    chunkOrigin = destination
  })

  const wazeLegs: RouteLink[] = valid.map((s, i) => ({
    label: i === 0 ? `Partida → 1. ${s.nome}` : `${i}. ${valid[i - 1].nome} → ${i + 1}. ${s.nome}`,
    url: `https://waze.com/ul?ll=${s.lat},${s.lng}&navigate=yes`,
  }))

  return { googleMaps, wazeLegs, skipped }
}
