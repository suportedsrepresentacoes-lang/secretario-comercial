import type { Client } from '../types'

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

const PRIORITY_WEIGHT: Record<Client['prioridade'], number> = {
  alta: 0,
  media: 1,
  baixa: 2,
}

// Monta uma rota aproximada usando nearest-neighbor a partir da origem,
// com leve preferência por clientes de prioridade mais alta em empates de distância.
export function buildRoute(origin: { lat: number; lng: number }, clients: Client[]) {
  const remaining = [...clients]
  const ordered: Client[] = []
  let current = origin
  let totalKm = 0

  while (remaining.length) {
    let bestIdx = 0
    let bestScore = Infinity
    remaining.forEach((c, idx) => {
      const dist = haversineKm(current, c.endereco)
      const score = dist + PRIORITY_WEIGHT[c.prioridade] * 0.6
      if (score < bestScore) {
        bestScore = score
        bestIdx = idx
      }
    })
    const [next] = remaining.splice(bestIdx, 1)
    totalKm += haversineKm(current, next.endereco)
    current = next.endereco
    ordered.push(next)
  }

  const avgSpeedKmH = 28 // trânsito urbano/regional
  const visitMinutes = 35
  const travelMinutes = (totalKm / avgSpeedKmH) * 60
  const totalMinutes = travelMinutes + ordered.length * visitMinutes

  return {
    ordered,
    distanciaTotalKm: Math.round(totalKm * 10) / 10,
    tempoEstimadoMin: Math.round(totalMinutes),
  }
}
