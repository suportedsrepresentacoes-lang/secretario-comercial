import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import {
  Plus, Trash2, GripVertical, Wand2, Play, Flag, LocateFixed, Search,
  Gauge, Clock, Fuel, Pencil, X, Check, MinusCircle,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import { Button, Input, Textarea } from '../components/ui/Field'
import { getCurrentLocation } from '../lib/geolocation'
import { currency, formatDateTime } from '../lib/date'
import { HOME_BASE } from '../data/seed'
import type { RouteStop, StopStatus, Client } from '../types'

const STOP_STATUS_META: Record<StopStatus, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: '#8D95A3' },
  visitado: { label: 'Visitado', color: '#3FA9A0' },
  nao_visitado: { label: 'Não visitado', color: '#D9695F' },
}

function numberIcon(n: number, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:9999px;background:${color};border:2px solid #12151B;display:flex;align-items:center;justify-content:center;color:#12151B;font-weight:800;font-size:11px">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}
const homeIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#5B8DEF;border:3px solid #12151B;box-shadow:0 0 0 4px #5B8DEF33"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function clientAddress(c: Client): string {
  const e = c.endereco
  return [`${e.logradouro}${e.numero ? `, ${e.numero}` : ''}`, e.bairro, `${e.cidade}/${e.uf}`].filter(Boolean).join(' — ')
}

function clientToStop(c: Client): Omit<RouteStop, 'status'> {
  return {
    id: c.id,
    origem: 'cliente',
    clientId: c.id,
    nome: c.nomeFantasia ?? c.razaoSocial,
    endereco: clientAddress(c),
    lat: c.endereco.lat,
    lng: c.endereco.lng,
    telefone: c.contatos[0]?.telefone,
    whatsapp: c.contatos[0]?.whatsapp,
    segmento: c.segmento,
  }
}

export default function Rotas() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const {
    routes, clients, draftOrigin, draftStops,
    setDraftOrigin, toggleDraftStop, removeDraftStop, clearDraft,
    createRoute, optimizeRoute, reorderRouteStops, removeStopFromRoute,
    updateRouteFuel, startRoute, updateStopStatus, finishRoute, deleteRoute, renameRoute,
  } = useAppStore()

  const [routeName, setRouteName] = useState('Rota de hoje')
  const [clientQuery, setClientQuery] = useState('')
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const routeId = params.get('id')
  const selectedRoute = routes.find((r) => r.id === routeId)

  const planned = routes.filter((r) => r.status === 'planejada')
  const active = routes.filter((r) => r.status === 'em_andamento')

  const matchingClients = useMemo(() => {
    if (!clientQuery.trim()) return []
    const q = clientQuery.toLowerCase()
    const draftIds = new Set(draftStops.map((p) => p.id))
    return clients
      .filter((c) => !draftIds.has(c.id) && (c.nomeFantasia ?? c.razaoSocial).toLowerCase().includes(q))
      .slice(0, 6)
  }, [clientQuery, clients, draftStops])

  async function handleLocate() {
    setLocating(true)
    setLocationError(null)
    try {
      const pos = await getCurrentLocation()
      setDraftOrigin({ lat: pos.lat, lng: pos.lng })
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Não foi possível obter sua localização.')
    } finally {
      setLocating(false)
    }
  }

  function handleCreateRoute() {
    if (draftStops.length === 0) return
    const origin = draftOrigin ?? { lat: HOME_BASE.lat, lng: HOME_BASE.lng }
    const route = createRoute({
      nome: routeName.trim() || 'Rota de hoje',
      origemLat: origin.lat,
      origemLng: origin.lng,
      paradas: draftStops,
    })
    clearDraft()
    setParams({ id: route.id })
  }

  function onDragEnd(result: DropResult) {
    if (!selectedRoute || !result.destination) return
    const ids = selectedRoute.paradas.map((p) => p.id)
    const [moved] = ids.splice(result.source.index, 1)
    ids.splice(result.destination.index, 0, moved)
    reorderRouteStops(selectedRoute.id, ids)
  }

  // ---------- Detalhe de uma rota ----------
  if (selectedRoute) {
    const r = selectedRoute
    const polyline: [number, number][] = [[r.origemLat, r.origemLng], ...r.paradas.map((p) => [p.lat, p.lng] as [number, number])]
    const isPlanned = r.status === 'planejada'
    const isActive = r.status === 'em_andamento'
    const isDone = r.status === 'concluida'
    const visitedCount = r.paradas.filter((p) => p.status !== 'pendente').length

    return (
      <>
        <button onClick={() => setParams({})} className="mb-3 text-[12.5px] text-[#8D95A3] hover:text-[#C7CCD6]">
          ← Voltar para rotas
        </button>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="!w-56" />
                <button onClick={() => { renameRoute(r.id, nameDraft.trim() || r.nome); setEditingName(false) }} className="text-[#3FA9A0]"><Check size={16} /></button>
                <button onClick={() => setEditingName(false)} className="text-[#8D95A3]"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold">{r.nome}</h1>
                {!isDone && (
                  <button onClick={() => { setNameDraft(r.nome); setEditingName(true) }} className="text-[#8D95A3] hover:text-[#F2F0EA]"><Pencil size={14} /></button>
                )}
              </div>
            )}
            <p className="mt-1 text-[13px] text-[#8D95A3]">
              {r.paradas.length} paradas · {r.distanciaTotalKm} km · ~{Math.round(r.tempoEstimadoMin / 60 * 10) / 10}h
              {isActive && <> · {visitedCount}/{r.paradas.length} registradas</>}
            </p>
          </div>
          <div className="flex gap-2">
            {isPlanned && (
              <>
                <Button variant="secondary" onClick={() => optimizeRoute(r.id)}><Wand2 size={14} /> Otimizar rota</Button>
                <Button onClick={() => startRoute(r.id)}><Play size={14} /> Iniciar rota</Button>
              </>
            )}
            {isActive && (
              <Button onClick={() => { finishRoute(r.id); navigate('/historico') }}><Flag size={14} /> Finalizar rota</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            <div className="h-[300px] overflow-hidden rounded-md border border-[#2A313D]">
              <MapContainer center={[r.origemLat, r.origemLng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                <Marker position={[r.origemLat, r.origemLng]} icon={homeIcon}><Popup>Ponto de partida</Popup></Marker>
                {r.paradas.map((p, idx) => (
                  <Marker key={p.id} position={[p.lat, p.lng]} icon={numberIcon(idx + 1, STOP_STATUS_META[p.status].color)}>
                    <Popup>{idx + 1}. {p.nome}</Popup>
                  </Marker>
                ))}
                <Polyline positions={polyline} pathOptions={{ color: '#E2963C', weight: 3, opacity: 0.75, dashArray: '6 6' }} />
              </MapContainer>
            </div>

            <Card title={isPlanned ? 'Paradas (arraste para reordenar)' : 'Paradas'}>
              {isPlanned ? (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="stops">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                        {r.paradas.map((p, idx) => (
                          <Draggable draggableId={p.id} index={idx} key={p.id}>
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className="flex items-center gap-2 rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2.5"
                              >
                                <span {...dragProvided.dragHandleProps} className="text-[#5C6472]"><GripVertical size={15} /></span>
                                <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E2963C] text-[11px] font-bold text-[#12151B]">{idx + 1}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[13px] text-[#F2F0EA]">{p.nome}</div>
                                  <div className="truncate text-[11px] text-[#8D95A3]">{p.endereco}</div>
                                </div>
                                <button onClick={() => removeStopFromRoute(r.id, p.id)} className="text-[#8D95A3] hover:text-[#D9695F]"><Trash2 size={14} /></button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div className="space-y-2">
                  {r.paradas.map((p, idx) => (
                    <div key={p.id} className="rounded-[6px] border border-[#2A313D] bg-[#171C24] p-3">
                      <div className="flex items-center gap-2">
                        <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#12151B]" style={{ background: STOP_STATUS_META[p.status].color }}>{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] text-[#F2F0EA]">{p.nome}</div>
                          <div className="truncate text-[11px] text-[#8D95A3]">{p.endereco}</div>
                        </div>
                      </div>
                      {isActive && (
                        <div className="mt-2.5 space-y-2">
                          <div className="flex gap-1.5">
                            {(['pendente', 'visitado', 'nao_visitado'] as StopStatus[]).map((s) => (
                              <button
                                key={s}
                                onClick={() => updateStopStatus(r.id, p.id, s, p.observacao)}
                                className="rounded-full border px-2.5 py-1 text-[11px]"
                                style={
                                  p.status === s
                                    ? { borderColor: `${STOP_STATUS_META[s].color}66`, background: `${STOP_STATUS_META[s].color}22`, color: STOP_STATUS_META[s].color }
                                    : { borderColor: '#2A313D', color: '#8D95A3' }
                                }
                              >
                                {STOP_STATUS_META[s].label}
                              </button>
                            ))}
                          </div>
                          <Textarea
                            rows={2}
                            placeholder="Observação da visita (opcional)"
                            defaultValue={p.observacao}
                            onBlur={(e) => updateStopStatus(r.id, p.id, p.status, e.target.value)}
                          />
                        </div>
                      )}
                      {isDone && p.observacao && <p className="mt-2 text-[11.5px] text-[#8D95A3]">{p.observacao}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card title="Resumo">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-[6px] border border-[#2A313D] bg-[#171C24] py-3">
                  <Gauge size={15} className="mx-auto mb-1 text-[#3FA9A0]" />
                  <div className="text-[15px] font-semibold">{r.distanciaTotalKm} km</div>
                  <div className="text-[10.5px] text-[#8D95A3]">distância total</div>
                </div>
                <div className="rounded-[6px] border border-[#2A313D] bg-[#171C24] py-3">
                  <Clock size={15} className="mx-auto mb-1 text-[#E2963C]" />
                  <div className="text-[15px] font-semibold">{Math.round((r.tempoEstimadoMin / 60) * 10) / 10}h</div>
                  <div className="text-[10.5px] text-[#8D95A3]">tempo estimado</div>
                </div>
              </div>
            </Card>

            <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#C7CCD6]"><Fuel size={14} /> Combustível</span>}>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11.5px] text-[#8D95A3]">Consumo (km/L)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={r.combustivel.consumoKmL}
                    onChange={(e) => updateRouteFuel(r.id, { consumoKmL: e.target.value === '' ? 0 : Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] text-[#8D95A3]">Preço (R$/L)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={r.combustivel.precoLitro}
                    onChange={(e) => updateRouteFuel(r.id, { precoLitro: e.target.value === '' ? 0 : Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#212833] pt-3 text-[13px]">
                <span className="text-[#8D95A3]">Litros estimados</span>
                <span className="mono text-[#C7CCD6]">{r.combustivel.litrosEstimados.toFixed(2)} L</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[14px]">
                <span className="font-medium text-[#C7CCD6]">Custo estimado</span>
                <span className="mono font-semibold text-[#E2963C]">{currency(r.combustivel.custoEstimado)}</span>
              </div>
            </Card>

            {r.iniciadaEm && (
              <Card>
                <div className="text-[11.5px] text-[#8D95A3]">Iniciada em {formatDateTime(r.iniciadaEm)}</div>
                {r.finalizadaEm && <div className="mt-1 text-[11.5px] text-[#8D95A3]">Finalizada em {formatDateTime(r.finalizadaEm)}</div>}
              </Card>
            )}

            {isPlanned && (
              <Button variant="danger" className="w-full" onClick={() => { if (confirm('Excluir esta rota?')) { deleteRoute(r.id); setParams({}) } }}>
                <Trash2 size={14} /> Excluir rota
              </Button>
            )}
          </div>
        </div>
      </>
    )
  }

  // ---------- Construtor de rota + lista ----------
  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Rotas</h1>
        <p className="mt-1 text-[13px] text-[#8D95A3]">Monte, otimize e execute a rota do dia</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          {active.length > 0 && (
            <Card title="Rota em andamento">
              <div className="space-y-2">
                {active.map((r) => (
                  <button key={r.id} onClick={() => setParams({ id: r.id })} className="flex w-full items-center justify-between rounded-[6px] border border-[#3FA9A0]/30 bg-[#3FA9A0]/10 px-3 py-2.5 text-left">
                    <span className="text-[13px] text-[#F2F0EA]">{r.nome}</span>
                    <span className="text-[11.5px] text-[#3FA9A0]">continuar →</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card title="Rotas planejadas">
            {planned.length === 0 ? (
              <p className="py-4 text-[13px] text-[#8D95A3]">Nenhuma rota planejada. Monte uma nova ao lado.</p>
            ) : (
              <div className="space-y-2">
                {planned.map((r) => (
                  <button key={r.id} onClick={() => setParams({ id: r.id })} className="flex w-full items-center justify-between rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2.5 text-left hover:bg-[#1E2530]">
                    <div>
                      <div className="text-[13px] text-[#F2F0EA]">{r.nome}</div>
                      <div className="text-[11px] text-[#8D95A3]">{r.paradas.length} paradas · {r.distanciaTotalKm} km</div>
                    </div>
                    <span className="mono text-[11.5px] text-[#E2963C]">{currency(r.combustivel.custoEstimado)}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card title="Nova rota">
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[#8D95A3]">Ponto de partida</label>
            {draftOrigin ? (
              <div className="flex items-center justify-between gap-2 rounded-[6px] border border-[#3FA9A0]/30 bg-[#3FA9A0]/10 px-3 py-2 text-[12.5px] text-[#3FA9A0]">
                <span className="flex items-center gap-1.5"><LocateFixed size={14} /> Você está aqui</span>
                <button onClick={handleLocate} className="text-[11px] underline decoration-dotted">atualizar</button>
              </div>
            ) : (
              <Button variant="secondary" className="w-full" onClick={handleLocate} disabled={locating}>
                <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização atual'}
              </Button>
            )}
            {locationError && <p className="mt-1.5 text-[11px] text-[#D9695F]">{locationError}</p>}
            {!draftOrigin && <p className="mt-1.5 text-[11px] text-[#8D95A3]">Sem localização definida, a rota usa um ponto de partida padrão.</p>}
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[#8D95A3]">Paradas selecionadas ({draftStops.length})</label>
            {draftStops.length === 0 ? (
              <p className="text-[12px] text-[#8D95A3]">Nenhuma parada ainda. Adicione clientes abaixo ou vá até Mapa/Prospecção.</p>
            ) : (
              <div className="space-y-1.5">
                {draftStops.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 rounded-[6px] border border-[#2A313D] bg-[#171C24] px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] text-[#F2F0EA]">{p.nome}</div>
                      <div className="truncate text-[10.5px] text-[#8D95A3]">{p.origem === 'cliente' ? 'cliente cadastrado' : 'prospecção'}</div>
                    </div>
                    <button onClick={() => removeDraftStop(p.id)} className="shrink-0 text-[#8D95A3] hover:text-[#D9695F]"><MinusCircle size={15} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[#8D95A3]">Adicionar cliente cadastrado</label>
            <div className="relative">
              <div className="flex items-center gap-2 rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[13px] text-[#8D95A3]">
                <Search size={14} />
                <input
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  placeholder="Buscar por nome…"
                  className="w-full bg-transparent text-[#F2F0EA] outline-none placeholder:text-[#8D95A3]"
                />
              </div>
              {matchingClients.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-[6px] border border-[#2A313D] bg-[#1A1F27] shadow-xl">
                  {matchingClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { toggleDraftStop(clientToStop(c)); setClientQuery('') }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-[#1E2530]"
                    >
                      <Plus size={13} className="text-[#E2963C]" />
                      {c.nomeFantasia ?? c.razaoSocial}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[#8D95A3]">Nome da rota</label>
            <Input value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Ex: Rota Goiânia" />
          </div>

          <Button className="w-full" disabled={draftStops.length === 0} onClick={handleCreateRoute}>
            <Wand2 size={14} /> Criar e otimizar rota
          </Button>
        </Card>
      </div>
    </>
  )
}
