export type StopStatus = 'pendente' | 'visitado' | 'nao_visitado'
export type StopOrigin = 'cliente' | 'prospect'

export type VisitResultado =
  | 'venda_realizada'
  | 'pedido_negociacao'
  | 'proposta_enviada'
  | 'retornar'
  | 'sem_interesse'
  | 'nao_atendido'
  | 'cliente_nao_encontrado'
  | 'outro'

export interface RouteStop {
  id: string
  origem: StopOrigin
  clientId?: string
  nome: string
  endereco: string
  lat: number
  lng: number
  telefone?: string
  segmento?: string
  status: StopStatus
  resultado?: VisitResultado
  observacao?: string
  chegadaEm?: string
  saidaEm?: string
}

export type RouteStatus = 'planejada' | 'em_andamento' | 'concluida'

export interface FuelEstimate {
  distanciaKm: number
  consumoKmL: number
  precoLitro: number
  litrosEstimados: number
  custoEstimado: number
}

export interface RoutePlan {
  id: string
  nome: string
  origemLat: number
  origemLng: number
  paradas: RouteStop[]
  distanciaKm: number
  duracaoMin: number
  status: RouteStatus
  combustivel: FuelEstimate
  criadoEm: string
  iniciadaEm?: string
  finalizadaEm?: string
  kmRealPercorrido?: number
}

export interface DraftStop {
  id: string
  origem: StopOrigin
  clientId?: string
  nome: string
  endereco: string
  lat: number
  lng: number
  telefone?: string
  segmento?: string
}
