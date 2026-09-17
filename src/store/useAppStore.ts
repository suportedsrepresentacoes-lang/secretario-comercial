import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { newId } from '../lib/id'
import { todayISO, addDays, isPast } from '../lib/date'
import { answerQuery, parseFollowUpCommand } from '../lib/ai'
import { optimizeStopOrder, estimateTravelMinutes, haversineKm } from '../lib/geo'
import { computeFuel } from '../lib/fuel'
import * as seed from '../data/seed'
import type {
  Client, Industry, Product, Visit, Opportunity, Order, FollowUp, Conversation,
  ChatMessage, AiMessage, Expense, SavedRoute, OpportunityStage, ClientStatus,
  RoutePlan, RouteStop, StopStatus, FuelDefaults,
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

  routes: RoutePlan[]
  fuelDefaults: FuelDefaults

  draftOrigin: { lat: number; lng: number } | null
  draftStops: RouteStop[]

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

  createRoute: (input: { nome: string; origemLat: number; origemLng: number; paradas: Array<Omit<RouteStop, 'status'>> }) => RoutePlan
  renameRoute: (routeId: string, nome: string) => void
  optimizeRoute: (routeId: string) => void
  reorderRouteStops: (routeId: string, orderedIds: string[]) => void
  addStopsToRoute: (routeId: string, stops: Array<Omit<RouteStop, 'status'>>) => void
  removeStopFromRoute: (routeId: string, stopId: string) => void
  updateRouteFuel: (routeId: string, patch: Partial<Pick<FuelDefaults, 'consumoKmL' | 'precoLitro'>>) => void
  startRoute: (routeId: string) => void
  startStopVisit: (routeId: string, stopId: string) => void
  updateStopStatus: (
    routeId: string,
    stopId: string,
    patch: Partial<Pick<RouteStop, 'status' | 'observacao' | 'resultado'>>,
  ) => void
  finishRoute: (routeId: string) => void
  deleteRoute: (routeId: string) => void
  updateFuelDefaults: (patch: Partial<FuelDefaults>) => void

  setDraftOrigin: (origin: { lat: number; lng: number } | null) => void
  toggleDraftStop: (stop: Omit<RouteStop, 'status'>) => void
  removeDraftStop: (id: string) => void
  clearDraft: () => void

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

      routes: [],
      fuelDefaults: { tipo: 'gasolina', consumoKmL: 10, precoLitro: 6.2 },
      draftOrigin: null,
      draftStops: [],

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

      createRoute: ({ nome, origemLat, origemLng, paradas }) => {
        const origin = { lat: origemLat, lng: origemLng }
        const withStatus: RouteStop[] = paradas.map((p) => ({ ...p, status: 'pendente' as StopStatus }))
        const { ordered, distanciaTotalKm } = optimizeStopOrder(origin, withStatus)
        const tempoEstimadoMin = estimateTravelMinutes(distanciaTotalKm, ordered.length)
        const { consumoKmL, precoLitro } = get().fuelDefaults
        const route: RoutePlan = {
          id: newId(),
          nome,
          origemLat,
          origemLng,
          paradas: ordered,
          distanciaTotalKm,
          tempoEstimadoMin,
          status: 'planejada',
          combustivel: computeFuel(distanciaTotalKm, consumoKmL, precoLitro),
          criadoEm: todayISO(),
        }
        set((s) => ({ routes: [route, ...s.routes] }))
        return route
      },

      renameRoute: (routeId, nome) =>
        set((s) => ({ routes: s.routes.map((r) => (r.id === routeId ? { ...r, nome } : r)) })),

      optimizeRoute: (routeId) =>
        set((s) => ({
          routes: s.routes.map((r) => {
            if (r.id !== routeId) return r
            const origin = { lat: r.origemLat, lng: r.origemLng }
            const { ordered, distanciaTotalKm } = optimizeStopOrder(origin, r.paradas)
            const tempoEstimadoMin = estimateTravelMinutes(distanciaTotalKm, ordered.length)
            return {
              ...r,
              paradas: ordered,
              distanciaTotalKm,
              tempoEstimadoMin,
              combustivel: computeFuel(distanciaTotalKm, r.combustivel.consumoKmL, r.combustivel.precoLitro),
            }
          }),
        })),

      reorderRouteStops: (routeId, orderedIds) =>
        set((s) => ({
          routes: s.routes.map((r) => {
            if (r.id !== routeId) return r
            const byId = new Map(r.paradas.map((p) => [p.id, p]))
            const paradas = orderedIds.map((id) => byId.get(id)).filter((p): p is RouteStop => !!p)
            const origin = { lat: r.origemLat, lng: r.origemLng }
            let current = origin
            let distanciaTotalKm = 0
            for (const p of paradas) {
              distanciaTotalKm += haversineKm(current, p)
              current = p
            }
            distanciaTotalKm = Math.round(distanciaTotalKm * 10) / 10
            const tempoEstimadoMin = estimateTravelMinutes(distanciaTotalKm, paradas.length)
            return {
              ...r,
              paradas,
              distanciaTotalKm,
              tempoEstimadoMin,
              combustivel: computeFuel(distanciaTotalKm, r.combustivel.consumoKmL, r.combustivel.precoLitro),
            }
          }),
        })),

      addStopsToRoute: (routeId, stops) => {
        const route = get().routes.find((r) => r.id === routeId)
        if (!route) return
        const withStatus: RouteStop[] = stops.map((p) => ({ ...p, status: 'pendente' as StopStatus }))
        const orderedIds = [...route.paradas.map((p) => p.id), ...withStatus.map((p) => p.id)]
        set((s) => ({
          routes: s.routes.map((r) => (r.id === routeId ? { ...r, paradas: [...r.paradas, ...withStatus] } : r)),
        }))
        get().reorderRouteStops(routeId, orderedIds)
      },

      removeStopFromRoute: (routeId, stopId) => {
        const route = get().routes.find((r) => r.id === routeId)
        if (!route) return
        const orderedIds = route.paradas.filter((p) => p.id !== stopId).map((p) => p.id)
        set((s) => ({
          routes: s.routes.map((r) => (r.id === routeId ? { ...r, paradas: r.paradas.filter((p) => p.id !== stopId) } : r)),
        }))
        get().reorderRouteStops(routeId, orderedIds)
      },

      updateRouteFuel: (routeId, patch) =>
        set((s) => ({
          routes: s.routes.map((r) => {
            if (r.id !== routeId) return r
            const consumoKmL = patch.consumoKmL ?? r.combustivel.consumoKmL
            const precoLitro = patch.precoLitro ?? r.combustivel.precoLitro
            return { ...r, combustivel: computeFuel(r.distanciaTotalKm, consumoKmL, precoLitro) }
          }),
        })),

      startRoute: (routeId) =>
        set((s) => ({
          routes: s.routes.map((r) => (r.id === routeId ? { ...r, status: 'em_andamento', iniciadaEm: todayISO() } : r)),
        })),

      startStopVisit: (routeId, stopId) =>
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId
              ? { ...r, paradas: r.paradas.map((p) => (p.id === stopId ? { ...p, chegadaEm: todayISO() } : p)) }
              : r,
          ),
        })),

      updateStopStatus: (routeId, stopId, patch) =>
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId
              ? {
                  ...r,
                  paradas: r.paradas.map((p) =>
                    p.id === stopId
                      ? {
                          ...p,
                          ...patch,
                          saidaEm: patch.status && patch.status !== 'pendente' ? todayISO() : p.saidaEm,
                        }
                      : p,
                  ),
                }
              : r,
          ),
        })),

      finishRoute: (routeId) => {
        const route = get().routes.find((r) => r.id === routeId)
        if (route) {
          route.paradas
            .filter((p) => p.status === 'visitado' && p.origem === 'cliente' && p.clientId)
            .forEach((p) => get().updateClient(p.clientId!, { ultimaVisitaEm: todayISO() }))
        }
        set((s) => ({
          routes: s.routes.map((r) => (r.id === routeId ? { ...r, status: 'concluida', finalizadaEm: todayISO() } : r)),
        }))
      },

      deleteRoute: (routeId) => set((s) => ({ routes: s.routes.filter((r) => r.id !== routeId) })),

      updateFuelDefaults: (patch) => set((s) => ({ fuelDefaults: { ...s.fuelDefaults, ...patch } })),

      setDraftOrigin: (origin) => set({ draftOrigin: origin }),
      toggleDraftStop: (stop) =>
        set((s) => {
          const exists = s.draftStops.some((p) => p.id === stop.id)
          if (exists) return { draftStops: s.draftStops.filter((p) => p.id !== stop.id) }
          return { draftStops: [...s.draftStops, { ...stop, status: 'pendente' as StopStatus }] }
        }),
      removeDraftStop: (id) => set((s) => ({ draftStops: s.draftStops.filter((p) => p.id !== id) })),
      clearDraft: () => set({ draftStops: [] }),

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
          routes: [],
          fuelDefaults: { tipo: 'gasolina', consumoKmL: 10, precoLitro: 6.2 },
          draftOrigin: null,
          draftStops: [],
        }),
    }),
    { name: 'secretario-comercial-store' },
  ),
)

function isToday(date: string) {
  return new Date(date).toDateString() === new Date().toDateString()
}
