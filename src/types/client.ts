export type ClientStatus = 'prospect' | 'ativo' | 'inativo' | 'retorno' | 'sem_interesse'

export interface Address {
  logradouro: string
  numero?: string
  bairro?: string
  cidade: string
  uf: string
  lat: number
  lng: number
}

export interface Client {
  id: string
  nomeFantasia: string
  razaoSocial?: string
  cnpj?: string
  segmento: string
  status: ClientStatus
  telefone?: string
  whatsapp?: string
  endereco: Address
  observacoes?: string
  tags: string[]
  criadoEm: string
  ultimaVisitaEm?: string
}
