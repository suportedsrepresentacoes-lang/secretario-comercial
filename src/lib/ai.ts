import type { Client, FollowUp, Opportunity, Order } from '../types'
import { addDays, daysAgo, isPast, isToday, currency, formatDate } from './date'

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

function firstName(fullName: string): string {
  return normalize(fullName).split(/\s+/)[0]
}

export function findClientByFuzzyName(query: string, clients: Client[]): Client | null {
  const q = normalize(query)
  if (!q) return null

  // 1) nome de contato bate exatamente com o primeiro nome citado
  const byContactFirst = clients.find((c) =>
    c.contatos.some((ct) => firstName(ct.nome) === q || normalize(ct.nome).includes(q)),
  )
  if (byContactFirst) return byContactFirst

  // 2) nome fantasia / razão social contém o termo
  const byFantasia = clients.find(
    (c) => normalize(c.nomeFantasia ?? '').includes(q) || normalize(c.razaoSocial).includes(q),
  )
  if (byFantasia) return byFantasia

  // 3) termo contém o primeiro nome de algum contato (frases maiores)
  const byContains = clients.find((c) => c.contatos.some((ct) => q.includes(firstName(ct.nome))))
  return byContains ?? null
}

const NUMBER_WORDS: Record<string, number> = {
  uma: 1, um: 1, duas: 2, dois: 2, tres: 3, quatro: 4, cinco: 5,
  dez: 10, quinze: 15, vinte: 20, trinta: 30, quarenta: 40,
  sessenta: 60, noventa: 90,
}

function parseDays(text: string): number | null {
  const norm = normalize(text)
  const numMatch = norm.match(/(\d+)\s*dias?/)
  if (numMatch) return parseInt(numMatch[1], 10)
  if (/amanha/.test(norm)) return 1
  if (/semana que vem|proxima semana/.test(norm)) return 7
  if (/quinzena|15 dias/.test(norm)) return 15
  if (/mes que vem|proximo mes/.test(norm)) return 30
  for (const [word, n] of Object.entries(NUMBER_WORDS)) {
    if (norm.includes(`${word} dias`)) return n
  }
  return null
}

export interface FollowUpCommand {
  clientId: string
  clientName: string
  days: number
  contexto: string
}

// Reconhece comandos do tipo: "faça follow-up com o João daqui 30 dias sobre o orçamento"
export function parseFollowUpCommand(text: string, clients: Client[]): FollowUpCommand | null {
  const norm = normalize(text)
  if (!/follow[\s-]?up/.test(norm)) return null

  const withMatch = text.match(/com\s+(?:o|a)?\s*([a-zA-ZÀ-ÿ]+)/i)
  if (!withMatch) return null

  const client = findClientByFuzzyName(withMatch[1], clients)
  if (!client) return null

  const days = parseDays(text) ?? 7

  const aboutMatch = text.match(/sobre\s+(.+)$/i)
  const contexto = aboutMatch
    ? aboutMatch[1].trim()
    : `Follow-up agendado via IA Comercial com base no pedido: "${text.trim()}"`

  return { clientId: client.id, clientName: client.nomeFantasia ?? client.razaoSocial, days, contexto }
}

export interface AiContext {
  clients: Client[]
  followUps: FollowUp[]
  opportunities: Opportunity[]
  orders: Order[]
}

function clientLabel(c: Client): string {
  return c.nomeFantasia ?? c.razaoSocial
}

export function answerQuery(text: string, ctx: AiContext): string {
  const norm = normalize(text)

  if (/contatar hoje|falar com hoje|quem.*hoje/.test(norm)) {
    const due = ctx.followUps.filter((f) => f.status !== 'concluido' && f.status !== 'cancelado' && (isToday(f.dataAgendada) || isPast(f.dataAgendada)))
    if (due.length === 0) return 'Nenhum follow-up pendente para hoje. Sua agenda de contatos está em dia! ✅'
    const lines = due.map((f) => {
      const c = ctx.clients.find((c) => c.id === f.clientId)
      return `• ${c ? clientLabel(c) : 'Cliente'} — ${f.contexto}`
    })
    return `Você tem ${due.length} contato(s) para hoje:\n${lines.join('\n')}`
  }

  const semCompraMatch = norm.match(/sem comprar|sem pedido|parad[oa]s?/)
  if (semCompraMatch) {
    const days = parseDays(text) ?? 60
    const stale = ctx.clients
      .filter((c) => c.ultimaCompraEm && daysAgo(c.ultimaCompraEm) >= days)
      .sort((a, b) => daysAgo(b.ultimaCompraEm!) - daysAgo(a.ultimaCompraEm!))
    if (stale.length === 0) return `Nenhum cliente está há ${days} dias ou mais sem comprar. 👍`
    const lines = stale.map((c) => `• ${clientLabel(c)} — ${daysAgo(c.ultimaCompraEm!)} dias sem comprar`)
    return `${stale.length} cliente(s) há ${days}+ dias sem comprar:\n${lines.join('\n')}`
  }

  if (/inativ/.test(norm)) {
    const list = ctx.clients.filter((c) => c.status === 'inativo')
    if (list.length === 0) return 'Nenhum cliente inativo no momento.'
    return `Clientes inativos:\n${list.map((c) => `• ${clientLabel(c)}`).join('\n')}`
  }

  if (/perdid/.test(norm)) {
    const list = ctx.clients.filter((c) => c.status === 'perdido')
    if (list.length === 0) return 'Nenhum cliente marcado como perdido. 🎉'
    return `Clientes perdidos:\n${list.map((c) => `• ${clientLabel(c)}`).join('\n')}`
  }

  if (/resumo|como estou indo|performance|carteira/.test(norm)) {
    const ativos = ctx.clients.filter((c) => c.status === 'ativo').length
    const abertas = ctx.opportunities.filter((o) => !['venda_realizada', 'perdido'].includes(o.etapa))
    const valorPipeline = abertas.reduce((s, o) => s + o.valorEstimado, 0)
    const pendentes = ctx.followUps.filter((f) => f.status === 'pendente' || f.status === 'atrasado').length
    return [
      `Resumo da carteira:`,
      `• ${ctx.clients.length} clientes cadastrados, ${ativos} ativos`,
      `• ${abertas.length} oportunidades abertas somando ${currency(valorPipeline)}`,
      `• ${pendentes} follow-up(s) pendente(s)`,
    ].join('\n')
  }

  if (/orcamento.*abert|negociaca/.test(norm)) {
    const list = ctx.opportunities.filter((o) => o.etapa === 'orcamento_enviado' || o.etapa === 'negociacao')
    if (list.length === 0) return 'Nenhuma oportunidade em orçamento ou negociação agora.'
    const lines = list.map((o) => {
      const c = ctx.clients.find((c) => c.id === o.clientId)
      return `• ${c ? clientLabel(c) : 'Cliente'} — ${o.titulo} (${currency(o.valorEstimado)})`
    })
    return `Oportunidades em andamento:\n${lines.join('\n')}`
  }

  return [
    'Não entendi bem esse pedido. Você pode perguntar coisas como:',
    '• "Quem eu preciso contatar hoje?"',
    '• "Quem está há 60 dias sem comprar?"',
    '• "Me dá um resumo da carteira"',
    '• "Faça follow-up com o João daqui 30 dias sobre o orçamento de fechaduras"',
  ].join('\n')
}

export function suggestNextFollowUpDate(days = 30): string {
  return addDays(new Date(), days).toISOString()
}

export interface FollowUpInterpretation {
  sentimento: 'positivo' | 'negativo' | 'neutro'
  resumo: string
  reagendarDias?: number
}

// Interpreta a resposta do cliente a um follow-up para decidir a próxima ação no CRM.
export function interpretFollowUpResponse(text: string): FollowUpInterpretation {
  const norm = normalize(text)

  const negativo = /(nao tenho interesse|sem interesse|nao quero|nao vou|cancela|desist|perdid|concorrent|mais barato|fechou com outro)/.test(norm)
  if (negativo) {
    return { sentimento: 'negativo', resumo: 'Cliente sinalizou desinteresse ou fechou com concorrente.' }
  }

  const positivo = /(sim|pode mandar|pode enviar|fechado|vamos fechar|quero sim|combinado|pode faturar|aprovado|topo|interessad)/.test(norm)
  if (positivo) {
    return { sentimento: 'positivo', resumo: 'Cliente respondeu positivamente e quer avançar.' }
  }

  const reagendarMatch = norm.match(/(\d+)\s*dias/)
  const dias = reagendarMatch ? parseInt(reagendarMatch[1], 10) : 15
  return {
    sentimento: 'neutro',
    resumo: 'Cliente pediu mais tempo para decidir. Reagendando novo contato.',
    reagendarDias: dias,
  }
}

export { formatDate }
