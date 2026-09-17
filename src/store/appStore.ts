import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { optimizeStopOrder, estimateDurationMin, estimateFuel, haversineKm } from '../services/routing'
import * as seed from '../data/seed'
import type {
  Client, ClientStatus, Expense, RoutePlan, RouteStop, StopStatus, DraftStop,
  VehicleSettings, FavoritePlace,
} from '../types'

function newId(): string {
  return crypto.randomUUID()
}

function nowISO(): string {
  return new Date().toISOString()
}

interface AppState {
  clients: Client[]
  routes: RoutePlan[]
  expenses: Expense[]
  favorites: FavoritePlace[]
  vehicle: VehicleSettings
  repName: string
  companyName: string

  draftOrigin: { lat: number; lng: number } | null
  draftStops: DraftStop[]

  addClient: (c: Omit<Client, 'id' | 'criadoEm' | 'tags'> & { tags?: string[] }) => Client
  updateClient: (id: string, patch: Partial<Client>) => void
  deleteClient: (id: string) => void
  setClientStatus: (id: string, status: ClientStatus) => void

  addExpense: (e: Omit<Expense, 'id'>) => void
  deleteExpense: (id: string) => void

  addFavorite: (f: Omit<FavoritePlace, 'id'>) => void
  deleteFavorite: (id: string) => void

  updateVehicle: (patch: Partial<VehicleSettings>) => void
  updateProfile: (patch: { repName?: string; companyName?: string }) => void

  createRoute: (input: { nome: string; origemLat: number; origemLng: number; paradas: DraftStop[] }) => RoutePlan
  renameRoute: (routeId: string, nome: string) => void
  optimizeRoute: (routeId: string) => void
  reorderRouteStops: (routeId: string, orderedIds: string[]) => void
  removeStopFromRoute: (routeId: string, stopId: string) => void
  updateRouteFuel: (routeId: string, patch: Partial<Pick<VehicleSettings, 'consumoKmL' | 'precoLitro'>>) => void
  startRoute: (routeId: string) => void
  startStopVisit: (routeId: string, stopId: string) => void
  updateStopStatus: (routeId: string, stopId: string, patch: Partial<Pick<RouteStop, 'status' | 'observacao' | 'resultado'>>) => void
  finishRoute: (routeId: string, kmRealPercorrido?: number) => void
  deleteRoute: (routeId: string) => void

  setDraftOrigin: (origin: { lat: number; lng: number } | null) => void
  toggleDraftStop: (stop: DraftStop) => void
  removeDraftStop: (id: string) => void
  clearDraft: () => void

  resetDemoData: () => void
}

function stopFromDraft(d: DraftStop): RouteStop {
  return { ...d, status: 'pendente' }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: seed.clients,
      routes: [],
      expenses: seed.expenses,
      favorites: [],
      vehicle: { combustivel: 'gasolina', consumoKmL: 10, precoLitro: 6.2 },
      repName: 'Diego Silva',
      companyName: 'DS Representações',

      draftOrigin: null,
      draftStops: [],

      addClient: (c) => {
        const client: Client = { ...c, id: newId(), criadoEm: nowISO(), tags: c.tags ?? [] }
        set((s) => ({ clients: [client, ...s.clients] }))
        return client
      },
      updateClient: (id, patch) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
      setClientStatus: (id, status) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, status } : c)) })),

      addExpense: (e) => set((s) => ({ expenses: [{ ...e, id: newId() }, ...s.expenses] })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addFavorite: (f) => set((s) => ({ favorites: [...s.favorites, { ...f, id: newId() }] })),
      deleteFavorite: (id) => set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),

      updateVehicle: (patch) => set((s) => ({ vehicle: { ...s.vehicle, ...patch } })),
      updateProfile: (patch) => set(patch),

      createRoute: ({ nome, origemLat, origemLng, paradas }) => {
        const origin = { lat: origemLat, lng: origemLng }
        const stops = paradas.map(stopFromDraft)
        const { ordered, distanciaKm } = optimizeStopOrder(origin, stops)
        const duracaoMin = estimateDurationMin(distanciaKm, ordered.length)
        const { consumoKmL, precoLitro } = get().vehicle
        const route: RoutePlan = {
          id: newId(),
          nome,
          origemLat,
          origemLng,
          paradas: ordered,
          distanciaKm,
          duracaoMin,
          status: 'planejada',
          combustivel: estimateFuel(distanciaKm, consumoKmL, precoLitro),
          criadoEm: nowISO(),
        }
        set((s) => ({ routes: [route, ...s.routes] }))
        return route
      },

      renameRoute: (routeId, nome) => set((s) => ({ routes: s.routes.map((r) => (r.id === routeId ? { ...r, nome } : r)) })),

      optimizeRoute: (routeId) =>
        set((s) => ({
          routes: s.routes.map((r) => {
            if (r.id !== routeId) return r
            const origin = { lat: r.origemLat, lng: r.origemLng }
            const { ordered, distanciaKm } = optimizeStopOrder(origin, r.paradas)
            return {
              ...r,
              paradas: ordered,
              distanciaKm,
              duracaoMin: estimateDurationMin(distanciaKm, ordered.length),
              combustivel: estimateFuel(distanciaKm, r.combustivel.consumoKmL, r.combustivel.precoLitro),
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
            let distanciaKm = 0
            for (const p of paradas) {
              distanciaKm += haversineKm(current, p)
              current = p
            }
            distanciaKm = Math.round(distanciaKm * 10) / 10
            return {
              ...r,
              paradas,
              distanciaKm,
              duracaoMin: estimateDurationMin(distanciaKm, paradas.length),
              combustivel: estimateFuel(distanciaKm, r.combustivel.consumoKmL, r.combustivel.precoLitro),
            }
          }),
        })),

      removeStopFromRoute: (routeId, stopId) => {
        const route = get().routes.find((r) => r.id === routeId)
        if (!route) return
        const orderedIds = route.paradas.filter((p) => p.id !== stopId).map((p) => p.id)
        set((s) => ({ routes: s.routes.map((r) => (r.id === routeId ? { ...r, paradas: r.paradas.filter((p) => p.id !== stopId) } : r)) }))
        get().reorderRouteStops(routeId, orderedIds)
      },

      updateRouteFuel: (routeId, patch) =>
        set((s) => ({
          routes: s.routes.map((r) => {
            if (r.id !== routeId) return r
            const consumoKmL = patch.consumoKmL ?? r.combustivel.consumoKmL
            const precoLitro = patch.precoLitro ?? r.combustivel.precoLitro
            return { ...r, combustivel: estimateFuel(r.distanciaKm, consumoKmL, precoLitro) }
          }),
        })),

      startRoute: (routeId) =>
        set((s) => ({ routes: s.routes.map((r) => (r.id === routeId ? { ...r, status: 'em_andamento', iniciadaEm: nowISO() } : r)) })),

      startStopVisit: (routeId, stopId) =>
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId ? { ...r, paradas: r.paradas.map((p) => (p.id === stopId ? { ...p, chegadaEm: nowISO() } : p)) } : r,
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
                      ? { ...p, ...patch, saidaEm: patch.status && patch.status !== 'pendente' ? nowISO() : p.saidaEm }
                      : p,
                  ),
                }
              : r,
          ),
        })),

      finishRoute: (routeId, kmRealPercorrido) => {
        const route = get().routes.find((r) => r.id === routeId)
        if (route) {
          route.paradas
            .filter((p) => p.status === 'visitado' && p.origem === 'cliente' && p.clientId)
            .forEach((p) => get().updateClient(p.clientId!, { ultimaVisitaEm: nowISO() }))
        }
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId ? { ...r, status: 'concluida', finalizadaEm: nowISO(), kmRealPercorrido } : r,
          ),
        }))
      },

      deleteRoute: (routeId) => set((s) => ({ routes: s.routes.filter((r) => r.id !== routeId) })),

      setDraftOrigin: (origin) => set({ draftOrigin: origin }),
      toggleDraftStop: (stop) =>
        set((s) => {
          const exists = s.draftStops.some((p) => p.id === stop.id)
          return exists ? { draftStops: s.draftStops.filter((p) => p.id !== stop.id) } : { draftStops: [...s.draftStops, stop] }
        }),
      removeDraftStop: (id) => set((s) => ({ draftStops: s.draftStops.filter((p) => p.id !== id) })),
      clearDraft: () => set({ draftStops: [] }),

      resetDemoData: () =>
        set({
          clients: seed.clients,
          expenses: seed.expenses,
          favorites: [],
          routes: [],
          vehicle: { combustivel: 'gasolina', consumoKmL: 10, precoLitro: 6.2 },
          draftOrigin: null,
          draftStops: [],
        }),
    }),
    { name: 'campovista-store' },
  ),
)

export type { StopStatus }
