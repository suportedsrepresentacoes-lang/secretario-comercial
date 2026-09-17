export type FuelType = 'gasolina' | 'etanol' | 'diesel' | 'gnv' | 'eletrico'

export interface VehicleSettings {
  combustivel: FuelType
  consumoKmL: number
  precoLitro: number
}

export interface FavoritePlace {
  id: string
  nome: string
  lat: number
  lng: number
}
