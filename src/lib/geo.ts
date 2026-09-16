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

export interface RoutablePoint {
  lat: number
  lng: number
}

function routeLength(origin: RoutablePoint, points: RoutablePoint[]): number {
  let total = 0
  let current: RoutablePoint = origin
  for (const p of points) {
    total += haversineKm(current, p)
    current = p
  }
  return total
}

function twoOptSwap<T>(arr: T[], i: number, j: number): T[] {
  return arr.slice(0, i).concat(arr.slice(i, j + 1).reverse(), arr.slice(j + 1))
}

// Monta a sequência de paradas: constrói com nearest-neighbor e refina com 2-opt
// (busca local que desfaz cruzamentos do trajeto), considerando o conjunto todo dos
// pontos em vez de apenas encadear o mais próximo a cada passo.
export function optimizeStopOrder<T extends RoutablePoint>(
  origin: RoutablePoint,
  points: T[],
): { ordered: T[]; distanciaTotalKm: number } {
  if (points.length <= 1) {
    const dist = points.length ? haversineKm(origin, points[0]) : 0
    return { ordered: [...points], distanciaTotalKm: Math.round(dist * 10) / 10 }
  }

  const remaining = [...points]
  let current: RoutablePoint = origin
  const nn: T[] = []
  while (remaining.length) {
    let bestIdx = 0
    let bestDist = Infinity
    remaining.forEach((p, idx) => {
      const d = haversineKm(current, p)
      if (d < bestDist) {
        bestDist = d
        bestIdx = idx
      }
    })
    const [next] = remaining.splice(bestIdx, 1)
    nn.push(next)
    current = next
  }

  let best = nn
  let bestLen = routeLength(origin, best)
  let improved = true
  let iterations = 0
  const maxIterations = 60
  while (improved && iterations < maxIterations) {
    improved = false
    iterations++
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = twoOptSwap(best, i, j)
        const len = routeLength(origin, candidate)
        if (len + 1e-6 < bestLen) {
          best = candidate
          bestLen = len
          improved = true
        }
      }
    }
  }

  return { ordered: best, distanciaTotalKm: Math.round(bestLen * 10) / 10 }
}

export function estimateTravelMinutes(distanceKm: number, stopsCount: number): number {
  const avgSpeedKmH = 28
  const minutesPerStop = 35
  return Math.round((distanceKm / avgSpeedKmH) * 60 + stopsCount * minutesPerStop)
}
