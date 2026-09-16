import type { FuelCalc } from '../types'

export function computeFuel(distanciaKm: number, consumoKmL: number, precoLitro: number): FuelCalc {
  const consumoValido = consumoKmL > 0 ? consumoKmL : 0
  const litrosEstimados = consumoValido > 0 ? Math.round((distanciaKm / consumoValido) * 100) / 100 : 0
  const custoEstimado = Math.round(litrosEstimados * precoLitro * 100) / 100
  return { distanciaKm, consumoKmL, precoLitro, litrosEstimados, custoEstimado }
}
