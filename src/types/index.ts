export type ClientStatus = 'lead' | 'novo' | 'ativo' | 'inativo' | 'perdido' | 'potencial'

export interface Contact {
  id: string
  nome: string
  cargo?: string
  telefone?: string
  whatsapp?: string
  email?: string
  principal?: boolean
}

export interface Address {
  logradouro: string
  numero?: string
  bairro?: string
  cidade: string
  uf: string
  cep?: string
  lat: number
  lng: number
}

export interface Client {
  id: string
  razaoSocial: string
  nomeFantasia?: string
  cnpj: string
  segmento: string
  status: ClientStatus
  contatos: Contact[]
  endereco: Address
  industriaIds: string[]
  observacoes?: string
  criadoEm: string
  ultimaCompraEm?: string
  ultimaVisitaEm?: string
  prioridade: 'alta' | 'media' | 'baixa'
}

export interface Industry {
  id: string
  nome: string
  cnpj?: string
  contatoNome?: string
  contatoTelefone?: string
  comissaoPadrao: number
  categorias: string[]
  cor: string
  condicaoPagamento?: string
  prazoEntregaDias?: number
}

export interface Product {
  id: string
  industriaId: string
  nome: string
  sku: string
  categoria: string
  precoTabela: number
  unidade: string
  comissaoPercentual?: number
}

export type VisitStatus = 'agendada' | 'realizada' | 'cancelada' | 'reagendada'

export interface Visit {
  id: string
  clientId: string
  dataHora: string
  status: VisitStatus
  resultado?: string
  produtosApresentadosIds?: string[]
  pedidoGeradoId?: string
  proximaAcao?: string
  observacoes?: string
  criadoEm: string
}

export type OpportunityStage =
  | 'novo_lead'
  | 'primeiro_contato'
  | 'interessado'
  | 'orcamento_enviado'
  | 'negociacao'
  | 'venda_realizada'
  | 'perdido'

export interface Opportunity {
  id: string
  clientId: string
  titulo: string
  valorEstimado: number
  etapa: OpportunityStage
  industriaId?: string
  observacoes?: string
  criadoEm: string
  atualizadoEm: string
}

export type OrderStatus = 'rascunho' | 'enviado' | 'aprovado' | 'faturado' | 'cancelado'

export interface OrderItem {
  productId: string
  quantidade: number
  precoUnitario: number
}

export interface Order {
  id: string
  numero: string
  clientId: string
  industriaId: string
  itens: OrderItem[]
  status: OrderStatus
  dataCriacao: string
  comissaoPercentual: number
}

export type FollowUpOrigin = 'manual' | 'ia' | 'whatsapp'
export type FollowUpStatus = 'pendente' | 'concluido' | 'atrasado' | 'cancelado'

export interface FollowUp {
  id: string
  clientId: string
  opportunityId?: string
  contexto: string
  dataAgendada: string
  criadoEm: string
  status: FollowUpStatus
  origem: FollowUpOrigin
  resultado?: string
}

export interface ChatMessage {
  id: string
  autor: 'representante' | 'cliente'
  texto: string
  hora: string
}

export interface Conversation {
  id: string
  clientId: string
  mensagens: ChatMessage[]
  naoLidas: number
}

export interface AiMessage {
  id: string
  autor: 'usuario' | 'ia'
  texto: string
  hora: string
}

export type ExpenseCategory =
  | 'combustivel'
  | 'alimentacao'
  | 'hospedagem'
  | 'manutencao'
  | 'pedagio'
  | 'outros'

export interface Expense {
  id: string
  data: string
  categoria: ExpenseCategory
  valor: number
  descricao: string
  clientId?: string
}

export interface SavedRoute {
  id: string
  nome: string
  data: string
  clientIds: string[]
  distanciaTotalKm: number
  tempoEstimadoMin: number
  criadoEm: string
}

// ---- MVP de roteirização (foco atual do produto) ----

export type StopStatus = 'pendente' | 'visitado' | 'nao_visitado'
export type StopOrigin = 'cliente' | 'prospect'

export interface RouteStop {
  id: string
  origem: StopOrigin
  clientId?: string
  nome: string
  endereco: string
  lat: number
  lng: number
  telefone?: string
  whatsapp?: string
  segmento?: string
  status: StopStatus
  observacao?: string
}

export type RouteStatus = 'planejada' | 'em_andamento' | 'concluida'

export interface FuelCalc {
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
  distanciaTotalKm: number
  tempoEstimadoMin: number
  status: RouteStatus
  combustivel: FuelCalc
  criadoEm: string
  iniciadaEm?: string
  finalizadaEm?: string
}

export interface FuelDefaults {
  consumoKmL: number
  precoLitro: number
}

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
