import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import {
  Plus, Trash2, GripVertical, Wand2, Play, Flag, LocateFixed, Search,
  Gauge, Clock, Fuel, Pencil, X, Check, MinusCircle, Route as RouteEmptyIcon, Compass,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import { Button, Input, Textarea } from '../components/ui/Field'
import { getCurrentLocation } from '../lib/geolocation'
import { currency, formatDateTime } from '../lib/date'
import { HOME_BASE } from '../data/seed'
import type { RouteStop, StopStatus, Client } from '../types'

const STOP_STATUS_META: Record<StopStatus, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: '#8F8676' },
  visitado: { label: 'Visitado', color: '#3FA9A0' },
  nao_visitado: { label: 'Não visitado', color: '#D9695F' },
}

function numberIcon(n: number, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:9999px;background:${color};border:2px solid #FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-weight:800;font-size:11px">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}
const homeIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#5B8DEF;border:3px solid #FFFFFF;box-shadow:0 0 0 4px #5B8DEF33"></div>`,
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
  const active = routes.filter((r) => r.status === 'em_andamento')
  // Sem ?id na URL, mostra automaticamente a rota em andamento (se houver) — essa aba é o "agora".
  const selectedRoute = routes.find((r) => r.id === routeId) ?? (!routeId ? active[0] : undefined)

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

  // ---------- Detalhe / execução de uma rota ----------
  if (selectedRoute) {
    const r = selectedRoute
    const polyline: [number, number][] = [[r.origemLat, r.origemLng], ...r.paradas.map((p) => [p.lat, p.lng] as [number, number])]
    const isPlanned = r.status === 'planejada'
    const isActive = r.status === 'em_andamento'
    const isDone = r.status === 'concluida'
    const visitedCount = r.paradas.filter((p) => p.status !== 'pendente').length

    return (
      <>
        <button onClick={() => navigate('/salvas')} className="mb-3 text-[12.5px] text-[#8F8676] hover:text-[#5A5346]">
          ← Ver rotas salvas
        </button>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="!w-56" />
                <button onClick={() => { renameRoute(r.id, nameDraft.trim() || r.nome); setEditingName(false) }} className="text-[#3FA9A0]"><Check size={16} /></button>
                <button onClick={() => setEditingName(false)} className="text-[#8F8676]"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold">{r.nome}</h1>
                {!isDone && (
                  <button onClick={() => { setNameDraft(r.nome); setEditingName(true) }} className="text-[#8F8676] hover:text-[#2B2620]"><Pencil size={14} /></button>
                )}
              </div>
            )}
            <p className="mt-1 text-[13px] text-[#8F8676]">
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
              <Button onClick={() => { finishRoute(r.id); navigate('/salvas') }}><Flag size={14} /> Finalizar rota</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            <div className="h-[300px] overflow-hidden rounded-md border border-[#E4DCC8]">
              <MapContainer center={[r.origemLat, r.origemLng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                <Marker position={[r.origemLat, r.origemLng]} icon={homeIcon}><Popup>Ponto de partida</Popup></Marker>
                {r.paradas.map((p, idx) => (
                  <Marker key={p.id} position={[p.lat, p.lng]} icon={numberIcon(idx + 1, STOP_STATUS_META[p.status].color)}>
                    <Popup>{idx + 1}. {p.nome}</Popup>
                  </Marker>
                ))}
                <Polyline positions={polyline} pathOptions={{ color: '#3B82F6', weight: 3, opacity: 0.75, dashArray: '6 6' }} />
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
                                className="flex items-center gap-2 rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] px-3 py-2.5"
                              >
                                <span {...dragProvided.dragHandleProps} className="text-[#A69E8E]"><GripVertical size={15} /></span>
                                <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-[11px] font-bold text-[#2B2620]">{idx + 1}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[13px] text-[#2B2620]">{p.nome}</div>
                                  <div className="truncate text-[11px] text-[#8F8676]">{p.endereco}</div>
                                </div>
                                <button onClick={() => removeStopFromRoute(r.id, p.id)} className="text-[#8F8676] hover:text-[#D9695F]"><Trash2 size={14} /></button>
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
                    <div key={p.id} className="rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] p-3">
                      <div className="flex items-center gap-2">
                        <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#2B2620]" style={{ background: STOP_STATUS_META[p.status].color }}>{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] text-[#2B2620]">{p.nome}</div>
                          <div className="truncate text-[11px] text-[#8F8676]">{p.endereco}</div>
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
                                    : { borderColor: '#E4DCC8', color: '#8F8676' }
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
                      {isDone && p.observacao && <p className="mt-2 text-[11.5px] text-[#8F8676]">{p.observacao}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card title="Resumo">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] py-3">
                  <Gauge size={15} className="mx-auto mb-1 text-[#3FA9A0]" />
                  <div className="text-[15px] font-semibold">{r.distanciaTotalKm} km</div>
                  <div className="text-[10.5px] text-[#8F8676]">distância total</div>
                </div>
                <div className="rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] py-3">
                  <Clock size={15} className="mx-auto mb-1 text-[#3B82F6]" />
                  <div className="text-[15px] font-semibold">{Math.round((r.tempoEstimadoMin / 60) * 10) / 10}h</div>
                  <div className="text-[10.5px] text-[#8F8676]">tempo estimado</div>
                </div>
              </div>
            </Card>

            <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#5A5346]"><Fuel size={14} /> Combustível</span>}>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11.5px] text-[#8F8676]">Consumo (km/L)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={r.combustivel.consumoKmL}
                    onChange={(e) => updateRouteFuel(r.id, { consumoKmL: e.target.value === '' ? 0 : Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] text-[#8F8676]">Preço (R$/L)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={r.combustivel.precoLitro}
                    onChange={(e) => updateRouteFuel(r.id, { precoLitro: e.target.value === '' ? 0 : Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#ECE5D6] pt-3 text-[13px]">
                <span className="text-[#8F8676]">Litros estimados</span>
                <span className="mono text-[#5A5346]">{r.combustivel.litrosEstimados.toFixed(2)} L</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[14px]">
                <span className="font-medium text-[#5A5346]">Custo estimado</span>
                <span className="mono font-semibold text-[#3B82F6]">{currency(r.combustivel.custoEstimado)}</span>
              </div>
            </Card>

            {r.iniciadaEm && (
              <Card>
                <div className="text-[11.5px] text-[#8F8676]">Iniciada em {formatDateTime(r.iniciadaEm)}</div>
                {r.finalizadaEm && <div className="mt-1 text-[11.5px] text-[#8F8676]">Finalizada em {formatDateTime(r.finalizadaEm)}</div>}
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

  // ---------- Sem rota em andamento: construtor (se há rascunho) ou estado vazio ----------
  if (draftStops.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3EEE3] text-[#3B82F6]">
          <RouteEmptyIcon size={28} />
        </div>
        <h1 className="text-[18px] font-bold">Seu roteiro está vazio</h1>
        <p className="text-[13.5px] text-[#8F8676]">
          Nenhuma parada foi selecionada ainda. Vá até <strong>Buscar</strong>, defina sua localização e segmentos, e clique em{' '}
          <strong>"+ Adicionar à Rota"</strong> nos estabelecimentos e clientes que deseja visitar.
        </p>
        <Button onClick={() => navigate('/')}>
          <Compass size={14} /> Ir para Buscar
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Rota</h1>
        <p className="mt-1 text-[13px] text-[#8F8676]">Revise as paradas, defina a origem e crie a rota otimizada</p>
      </div>

      <Card title="Nova rota" className="mx-auto max-w-xl">
        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#8F8676]">Ponto de partida</label>
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
          {!draftOrigin && <p className="mt-1.5 text-[11px] text-[#8F8676]">Sem localização definida, a rota usa um ponto de partida padrão.</p>}
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#8F8676]">Paradas selecionadas ({draftStops.length})</label>
          <div className="space-y-1.5">
            {draftStops.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] px-2.5 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] text-[#2B2620]">{p.nome}</div>
                  <div className="truncate text-[10.5px] text-[#8F8676]">{p.origem === 'cliente' ? 'cliente cadastrado' : 'prospecção'}</div>
                </div>
                <button onClick={() => removeDraftStop(p.id)} className="shrink-0 text-[#8F8676] hover:text-[#D9695F]"><MinusCircle size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#8F8676]">Adicionar cliente cadastrado</label>
          <div className="relative">
            <div className="flex items-center gap-2 rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] px-3 py-2 text-[13px] text-[#8F8676]">
              <Search size={14} />
              <input
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                placeholder="Buscar por nome…"
                className="w-full bg-transparent text-[#2B2620] outline-none placeholder:text-[#8F8676]"
              />
            </div>
            {matchingClients.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-[6px] border border-[#E4DCC8] bg-[#FFFFFF] shadow-xl">
                {matchingClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { toggleDraftStop(clientToStop(c)); setClientQuery('') }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-[#ECE3D2]"
                  >
                    <Plus size={13} className="text-[#3B82F6]" />
                    {c.nomeFantasia ?? c.razaoSocial}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#8F8676]">Nome da rota</label>
          <Input value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Ex: Rota Goiânia" />
        </div>

        <Button className="w-full" disabled={draftStops.length === 0} onClick={handleCreateRoute}>
          <Wand2 size={14} /> Criar e otimizar rota
        </Button>
      </Card>
    </>
  )
}
