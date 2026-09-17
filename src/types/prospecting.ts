export interface Segment {
  id: string
  label: string
  osmTags: { key: string; value: string }[]
}

export interface Establishment {
  id: string
  nome: string
  endereco: string
  lat: number
  lng: number
  telefone?: string
  categoria: string
  horario?: string
  distanciaKm: number
}
