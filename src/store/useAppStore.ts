import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { newId } from '../lib/id'
import { todayISO, addDays, isPast } from '../lib/date'
import { answerQuery, parseFollowUpCommand } from '../lib/ai'
import * as seed from '../data/seed'
import type {
  Client, Industry, Product, Visit, Opportunity, Order, FollowUp, Conversation,
  ChatMessage, AiMessage, Expense, SavedRoute, OpportunityStage, ClientStatus,
} from '../types'

interface AppState {
  clients: Client[]
  industries: Industry[]
  products: Product[]
  visits: Visit[]
  opportunities: Opportunity[]
  orders: Order[]
  followUps: FollowUp[]
  conversations: Conversation[]
  aiMessages: AiMessage[]
  expenses: Expense[]
  savedRoutes: SavedRoute[]
  repName: string
  companyName: string

  addClient: (c: Omit<Client, 'id' | 'criadoEm'>) => Client
  updateClient: (id: string, patch: Partial<Client>) => void
  deleteClient: (id: string) => void
  setClientStatus: (id: string, status: ClientStatus) => void

  addIndustry: (i: Omit<Industry, 'id'>) => void
  updateIndustry: (id: string, patch: Partial<Industry>) => void
  deleteIndustry: (id: string) => void

  addProduct: (p: Omit<Product, 'id'>) => void
  updateProduct: (id: string, patch: Partial<Product>) => void
  deleteProduct: (id: string) => void

  addVisit: (v: Omit<Visit, 'id' | 'criadoEm'>) => void
  updateVisit: (id: string, patch: Partial<Visit>) => void
  deleteVisit: (id: string) => void

  addOpportunity: (o: Omit<Opportunity, 'id' | 'criadoEm' | 'atualizadoEm'>) => void
  moveOpportunityStage: (id: string, etapa: OpportunityStage) => void
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => void
  deleteOpportunity: (id: string) => void

  addOrder: (o: Omit<Order, 'id' | 'numero'>) => void
  updateOrder: (id: string, patch: Partial<Order>) => void
  deleteOrder: (id: string) => void

  addFollowUp: (f: Omit<FollowUp, 'id' | 'criadoEm' | 'status'> & { status?: FollowUp['status'] }) => FollowUp
  updateFollowUp: (id: string, patch: Partial<FollowUp>) => void
  completeFollowUp: (id: string, resultado: string) => void
  deleteFollowUp: (id: string) => void
  refreshOverdueFollowUps: () => void

  sendMessage: (clientId: string, texto: string, autor?: 'representante' | 'cliente') => void
  markConversationRead: (clientId: string) => void
  getOrCreateConversation: (clientId: string) => Conversation

  askAi: (texto: string) => void

  addExpense: (e: Omit<Expense, 'id'>) => void
  deleteExpense: (id: string) => void

  addSavedRoute: (r: Omit<SavedRoute, 'id' | 'criadoEm'>) => void
  deleteSavedRoute: (id: string) => void

  resetDemoData: () => void
}

function initialAiMessages(): AiMessage[] {
  return [
    {
      id: newId(),
      autor: 'ia',
      texto:
        'Oi, Diego! Eu sou sua assistente comercial. Pergunte coisas como "quem preciso contatar hoje" ou peça "faça follow-up com o João daqui 30 dias".',
      hora: todayISO(),
    },
  ]
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: seed.clients,
      industries: seed.industries,
      products: seed.products,
      visits: seed.visits,
      opportunities: seed.opportunities,
      orders: seed.orders,
      followUps: seed.followUps,
      conversations: seed.conversations,
      aiMessages: initialAiMessages(),
      expenses: seed.expenses,
      savedRoutes: [],
      repName: 'Diego Silva',
      companyName: 'DS Representações',

      addClient: (c) => {
        const client: Client = { ...c, id: newId(), criadoEm: todayISO() }
        set((s) => ({ clients: [client, ...s.clients] }))
        return client
      },
      updateClient: (id, patch) =>
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
      setClientStatus: (id, status) =>
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, status } : c)) })),

      addIndustry: (i) => set((s) => ({ industries: [...s.industries, { ...i, id: newId() }] })),
      updateIndustry: (id, patch) =>
        set((s) => ({ industries: s.industries.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      deleteIndustry: (id) => set((s) => ({ industries: s.industries.filter((i) => i.id !== id) })),

      addProduct: (p) => set((s) => ({ products: [...s.products, { ...p, id: newId() }] })),
      updateProduct: (id, patch) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      addVisit: (v) => set((s) => ({ visits: [{ ...v, id: newId(), criadoEm: todayISO() }, ...s.visits] })),
      updateVisit: (id, patch) => {
        set((s) => ({ visits: s.visits.map((v) => (v.id === id ? { ...v, ...patch } : v)) }))
        if (patch.status === 'realizada') {
          const visit = get().visits.find((v) => v.id === id)
          if (visit) get().updateClient(visit.clientId, { ultimaVisitaEm: todayISO() })
        }
      },
      deleteVisit: (id) => set((s) => ({ visits: s.visits.filter((v) => v.id !== id) })),

      addOpportunity: (o) =>
        set((s) => ({
          opportunities: [
            { ...o, id: newId(), criadoEm: todayISO(), atualizadoEm: todayISO() },
            ...s.opportunities,
          ],
        })),
      moveOpportunityStage: (id, etapa) =>
        set((s) => ({
          opportunities: s.opportunities.map((o) =>
            o.id === id ? { ...o, etapa, atualizadoEm: todayISO() } : o,
          ),
        })),
      updateOpportunity: (id, patch) =>
        set((s) => ({
          opportunities: s.opportunities.map((o) =>
            o.id === id ? { ...o, ...patch, atualizadoEm: todayISO() } : o,
          ),
        })),
      deleteOpportunity: (id) => set((s) => ({ opportunities: s.opportunities.filter((o) => o.id !== id) })),

      addOrder: (o) =>
        set((s) => ({
          orders: [{ ...o, id: newId(), numero: `PED-${1050 + s.orders.length + 1}` }, ...s.orders],
        })),
      updateOrder: (id, patch) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      deleteOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),

      addFollowUp: (f) => {
        const followUp: FollowUp = { ...f, id: newId(), criadoEm: todayISO(), status: f.status ?? 'pendente' }
        set((s) => ({ followUps: [followUp, ...s.followUps] }))
        return followUp
      },
      updateFollowUp: (id, patch) =>
        set((s) => ({ followUps: s.followUps.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      completeFollowUp: (id, resultado) =>
        set((s) => ({
          followUps: s.followUps.map((f) =>
            f.id === id ? { ...f, status: 'concluido', resultado } : f,
          ),
        })),
      deleteFollowUp: (id) => set((s) => ({ followUps: s.followUps.filter((f) => f.id !== id) })),
      refreshOverdueFollowUps: () =>
        set((s) => ({
          followUps: s.followUps.map((f) =>
            f.status === 'pendente' && isPast(f.dataAgendada) && !isToday(f.dataAgendada)
              ? { ...f, status: 'atrasado' }
              : f,
          ),
        })),

      getOrCreateConversation: (clientId) => {
        const existing = get().conversations.find((c) => c.clientId === clientId)
        if (existing) return existing
        const conv: Conversation = { id: newId(), clientId, mensagens: [], naoLidas: 0 }
        set((s) => ({ conversations: [...s.conversations, conv] }))
        return conv
      },
      sendMessage: (clientId, texto, autor = 'representante') => {
        const conv = get().getOrCreateConversation(clientId)
        const msg: ChatMessage = { id: newId(), autor, texto, hora: todayISO() }
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conv.id
              ? { ...c, mensagens: [...c.mensagens, msg], naoLidas: autor === 'cliente' ? c.naoLidas + 1 : c.naoLidas }
              : c,
          ),
        }))
      },
      markConversationRead: (clientId) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.clientId === clientId ? { ...c, naoLidas: 0 } : c)),
        })),

      askAi: (texto) => {
        const userMsg: AiMessage = { id: newId(), autor: 'usuario', texto, hora: todayISO() }
        set((s) => ({ aiMessages: [...s.aiMessages, userMsg] }))

        const { clients, followUps, opportunities, orders } = get()
        const command = parseFollowUpCommand(texto, clients)

        let resposta: string
        if (command) {
          get().addFollowUp({
            clientId: command.clientId,
            contexto: command.contexto,
            dataAgendada: addDays(new Date(), command.days).toISOString(),
            origem: 'ia',
          })
          resposta = `Combinado! Agendei um follow-up com ${command.clientName} para daqui ${command.days} dias (${new Date(
            addDays(new Date(), command.days),
          ).toLocaleDateString('pt-BR')}). Quando a data chegar eu retomo o contato e atualizo o CRM automaticamente.`
        } else {
          resposta = answerQuery(texto, { clients, followUps, opportunities, orders })
        }

        const iaMsg: AiMessage = { id: newId(), autor: 'ia', texto: resposta, hora: todayISO() }
        set((s) => ({ aiMessages: [...s.aiMessages, iaMsg] }))
      },

      addExpense: (e) => set((s) => ({ expenses: [{ ...e, id: newId() }, ...s.expenses] })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addSavedRoute: (r) =>
        set((s) => ({ savedRoutes: [{ ...r, id: newId(), criadoEm: todayISO() }, ...s.savedRoutes] })),
      deleteSavedRoute: (id) => set((s) => ({ savedRoutes: s.savedRoutes.filter((r) => r.id !== id) })),

      resetDemoData: () =>
        set({
          clients: seed.clients,
          industries: seed.industries,
          products: seed.products,
          visits: seed.visits,
          opportunities: seed.opportunities,
          orders: seed.orders,
          followUps: seed.followUps,
          conversations: seed.conversations,
          aiMessages: initialAiMessages(),
          expenses: seed.expenses,
          savedRoutes: [],
        }),
    }),
    { name: 'secretario-comercial-store' },
  ),
)

function isToday(date: string) {
  return new Date(date).toDateString() === new Date().toDateString()
}
