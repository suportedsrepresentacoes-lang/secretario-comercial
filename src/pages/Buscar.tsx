import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, Search, Plus, Check, UserPlus, Phone, Clock, MapPin, Route, AlertCircle, Play, X, ChevronsUp } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LocationButtons } from '../components/ui/LocationButtons'
import { getCurrentPosition } from '../services/geolocation'
import { searchAddress, addressAt, type AddressMatch } from '../services/geocoding'
import { searchPlaces, overpassTurboUrl } from '../services/places'
import { openNavigation } from '../services/navigation'
import { openStreetView } from '../services/streetView'
import { searchSegments, customSegment } from '../data/segments'
import type { Establishment, Segment } from '../types'

const EXPAND_MIN_RESULTS = 3
const EXPAND_MAX_KM = 80

const RADIUS_OPTIONS = [3, 5, 10, 20, 50]

const QUICK_LOCATIONS: { label: string; lat: number; lng: number }[] = [
  { label: 'Goiânia (Setor Bueno)', lat: -16.7069, lng: -49.2733 },
  { label: 'Anápolis (Centro)', lat: -16.3281, lng: -48.9531 },
  { label: 'Rio Verde (Centro)', lat: -17.7975, lng: -50.9264 },
  { label: 'Aparecida de Goiânia', lat: -16.8233, lng: -49.2437 },
  { label: 'Trindade (Centro)', lat: -16.6499, lng: -49.4889 },
]

const meIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#5B8DEF;border:3px solid #fff;box-shadow:0 0 0 4px #5B8DEF33"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})
function resultIcon(active: boolean) {
  const color = active ? '#16A34A' : '#3B82F6'
  return L.divIcon({ className: '', html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #fff"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })
}

export default function Buscar() {
  const navigate = useNavigate()
  const { draftOrigin, draftStops, favorites, setDraftOrigin, toggleDraftStop, addClient, clients, routes } = useAppStore()

  const [originLabel, setOriginLabel] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<AddressMatch[]>([])
  const [addressSearching, setAddressSearching] = useState(false)

  const [segmentQuery, setSegmentQuery] = useState('')
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([])
  const [customSegmentText, setCustomSegmentText] = useState('')

  const [radiusKm, setRadiusKm] = useState(10)
  const [searchedRadiusKm, setSearchedRadiusKm] = useState<number | null>(null)

  const [searching, setSearching] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [slowSearch, setSlowSearch] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [results, setResults] = useState<Establishment[]>([])
  const [lastQuery, setLastQuery] = useState<string | null>(null)
  const [savedAsClient, setSavedAsClient] = useState<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  const filteredSegments = useMemo(() => searchSegments(segmentQuery), [segmentQuery])
  const selectedIds = new Set(selectedSegments.map((s) => s.id))
  const draftIds = new Set(draftStops.map((p) => p.id))
  const emAndamento = routes.find((r) => r.status === 'em_andamento')

  async function setOrigin(lat: number, lng: number, label?: string) {
    setDraftOrigin({ lat, lng })
    if (label) {
      setOriginLabel(label)
    } else {
      setOriginLabel(null)
      const addr = await addressAt(lat, lng)
      if (addr) setOriginLabel(addr)
    }
  }

  async function handleLocate() {
    setLocating(true)
    setLocationError(null)
    try {
      const pos = await getCurrentPosition()
      await setOrigin(pos.lat, pos.lng)
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Não foi possível obter sua localização.')
    } finally {
      setLocating(false)
    }
  }

  async function handleAddressSearch() {
    if (addressQuery.trim().length < 3) return
    setAddressSearching(true)
    try {
      setAddressResults(await searchAddress(addressQuery))
    } catch {
      setAddressResults([])
    } finally {
      setAddressSearching(false)
    }
  }

  function toggleSegment(s: Segment) {
    setSelectedSegments((list) => (list.some((x) => x.id === s.id) ? list.filter((x) => x.id !== s.id) : [...list, s]))
  }

  function addCustomSegment() {
    const label = customSegmentText.trim()
    if (!label) return
    const seg = customSegment(label)
    if (!selectedSegments.some((s) => s.id === seg.id)) setSelectedSegments((list) => [...list, seg])
    setCustomSegmentText('')
  }

  async function runSearch(atRadiusKm: number, opts: { expand?: boolean } = {}) {
    if (!draftOrigin || selectedSegments.length === 0) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (opts.expand) setExpanding(true)
    else {
      setSearching(true)
      setResults([])
    }
    setSlowSearch(false)
    setSearchError(null)
    const slowTimer = setTimeout(() => setSlowSearch(true), 4000)
    try {
      const { results: found, query } = await searchPlaces(selectedSegments, draftOrigin, atRadiusKm, controller.signal)
      if (controller.signal.aborted) return
      setResults(found)
      setSearchedRadiusKm(atRadiusKm)
      setLastQuery(query)
      if (found.length === 0) setSearchError('Nenhum estabelecimento encontrado nessa região. Tente aumentar o raio ou escolher outros segmentos.')
    } catch (err) {
      if (controller.signal.aborted) return
      setSearchError(err instanceof Error ? err.message : 'Falha ao buscar estabelecimentos. Tente novamente.')
    } finally {
      if (!controller.signal.aborted) {
        clearTimeout(slowTimer)
        setSlowSearch(false)
        setSearching(false)
        setExpanding(false)
      }
    }
  }

  function handleSearch() {
    runSearch(radiusKm)
  }

  function handleExpand() {
    const next = Math.min(searchedRadiusKm ? searchedRadiusKm * 2 : radiusKm * 2, EXPAND_MAX_KM)
    runSearch(next, { expand: true })
  }

  function handleAddToRoute(e: Establishment) {
    toggleDraftStop({ id: e.id, origem: 'prospect', nome: e.nome, endereco: e.endereco, lat: e.lat, lng: e.lng, telefone: e.telefone, segmento: e.categoria })
  }

  function handleSaveAsClient(e: Establishment) {
    addClient({
      nomeFantasia: e.nome,
      segmento: e.categoria,
      status: 'prospect',
      telefone: e.telefone,
      whatsapp: e.telefone,
      endereco: { logradouro: e.endereco, cidade: '', uf: '', lat: e.lat, lng: e.lng },
      observacoes: 'Encontrado via prospecção por segmento.',
    })
    setSavedAsClient((s) => new Set(s).add(e.id))
  }

  function isAlreadyClient(nome: string) {
    return clients.some((c) => c.nomeFantasia.toLowerCase() === nome.toLowerCase())
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Prospecção Comercial</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">Geolocalização e busca de estabelecimentos por segmento</p>
      </div>

      {emAndamento && (
        <button onClick={() => navigate(`/rotas?id=${emAndamento.id}`)} className="mb-5 flex w-full items-center justify-between rounded-xl border border-[#16A34A]/40 bg-[#16A34A]/10 px-4 py-3 text-left">
          <span className="flex items-center gap-2 text-[13px] font-medium text-[#0F2A44]">
            <Play size={14} className="text-[#16A34A]" /> Rota "{emAndamento.nome}" em andamento
          </span>
          <span className="text-[12px] font-medium text-[#16A34A]">continuar →</span>
        </button>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-4">
          <Card title="1. Ponto de Partida da Prospecção">
            {draftOrigin ? (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-[8px] border border-[#16A34A]/30 bg-[#16A34A]/10 px-3 py-2 text-[12.5px] text-[#16A34A]">
                <span className="flex min-w-0 items-center gap-1.5"><LocateFixed size={14} className="shrink-0" /> <span className="truncate">{originLabel ?? 'Localização definida'}</span></span>
                <button onClick={handleLocate} className="shrink-0 text-[11px] underline decoration-dotted">atualizar</button>
              </div>
            ) : (
              <Button variant="secondary" className="mb-3 w-full" onClick={handleLocate} disabled={locating}>
                <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização atual'}
              </Button>
            )}
            {locationError && <p className="mb-3 flex items-start gap-1.5 text-[11.5px] text-[#EF4444]"><AlertCircle size={13} className="mt-0.5 shrink-0" /> {locationError}</p>}

            <div className="mb-2 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {favorites.map((f) => (
                <button key={f.id} onClick={() => setOrigin(f.lat, f.lng, f.nome)} className="shrink-0 whitespace-nowrap rounded-full border border-[#3B82F6]/40 bg-[#DCEAFB] px-2.5 py-1 text-[11px] text-[#1D4ED8]">
                  {f.nome}
                </button>
              ))}
              {QUICK_LOCATIONS.map((loc) => (
                <button key={loc.label} onClick={() => setOrigin(loc.lat, loc.lng, loc.label)} className="shrink-0 whitespace-nowrap rounded-full border border-[#CFE0F5] bg-[#EAF3FC] px-2.5 py-1 text-[11px] text-[#33495E] hover:bg-[#DCEAFB]">
                  {loc.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93]">
                <Search size={14} />
                <input
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                  placeholder="Ou digite: endereço, bairro, cidade…"
                  className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]"
                />
                <button onClick={handleAddressSearch} className="shrink-0 text-[11px] font-medium text-[#3B82F6]">{addressSearching ? '...' : 'buscar'}</button>
              </div>
              {addressResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[8px] border border-[#CFE0F5] bg-white shadow-xl">
                  {addressResults.map((r, i) => (
                    <button key={i} onClick={() => { setOrigin(r.lat, r.lng, r.label); setAddressResults([]); setAddressQuery('') }} className="flex w-full items-start gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#EAF3FC]">
                      <MapPin size={13} className="mt-0.5 shrink-0 text-[#6B7F93]" />
                      <span className="text-[#0F2A44]">{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card title="2. Segmento(s) de Prospecção">
            <div className="mb-2 flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93]">
              <Search size={14} />
              <input value={segmentQuery} onChange={(e) => setSegmentQuery(e.target.value)} placeholder="Pesquisar segmento…" className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]" />
            </div>
            <div className="mb-2 flex gap-1.5">
              <input
                value={customSegmentText}
                onChange={(e) => setCustomSegmentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomSegment()}
                placeholder="Outro segmento…"
                className="min-w-0 flex-1 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#0F2A44] outline-none placeholder:text-[#6B7F93]"
              />
              <Button variant="secondary" onClick={addCustomSegment}><Plus size={13} /> Adicionar</Button>
            </div>
            <div className="flex max-h-[220px] flex-wrap gap-1.5 overflow-y-auto">
              {filteredSegments.map((s) => {
                const checked = selectedIds.has(s.id)
                return (
                  <button key={s.id} onClick={() => toggleSegment(s)} className={`rounded-full border px-2.5 py-1 text-[11.5px] ${checked ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] text-[#33495E] hover:bg-[#EAF3FC]'}`}>
                    {s.label}
                  </button>
                )
              })}
              {filteredSegments.length === 0 && <p className="text-[12px] text-[#6B7F93]">Nenhum segmento encontrado.</p>}
            </div>
            {selectedSegments.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#E1EDFB] pt-3">
                <span className="text-[11px] text-[#6B7F93]">Selecionados ({selectedSegments.length}):</span>
                {selectedSegments.map((s) => (
                  <span key={s.id} className="flex items-center gap-1 rounded-full bg-[#DCEAFB] px-2 py-0.5 text-[11px] text-[#0F2A44]">
                    {s.label}
                    <button onClick={() => toggleSegment(s)}><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card title="3. Raio de Busca">
            <div className="flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button key={r} onClick={() => setRadiusKm(r)} className={`rounded-full border px-3 py-1 text-[12px] ${radiusKm === r ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] text-[#6B7F93]'}`}>
                  {r} km
                </button>
              ))}
            </div>
          </Card>

          {draftOrigin && (
            <p className="flex items-center gap-1.5 text-[12px] text-[#6B7F93]">
              <MapPin size={12} className="shrink-0" /> Buscando a partir de: <strong className="text-[#0F2A44]">{originLabel ?? 'local de partida definido'}</strong> · raio {radiusKm} km
            </p>
          )}

          <Button className="w-full" disabled={!draftOrigin || selectedSegments.length === 0 || searching} onClick={handleSearch}>
            <Search size={15} /> {searching ? 'Buscando…' : 'Buscar Clientes na Região'}
          </Button>
          {slowSearch && <p className="text-center text-[11.5px] text-[#6B7F93]">O OpenStreetMap está respondendo devagar agora — pode levar mais alguns segundos…</p>}

          {draftStops.length > 0 && (
            <Button variant="secondary" className="w-full" onClick={() => navigate('/rotas')}>
              <Route size={14} /> Ir para Rota ({draftStops.length} selecionados)
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-[320px] overflow-hidden rounded-xl border border-[#CFE0F5]">
            <MapContainer center={draftOrigin ? [draftOrigin.lat, draftOrigin.lng] : [-16.6799, -49.255]} zoom={draftOrigin ? 13 : 11} style={{ height: '100%', width: '100%' }} key={draftOrigin ? `${draftOrigin.lat}-${draftOrigin.lng}` : 'default'}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              {draftOrigin && (
                <>
                  <Marker position={[draftOrigin.lat, draftOrigin.lng]} icon={meIcon}><Popup>Você está aqui</Popup></Marker>
                  <Circle center={[draftOrigin.lat, draftOrigin.lng]} radius={(searchedRadiusKm ?? radiusKm) * 1000} pathOptions={{ color: '#5B8DEF', fillOpacity: 0.04, weight: 1 }} />
                </>
              )}
              {results.map((r) => (
                <Marker key={r.id} position={[r.lat, r.lng]} icon={resultIcon(draftIds.has(r.id))}>
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <strong>{r.nome}</strong>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{r.categoria} · {r.distanciaKm} km</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => openNavigation(r.lat, r.lng)} style={{ fontSize: 11, color: '#3B82F6', border: '1px solid #CFE0F5', borderRadius: 999, padding: '3px 8px', background: '#fff' }}>Navegar</button>
                        <button onClick={() => openStreetView(r.lat, r.lng)} style={{ fontSize: 11, color: '#3B82F6', border: '1px solid #CFE0F5', borderRadius: 999, padding: '3px 8px', background: '#fff' }}>Street View</button>
                        <button onClick={() => handleAddToRoute(r)} style={{ fontSize: 11, color: '#fff', border: 'none', borderRadius: 999, padding: '3px 8px', background: '#3B82F6' }}>
                          {draftIds.has(r.id) ? 'Na rota' : 'Adicionar à rota'}
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E1EDFB] px-4 py-3">
              <span className="flex items-center gap-2 text-[13px] font-medium text-[#0F2A44]">
                <MapPin size={14} className="text-[#6B7F93]" /> Estabelecimentos Encontrados
                <span className="rounded-full bg-[#EAF3FC] px-1.5 py-0.5 text-[11px] text-[#33495E]">{results.length}</span>
              </span>
              {searchedRadiusKm != null && <span className="text-[11px] text-[#6B7F93]">raio usado: {searchedRadiusKm} km</span>}
            </div>
            {!searching && searchedRadiusKm != null && results.length < EXPAND_MIN_RESULTS && (
              <div className="flex items-center justify-between gap-2 border-b border-[#E1EDFB] bg-[#EAF3FC] px-4 py-2.5 text-[12.5px] text-[#33495E]">
                <span>
                  {results.length === 0
                    ? `Nenhuma empresa encontrada em ${searchedRadiusKm} km.`
                    : `Encontramos apenas ${results.length} empresa${results.length > 1 ? 's' : ''} em ${searchedRadiusKm} km.`}
                </span>
                {searchedRadiusKm < EXPAND_MAX_KM ? (
                  <button onClick={handleExpand} disabled={expanding} className="flex shrink-0 items-center gap-1 font-medium text-[#3B82F6] disabled:opacity-60">
                    <ChevronsUp size={13} /> {expanding ? 'Ampliando…' : `Ampliar para ${Math.min(searchedRadiusKm * 2, EXPAND_MAX_KM)} km`}
                  </button>
                ) : (
                  <button onClick={() => runSearch(searchedRadiusKm)} className="shrink-0 font-medium text-[#3B82F6] underline decoration-dotted">tentar novamente</button>
                )}
              </div>
            )}
            {searchError && (
              <div className="flex items-start gap-2 border-b border-[#E1EDFB] px-4 py-3 text-[12.5px] text-[#B45309]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span className="flex-1">{searchError}</span>
              </div>
            )}
            {!searching && results.length === 0 && lastQuery && (
              <div className="border-b border-[#E1EDFB] px-4 py-3 text-[12px] text-[#6B7F93]">
                Se você sabe que existem empresas dessa categoria aqui perto, confira os dados brutos do OpenStreetMap para esta busca:{' '}
                <a href={overpassTurboUrl(lastQuery)} target="_blank" rel="noopener noreferrer" className="font-medium text-[#3B82F6] underline decoration-dotted">
                  abrir no Overpass Turbo
                </a>
                . Se aparecer vazio lá também, as empresas ainda não estão cadastradas no mapa livre (não é um problema do CampoVista); tente também "Outro segmento…" com o nome de uma loja específica.
              </div>
            )}
            <div className="max-h-[420px] divide-y divide-[#E1EDFB] overflow-y-auto">
              {results.map((r) => {
                const inDraft = draftIds.has(r.id)
                const already = isAlreadyClient(r.nome)
                return (
                  <div key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-medium text-[#0F2A44]">{r.nome}</span>
                          {already && <span className="shrink-0 rounded-full border border-[#16A34A]/40 px-1.5 py-0.5 text-[10px] text-[#16A34A]">já é cliente</span>}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11.5px] text-[#6B7F93]"><MapPin size={11} /> {r.endereco} · {r.distanciaKm} km</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#6B7F93]">
                          <span className="rounded-full border border-[#CFE0F5] px-2 py-0.5">{r.categoria}</span>
                          {r.telefone && <span className="flex items-center gap-1"><Phone size={11} /> {r.telefone}</span>}
                          {r.horario && <span className="flex items-center gap-1"><Clock size={11} /> {r.horario}</span>}
                        </div>
                      </div>
                    </div>
                    <LocationButtons lat={r.lat} lng={r.lng} size="sm" className="mt-3" />
                    <div className="mt-2 flex gap-2">
                      <Button variant={inDraft ? 'secondary' : 'primary'} onClick={() => handleAddToRoute(r)} className="flex-1">
                        {inDraft ? <Check size={13} /> : <Plus size={13} />} {inDraft ? 'Adicionado à rota' : 'Adicionar à Rota'}
                      </Button>
                      <Button variant="secondary" onClick={() => handleSaveAsClient(r)} disabled={savedAsClient.has(r.id) || already}>
                        <UserPlus size={13} /> {savedAsClient.has(r.id) ? 'Salvo' : 'Salvar como cliente'}
                      </Button>
                    </div>
                  </div>
                )
              })}
              {results.length === 0 && !searchError && (
                <div className="px-4 py-10 text-center text-[13px] text-[#6B7F93]">Defina sua localização, escolha os segmentos e busque estabelecimentos próximos.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
