import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import {
  Plus, Trash2, GripVertical, Wand2, Play, Flag, LocateFixed, Search,
  Gauge, Clock, Fuel, Pencil, X, Check, MinusCircle, Route as RouteEmptyIcon, Compass,
  Smartphone, List, PartyPopper, Star, Map, AlertCircle,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Field'
import { LocationButtons } from '../components/ui/LocationButtons'
import { getCurrentPosition } from '../services/geolocation'
import { buildFullRouteNavigation, hasValidCoords } from '../services/navigation'
import { currency, formatDateTime } from '../lib/format'
import { STOP_STATUS_COLOR, STOP_STATUS_LABEL, VISIT_RESULTADO_LABEL, stopStatusForResultado } from '../lib/labels'
import { HOME_BASE } from '../data/seed'
import type { RouteStop, Client, DraftStop, VisitResultado } from '../types'

function numberIcon(n: number, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}
const homeIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#5B8DEF;border:3px solid #fff;box-shadow:0 0 0 4px #5B8DEF33"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function clientAddress(c: Client): string {
  const e = c.endereco
  return [`${e.logradouro}${e.numero ? `, ${e.numero}` : ''}`, e.bairro, `${e.cidade}/${e.uf}`].filter(Boolean).join(' — ')
}

function clientToStop(c: Client): DraftStop {
  return { id: c.id, origem: 'cliente', clientId: c.id, nome: c.nomeFantasia, endereco: clientAddress(c), lat: c.endereco.lat, lng: c.endereco.lng, telefone: c.telefone, segmento: c.segmento }
}

type StopStatusPatch = Partial<Pick<RouteStop, 'status' | 'observacao' | 'resultado'>>

function StopVisitCard({
  routeId, stop, index, big, onStartVisit, onUpdateStatus,
}: {
  routeId: string
  stop: RouteStop
  index: number
  big?: boolean
  onStartVisit: (routeId: string, stopId: string) => void
  onUpdateStatus: (routeId: string, stopId: string, patch: StopStatusPatch) => void
}) {
  const finished = stop.status !== 'pendente'
  const [editing, setEditing] = useState(!finished)
  const [resultado, setResultado] = useState<VisitResultado | undefined>(stop.resultado)
  const [obs, setObs] = useState(stop.observacao ?? '')
  const started = !!stop.chegadaEm

  function finalize() {
    if (!resultado) return
    onUpdateStatus(routeId, stop.id, { status: stopStatusForResultado(resultado), resultado, observacao: obs })
    setEditing(false)
  }

  return (
    <div className={`rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] ${big ? 'p-5' : 'p-3'}`}>
      <div className="flex items-center gap-2.5">
        <span
          className={`mono flex shrink-0 items-center justify-center rounded-full font-bold ${big ? 'h-9 w-9 text-[13px] text-white' : 'h-6 w-6 text-[11px] text-[#0F2A44]'}`}
          style={{ background: STOP_STATUS_COLOR[stop.status], color: big ? '#FFFFFF' : undefined }}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className={`truncate text-[#0F2A44] ${big ? 'text-[16px] font-semibold' : 'text-[13px]'}`}>{stop.nome}</div>
          <div className={`truncate text-[#6B7F93] ${big ? 'text-[12.5px]' : 'text-[11px]'}`}>{stop.endereco}</div>
        </div>
        {finished && !editing && (
          <button onClick={() => setEditing(true)} className="shrink-0 text-[#6B7F93] hover:text-[#0F2A44]"><Pencil size={13} /></button>
        )}
      </div>

      <LocationButtons lat={stop.lat} lng={stop.lng} size={big ? 'md' : 'sm'} className="mt-3" />

      {editing ? (
        <div className="mt-3 space-y-2">
          {!started ? (
            <Button className="w-full" onClick={() => onStartVisit(routeId, stop.id)}><Play size={13} /> Iniciar visita</Button>
          ) : (
            <>
              <div className="text-[11px] font-medium text-[#6B7F93]">Resultado da visita</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(VISIT_RESULTADO_LABEL) as VisitResultado[]).map((rOpt) => (
                  <button key={rOpt} onClick={() => setResultado(rOpt)} className={`rounded-full border px-2.5 py-1 text-[11px] ${resultado === rOpt ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] text-[#6B7F93]'}`}>
                    {VISIT_RESULTADO_LABEL[rOpt]}
                  </button>
                ))}
              </div>
              <Textarea rows={2} placeholder="Observações da visita (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
              <Button className="w-full" disabled={!resultado} onClick={finalize}><Flag size={13} /> Finalizar visita</Button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-2.5 flex items-center justify-between rounded-[8px] bg-white px-3 py-2 text-[11.5px]">
          <span className="font-medium" style={{ color: STOP_STATUS_COLOR[stop.status] }}>
            {stop.resultado ? VISIT_RESULTADO_LABEL[stop.resultado] : STOP_STATUS_LABEL[stop.status]}
          </span>
        </div>
      )}
      {!editing && stop.observacao && <p className="mt-1.5 text-[11.5px] text-[#6B7F93]">{stop.observacao}</p>}
    </div>
  )
}

export default function Rotas() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const {
    routes, clients, draftOrigin, draftStops, favorites,
    setDraftOrigin, toggleDraftStop, removeDraftStop, clearDraft, addFavorite,
    createRoute, optimizeRoute, reorderRouteStops, removeStopFromRoute,
    updateRouteFuel, startRoute, startStopVisit, updateStopStatus, finishRoute, deleteRoute, renameRoute,
  } = useAppStore()

  const [routeName, setRouteName] = useState('Rota de hoje')
  const [clientQuery, setClientQuery] = useState('')
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [modoCampo, setModoCampo] = useState(false)
  const [kmRealInput, setKmRealInput] = useState('')
  const [navApp, setNavApp] = useState<'google' | 'waze'>('google')
  const [linkCopied, setLinkCopied] = useState(false)

  const routeId = params.get('id')
  const active = routes.filter((r) => r.status === 'em_andamento')
  const selectedRoute = routes.find((r) => r.id === routeId) ?? (!routeId ? active[0] : undefined)

  const matchingClients = useMemo(() => {
    if (!clientQuery.trim()) return []
    const q = clientQuery.toLowerCase()
    const draftIds = new Set(draftStops.map((p) => p.id))
    return clients.filter((c) => !draftIds.has(c.id) && c.nomeFantasia.toLowerCase().includes(q)).slice(0, 6)
  }, [clientQuery, clients, draftStops])

  async function handleLocate() {
    setLocating(true)
    setLocationError(null)
    try {
      const pos = await getCurrentPosition()
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
    const route = createRoute({ nome: routeName.trim() || 'Rota de hoje', origemLat: origin.lat, origemLng: origin.lng, paradas: draftStops })
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

  if (selectedRoute) {
    const r = selectedRoute
    // Uma parada com coordenada inválida (ex: dado antigo/corrompido) derrubaria o mapa inteiro do
    // Leaflet sem esse filtro — o resto da rota continua sendo exibido normalmente.
    const paradasComCoordenada = r.paradas.filter((p) => hasValidCoords(p.lat, p.lng))
    const polyline: [number, number][] = [[r.origemLat, r.origemLng], ...paradasComCoordenada.map((p) => [p.lat, p.lng] as [number, number])]
    const isPlanned = r.status === 'planejada'
    const isActive = r.status === 'em_andamento'
    const isDone = r.status === 'concluida'
    const visitedCount = r.paradas.filter((p) => p.status !== 'pendente').length
    // Enquanto a rota não começou, a navegação cobre todas as paradas; depois de iniciada, só as que
    // ainda faltam — assim "continuar navegação" não manda o representante rever quem já foi visitado.
    const stopsForNav = isActive ? r.paradas.filter((p) => p.status === 'pendente') : r.paradas
    const fullRouteNav = buildFullRouteNavigation({ lat: r.origemLat, lng: r.origemLng }, stopsForNav)
    const primaryNavLink = fullRouteNav ? (navApp === 'google' ? fullRouteNav.googleMaps[0] : fullRouteNav.wazeLegs[0]) : undefined

    function handleFinishRoute() {
      const km = kmRealInput.trim() === '' ? undefined : Number(kmRealInput)
      const pendentes = r.paradas.filter((p) => p.status === 'pendente').length
      const concluidas = r.paradas.length - pendentes
      const resumo = [
        'Finalizar esta rota?',
        '',
        `${concluidas} parada${concluidas === 1 ? '' : 's'} concluída${concluidas === 1 ? '' : 's'}`,
        `${pendentes} parada${pendentes === 1 ? '' : 's'} pendente${pendentes === 1 ? '' : 's'}`,
        `Km planejado: ${r.distanciaKm} km`,
        km != null ? `Km real informado: ${km} km` : null,
        `Duração estimada: ~${Math.round((r.duracaoMin / 60) * 10) / 10}h`,
      ].filter(Boolean).join('\n')
      if (!confirm(resumo)) return
      finishRoute(r.id, km)
      navigate('/historico')
    }

    function handlePrimaryNavigation() {
      if (!primaryNavLink) return
      if (isPlanned) startRoute(r.id)
      window.open(primaryNavLink.url, '_blank', 'noopener,noreferrer')
    }

    async function handleCopyLink() {
      if (!primaryNavLink) return
      try {
        await navigator.clipboard.writeText(primaryNavLink.url)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      } catch {
        // Sem permissão de clipboard (ex: HTTP não seguro) — o link já está disponível no botão principal.
      }
    }

    return (
      <>
        <button onClick={() => navigate('/historico')} className="mb-3 text-[12.5px] text-[#6B7F93] hover:text-[#33495E]">← Ver histórico de rotas</button>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="!w-56" />
                <button onClick={() => { renameRoute(r.id, nameDraft.trim() || r.nome); setEditingName(false) }} className="text-[#16A34A]"><Check size={16} /></button>
                <button onClick={() => setEditingName(false)} className="text-[#6B7F93]"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold">{r.nome}</h1>
                {!isDone && <button onClick={() => { setNameDraft(r.nome); setEditingName(true) }} className="text-[#6B7F93] hover:text-[#0F2A44]"><Pencil size={14} /></button>}
              </div>
            )}
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#6B7F93]">
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ background: isDone ? '#E1EDFB' : isActive ? '#16A34A1A' : '#3B82F61A', color: isDone ? '#6B7F93' : isActive ? '#16A34A' : '#3B82F6' }}
              >
                {isDone ? 'Finalizada' : isActive ? 'Em andamento' : 'Não iniciada'}
              </span>
              · {r.paradas.length} paradas · {r.distanciaKm} km · ~{Math.round((r.duracaoMin / 60) * 10) / 10}h
              {isActive && <> · {visitedCount}/{r.paradas.length} registradas</>}
            </p>
          </div>
          <div className="flex gap-2">
            {isPlanned && <Button variant="secondary" onClick={() => optimizeRoute(r.id)}><Wand2 size={14} /> Otimizar rota</Button>}
            {isActive && (
              <>
                <Button variant="secondary" onClick={() => setModoCampo((v) => !v)}>
                  {modoCampo ? <List size={14} /> : <Smartphone size={14} />} {modoCampo ? 'Ver todas as paradas' : 'Modo Campo'}
                </Button>
                <Button onClick={handleFinishRoute}><Flag size={14} /> Finalizar rota</Button>
              </>
            )}
          </div>
        </div>

        {!isDone && (
          <Card className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Map size={14} /> Navegação da rota</span>
              <div className="flex rounded-full border border-[#CFE0F5] p-0.5">
                <button onClick={() => setNavApp('google')} className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${navApp === 'google' ? 'bg-[#3B82F6] text-white' : 'text-[#6B7F93]'}`}>Google Maps</button>
                <button onClick={() => setNavApp('waze')} className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${navApp === 'waze' ? 'bg-[#3B82F6] text-white' : 'text-[#6B7F93]'}`}>Waze</button>
              </div>
            </div>

            {fullRouteNav && fullRouteNav.skipped.length > 0 && (
              <p className="mb-3 flex items-start gap-1.5 rounded-[8px] border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3 py-2 text-[11.5px] text-[#B45309]">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                {fullRouteNav.skipped.length === 1
                  ? `"${fullRouteNav.skipped[0].nome}" ficou de fora da navegação por não ter coordenadas válidas.`
                  : `${fullRouteNav.skipped.length} paradas ficaram de fora da navegação por não terem coordenadas válidas.`}
              </p>
            )}

            {navApp === 'waze' && fullRouteNav && (fullRouteNav.wazeLegs.length > 1 || isActive) && (
              <p className="mb-3 text-[11px] text-[#6B7F93]">
                O Waze não aceita uma rota com várias paradas num único link — o botão abaixo abre sempre o trecho até a{isActive ? ' próxima' : ' primeira'} parada pendente; ao concluí-la, toque de novo para seguir para a seguinte.
              </p>
            )}

            {primaryNavLink ? (
              <>
                <Button className="w-full" onClick={handlePrimaryNavigation}>
                  <Play size={14} /> {isActive ? 'Continuar navegação' : 'Iniciar rota'} no {navApp === 'google' ? 'Google Maps' : 'Waze'}
                </Button>
                <button onClick={handleCopyLink} className="mt-2 flex w-full items-center justify-center gap-1.5 text-[11.5px] text-[#6B7F93] underline decoration-dotted hover:text-[#33495E]">
                  {linkCopied ? 'Link copiado!' : 'Copiar link'}
                </button>
              </>
            ) : isActive ? (
              <p className="flex items-center gap-1.5 text-[12.5px] text-[#16A34A]"><PartyPopper size={14} /> Todas as paradas com coordenada já foram visitadas — finalize a rota quando estiver pronto.</p>
            ) : (
              <p className="flex items-start gap-1.5 text-[12.5px] text-[#6B7F93]">
                <AlertCircle size={13} className="mt-0.5 shrink-0" /> Nenhuma parada desta rota tem coordenadas válidas para gerar a navegação.
              </p>
            )}
          </Card>
        )}

        {isActive && (
          <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2.5">
            <Gauge size={14} className="shrink-0 text-[#6B7F93]" />
            <span className="shrink-0 text-[12px] text-[#33495E]">Km real percorrido (opcional, ao finalizar)</span>
            <Input type="number" step="0.1" placeholder={`${r.distanciaKm} km planejados`} value={kmRealInput} onChange={(e) => setKmRealInput(e.target.value)} className="!w-32" />
          </div>
        )}

        {isActive && modoCampo ? (
          <div className="mx-auto max-w-md">
            {(() => {
              const nextIdx = r.paradas.findIndex((p) => p.status === 'pendente')
              const nextStop = nextIdx >= 0 ? r.paradas[nextIdx] : null
              if (!nextStop) {
                return (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-[#CFE0F5] bg-[#EAF3FC] p-8 text-center">
                    <PartyPopper size={28} className="text-[#16A34A]" />
                    <div className="text-[15px] font-semibold text-[#0F2A44]">Todas as paradas foram registradas!</div>
                    <p className="text-[12.5px] text-[#6B7F93]">Você concluiu {visitedCount} de {r.paradas.length} paradas desta rota.</p>
                    <Button onClick={handleFinishRoute}><Flag size={14} /> Finalizar rota</Button>
                  </div>
                )
              }
              return (
                <>
                  <div className="mb-3 text-center text-[12px] font-medium text-[#6B7F93]">
                    Próxima parada · {nextIdx + 1} de {r.paradas.length} · {visitedCount}/{r.paradas.length} registradas
                  </div>
                  <StopVisitCard key={nextStop.id} routeId={r.id} stop={nextStop} index={nextIdx} big onStartVisit={startStopVisit} onUpdateStatus={updateStopStatus} />
                </>
              )
            })()}
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            <div className="h-[300px] overflow-hidden rounded-xl border border-[#CFE0F5]">
              <MapContainer center={[r.origemLat, r.origemLng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                <Marker position={[r.origemLat, r.origemLng]} icon={homeIcon}><Popup>Ponto de partida</Popup></Marker>
                {r.paradas.map((p, idx) =>
                  hasValidCoords(p.lat, p.lng) ? (
                    <Marker key={p.id} position={[p.lat, p.lng]} icon={numberIcon(idx + 1, STOP_STATUS_COLOR[p.status])}><Popup>{idx + 1}. {p.nome}</Popup></Marker>
                  ) : null,
                )}
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
                              <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className="flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2.5">
                                <span {...dragProvided.dragHandleProps} className="text-[#93A5BC]"><GripVertical size={15} /></span>
                                <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-[11px] font-bold text-white">{idx + 1}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[13px] text-[#0F2A44]">{p.nome}</div>
                                  <div className="truncate text-[11px] text-[#6B7F93]">{p.endereco}</div>
                                </div>
                                <button onClick={() => removeStopFromRoute(r.id, p.id)} className="text-[#6B7F93] hover:text-[#EF4444]"><Trash2 size={14} /></button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : isActive ? (
                <div className="space-y-2">
                  {r.paradas.map((p, idx) => (
                    <StopVisitCard key={p.id} routeId={r.id} stop={p} index={idx} onStartVisit={startStopVisit} onUpdateStatus={updateStopStatus} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {r.paradas.map((p, idx) => (
                    <div key={p.id} className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
                      <div className="flex items-center gap-2">
                        <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#0F2A44]" style={{ background: STOP_STATUS_COLOR[p.status] }}>{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] text-[#0F2A44]">{p.nome}</div>
                          <div className="truncate text-[11px] text-[#6B7F93]">{p.endereco}</div>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium" style={{ color: STOP_STATUS_COLOR[p.status] }}>
                          {p.resultado ? VISIT_RESULTADO_LABEL[p.resultado] : STOP_STATUS_LABEL[p.status]}
                        </span>
                      </div>
                      {p.observacao && <p className="mt-2 text-[11.5px] text-[#6B7F93]">{p.observacao}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card title="Resumo">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] py-3">
                  <Gauge size={15} className="mx-auto mb-1 text-[#16A34A]" />
                  <div className="text-[15px] font-semibold">{r.distanciaKm} km</div>
                  <div className="text-[10.5px] text-[#6B7F93]">distância total</div>
                </div>
                <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] py-3">
                  <Clock size={15} className="mx-auto mb-1 text-[#3B82F6]" />
                  <div className="text-[15px] font-semibold">{Math.round((r.duracaoMin / 60) * 10) / 10}h</div>
                  <div className="text-[10.5px] text-[#6B7F93]">tempo estimado</div>
                </div>
              </div>
              {r.kmRealPercorrido != null && (
                <div className="mt-3 flex items-center justify-between border-t border-[#E1EDFB] pt-3 text-[12.5px]">
                  <span className="text-[#6B7F93]">Km real percorrido</span>
                  <span className="mono font-medium text-[#0F2A44]">{r.kmRealPercorrido} km</span>
                </div>
              )}
            </Card>

            <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Fuel size={14} /> Combustível</span>}>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11.5px] text-[#6B7F93]">Consumo (km/L)</label>
                  <Input type="number" step="0.1" value={r.combustivel.consumoKmL} onChange={(e) => updateRouteFuel(r.id, { consumoKmL: e.target.value === '' ? 0 : Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] text-[#6B7F93]">Preço (R$/L)</label>
                  <Input type="number" step="0.01" value={r.combustivel.precoLitro} onChange={(e) => updateRouteFuel(r.id, { precoLitro: e.target.value === '' ? 0 : Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#E1EDFB] pt-3 text-[13px]">
                <span className="text-[#6B7F93]">Litros estimados</span>
                <span className="mono text-[#33495E]">{r.combustivel.litrosEstimados.toFixed(2)} L</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[14px]">
                <span className="font-medium text-[#33495E]">Custo estimado</span>
                <span className="mono font-semibold text-[#3B82F6]">{currency(r.combustivel.custoEstimado)}</span>
              </div>
            </Card>

            {r.iniciadaEm && (
              <Card>
                <div className="text-[11.5px] text-[#6B7F93]">Iniciada em {formatDateTime(r.iniciadaEm)}</div>
                {r.finalizadaEm && <div className="mt-1 text-[11.5px] text-[#6B7F93]">Finalizada em {formatDateTime(r.finalizadaEm)}</div>}
              </Card>
            )}

            {isPlanned && (
              <Button variant="danger" className="w-full" onClick={() => { if (confirm('Excluir esta rota?')) { deleteRoute(r.id); setParams({}) } }}>
                <Trash2 size={14} /> Excluir rota
              </Button>
            )}
          </div>
        </div>
        )}
      </>
    )
  }

  if (draftStops.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3FC] text-[#3B82F6]"><RouteEmptyIcon size={28} /></div>
        <h1 className="text-[18px] font-bold">Seu roteiro está vazio</h1>
        <p className="text-[13.5px] text-[#6B7F93]">
          Nenhuma parada foi selecionada ainda. Vá até <strong>Buscar</strong>, defina sua localização e segmentos, e clique em{' '}
          <strong>"+ Adicionar à Rota"</strong> nos estabelecimentos e clientes que deseja visitar.
        </p>
        <Button onClick={() => navigate('/buscar')}><Compass size={14} /> Ir para Buscar</Button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Rota</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">Revise as paradas, defina a origem e crie a rota otimizada</p>
      </div>

      <Card title="Nova rota" className="mx-auto max-w-xl">
        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">Ponto de partida</label>
          {draftOrigin ? (
            <div className="flex items-center justify-between gap-2 rounded-[8px] border border-[#16A34A]/30 bg-[#16A34A]/10 px-3 py-2 text-[12.5px] text-[#16A34A]">
              <span className="flex items-center gap-1.5"><LocateFixed size={14} /> Você está aqui</span>
              <div className="flex items-center gap-2">
                <button onClick={() => { const nome = prompt('Nome deste local (ex: Casa, Escritório)'); if (nome) addFavorite({ nome, lat: draftOrigin.lat, lng: draftOrigin.lng }) }} className="flex items-center gap-1 text-[11px] underline decoration-dotted"><Star size={11} /> salvar</button>
                <button onClick={handleLocate} className="text-[11px] underline decoration-dotted">atualizar</button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={handleLocate} disabled={locating}>
              <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização atual'}
            </Button>
          )}
          {favorites.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {favorites.map((f) => (
                <button key={f.id} onClick={() => setDraftOrigin({ lat: f.lat, lng: f.lng })} className="rounded-full border border-[#CFE0F5] bg-[#EAF3FC] px-2.5 py-1 text-[11px] text-[#33495E] hover:bg-[#DCEAFB]">{f.nome}</button>
              ))}
            </div>
          )}
          {locationError && <p className="mt-1.5 text-[11px] text-[#EF4444]">{locationError}</p>}
          {!draftOrigin && <p className="mt-1.5 text-[11px] text-[#6B7F93]">Sem localização definida, a rota usa um ponto de partida padrão.</p>}
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">Paradas selecionadas ({draftStops.length})</label>
          <div className="space-y-1.5">
            {draftStops.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-2.5 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] text-[#0F2A44]">{p.nome}</div>
                  <div className="truncate text-[10.5px] text-[#6B7F93]">{p.origem === 'cliente' ? 'cliente cadastrado' : 'prospecção'}</div>
                </div>
                <button onClick={() => removeDraftStop(p.id)} className="shrink-0 text-[#6B7F93] hover:text-[#EF4444]"><MinusCircle size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">Adicionar cliente cadastrado</label>
          <div className="relative">
            <div className="flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93]">
              <Search size={14} />
              <input value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} placeholder="Buscar por nome…" className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]" />
            </div>
            {matchingClients.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-[8px] border border-[#CFE0F5] bg-white shadow-xl">
                {matchingClients.map((c) => (
                  <button key={c.id} onClick={() => { toggleDraftStop(clientToStop(c)); setClientQuery('') }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-[#DCEAFB]">
                    <Plus size={13} className="text-[#3B82F6]" /> {c.nomeFantasia}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">Nome da rota</label>
          <Input value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Ex: Rota Goiânia" />
        </div>

        <Button className="w-full" disabled={draftStops.length === 0} onClick={handleCreateRoute}>
          <Wand2 size={14} /> Criar e otimizar rota
        </Button>
      </Card>
    </>
  )
}
