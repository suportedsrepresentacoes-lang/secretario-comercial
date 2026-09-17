import type { FuelEstimate } from '../types'

export interface LatLng {
  lat: number
  lng: number
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

function routeLength(origin: LatLng, points: LatLng[]): number {
  let total = 0
  let current = origin
  for (const p of points) {
    total += haversineKm(current, p)
    current = p
  }
  return total
}

function reversedSegment<T>(arr: T[], i: number, j: number): T[] {
  return arr.slice(0, i).concat(arr.slice(i, j + 1).reverse(), arr.slice(j + 1))
}

// Monta a sequência de paradas: parte de nearest-neighbor e refina com 2-opt (busca local que
// desfaz cruzamentos no trajeto), considerando o conjunto todo dos pontos.
export function optimizeStopOrder<T extends LatLng>(origin: LatLng, points: T[]): { ordered: T[]; distanciaKm: number } {
  if (points.length <= 1) {
    const dist = points.length ? haversineKm(origin, points[0]) : 0
    return { ordered: [...points], distanciaKm: Math.round(dist * 10) / 10 }
  }

  const remaining = [...points]
  let current: LatLng = origin
  const nearestNeighborOrder: T[] = []
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
    nearestNeighborOrder.push(next)
    current = next
  }

  let best = nearestNeighborOrder
  let bestLen = routeLength(origin, best)
  let improved = true
  let iterations = 0
  const maxIterations = 60
  while (improved && iterations < maxIterations) {
    improved = false
    iterations++
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = reversedSegment(best, i, j)
        const len = routeLength(origin, candidate)
        if (len + 1e-6 < bestLen) {
          best = candidate
          bestLen = len
          improved = true
        }
      }
    }
  }

  return { ordered: best, distanciaKm: Math.round(bestLen * 10) / 10 }
}

const AVG_SPEED_KMH = 28 // trânsito urbano/regional
const MINUTES_PER_STOP = 35

export function estimateDurationMin(distanceKm: number, stopsCount: number): number {
  return Math.round((distanceKm / AVG_SPEED_KMH) * 60 + stopsCount * MINUTES_PER_STOP)
}

export function estimateFuel(distanciaKm: number, consumoKmL: number, precoLitro: number): FuelEstimate {
  const consumo = consumoKmL > 0 ? consumoKmL : 0
  const litrosEstimados = consumo > 0 ? Math.round((distanciaKm / consumo) * 100) / 100 : 0
  const custoEstimado = Math.round(litrosEstimados * precoLitro * 100) / 100
  return { distanciaKm, consumoKmL, precoLitro, litrosEstimados, custoEstimado }
}
