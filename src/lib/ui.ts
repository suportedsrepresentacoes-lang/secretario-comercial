import type { ClientStatus, OpportunityStage, OrderStatus, VisitStatus, FollowUpStatus, ExpenseCategory, StopStatus } from '../types'

export const STATUS_LABEL: Record<ClientStatus, string> = {
  lead: 'Lead',
  novo: 'Novo',
  ativo: 'Ativo',
  inativo: 'Inativo',
  perdido: 'Perdido',
  potencial: 'Potencial',
}

export const STATUS_COLOR: Record<ClientStatus, string> = {
  lead: '#9B7FE0',
  novo: '#5B8DEF',
  ativo: '#3FA9A0',
  inativo: '#8F8676',
  perdido: '#D9695F',
  potencial: '#3B82F6',
}

export const STAGE_LABEL: Record<OpportunityStage, string> = {
  novo_lead: 'Novo lead',
  primeiro_contato: 'Primeiro contato',
  interessado: 'Interessado',
  orcamento_enviado: 'Orçamento enviado',
  negociacao: 'Negociação',
  venda_realizada: 'Venda realizada',
  perdido: 'Perdido',
}

export const STAGE_ORDER: OpportunityStage[] = [
  'novo_lead',
  'primeiro_contato',
  'interessado',
  'orcamento_enviado',
  'negociacao',
  'venda_realizada',
  'perdido',
]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  faturado: 'Faturado',
  cancelado: 'Cancelado',
}

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  rascunho: '#8F8676',
  enviado: '#5B8DEF',
  aprovado: '#3B82F6',
  faturado: '#3FA9A0',
  cancelado: '#D9695F',
}

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  reagendada: 'Reagendada',
}

export const FOLLOWUP_STATUS_LABEL: Record<FollowUpStatus, string> = {
  pendente: 'Pendente',
  concluido: 'Concluído',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  combustivel: 'Combustível',
  alimentacao: 'Alimentação',
  hospedagem: 'Hospedagem',
  manutencao: 'Manutenção do veículo',
  pedagio: 'Pedágio',
  outros: 'Outros',
}

export const STOP_STATUS_LABEL: Record<StopStatus, string> = {
  pendente: 'Pendente',
  visitado: 'Visitado',
  nao_visitado: 'Não visitado',
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
