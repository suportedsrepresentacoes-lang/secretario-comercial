import type { ClientStatus, StopStatus, VisitResultado, ExpenseCategory, FuelType } from '../types'

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  prospect: 'Prospect',
  ativo: 'Cliente ativo',
  inativo: 'Cliente inativo',
  retorno: 'Retorno',
  sem_interesse: 'Sem interesse',
}

export const CLIENT_STATUS_COLOR: Record<ClientStatus, string> = {
  prospect: '#3B82F6',
  ativo: '#16A34A',
  inativo: '#6B7F93',
  retorno: '#F59E0B',
  sem_interesse: '#EF4444',
}

export const STOP_STATUS_LABEL: Record<StopStatus, string> = {
  pendente: 'Pendente',
  visitado: 'Visitado',
  nao_visitado: 'Não visitado',
}

export const STOP_STATUS_COLOR: Record<StopStatus, string> = {
  pendente: '#6B7F93',
  visitado: '#16A34A',
  nao_visitado: '#EF4444',
}

export const VISIT_RESULTADO_LABEL: Record<VisitResultado, string> = {
  venda_realizada: 'Venda realizada',
  pedido_negociacao: 'Pedido em negociação',
  proposta_enviada: 'Proposta enviada',
  retornar: 'Retornar',
  sem_interesse: 'Sem interesse',
  nao_atendido: 'Não atendido',
  cliente_nao_encontrado: 'Cliente não encontrado',
  outro: 'Outro',
}

const NEGATIVE_RESULTADOS: VisitResultado[] = ['nao_atendido', 'cliente_nao_encontrado']
export function stopStatusForResultado(r: VisitResultado): StopStatus {
  return NEGATIVE_RESULTADOS.includes(r) ? 'nao_visitado' : 'visitado'
}

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  combustivel: 'Combustível',
  pedagio: 'Pedágio',
  estacionamento: 'Estacionamento',
  alimentacao: 'Alimentação',
  hospedagem: 'Hospedagem',
  outros: 'Outros',
}

export const EXPENSE_CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  combustivel: '#3B82F6',
  pedagio: '#F59E0B',
  estacionamento: '#9B7FE0',
  alimentacao: '#16A34A',
  hospedagem: '#5B8DEF',
  outros: '#6B7F93',
}

export const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
  eletrico: 'Elétrico',
}

export const SUGGESTED_TAGS = ['Grande cliente', 'Potencial', 'Atacado', 'Varejo', 'Retorno', 'Negociação', 'Prioridade', 'Visitar esta semana']
