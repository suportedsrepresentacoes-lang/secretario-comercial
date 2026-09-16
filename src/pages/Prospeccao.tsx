import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  LocateFixed, Search, Plus, Check, UserPlus, Phone, Clock, MapPin, Route, AlertCircle, Play, X,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import { Button } from '../components/ui/Field'
import { getCurrentLocation } from '../lib/geolocation'
import { geocodeAddress, reverseGeocode, type GeocodeResult } from '../lib/geocode'
import { searchEstablishmentsWithExpansion } from '../lib/overpass'
import { searchSegments, customSegment } from '../lib/segments'
import type { Establishment, Segment } from '../types'

const RADIUS_OPTIONS = [3, 5, 10, 20, 50]

const EXAMPLE_LOCATIONS: { label: string; lat: number; lng: number }[] = [
  { label: 'Goiânia (Setor Bueno)', lat: -16.7069, lng: -49.2733 },
  { label: 'Anápolis (Centro)', lat: -16.3281, lng: -48.9531 },
  { label: 'Rio Verde (Centro)', lat: -17.7975, lng: -50.9264 },
  { label: 'Aparecida de Goiânia', lat: -16.8233, lng: -49.2437 },
  { label: 'Trindade (Centro)', lat: -16.6499, lng: -49.4889 },
]

const meIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#5B8DEF;border:3px solid #FFFFFF;box-shadow:0 0 0 4px #5B8DEF33"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})
function resultIcon(active: boolean) {
  const color = active ? '#3FA9A0' : '#3B82F6'
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #FFFFFF"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export default function Prospeccao() {
  const navigate = useNavigate()
  const { draftOrigin, draftStops, setDraftOrigin, toggleDraftStop, addClient, clients, routes } = useAppStore()

  const [originLabel, setOriginLabel] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<GeocodeResult[]>([])
  const [addressSearching, setAddressSearching] = useState(false)

  const [segmentQuery, setSegmentQuery] = useState('')
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([])
  const [customSegmentText, setCustomSegmentText] = useState('')

  const [radiusKm, setRadiusKm] = useState(10)
  const [autoExpand, setAutoExpand] = useState(true)
  const [usedRadiusKm, setUsedRadiusKm] = useState<number | null>(null)

  const [searching, setSearching] = useState(false)
  const [slowSearch, setSlowSearch] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [results, setResults] = useState<Establishment[]>([])
  const [savedAsClient, setSavedAsClient] = useState<Set<string>>(new Set())

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
      const addr = await reverseGeocode(lat, lng)
      if (addr) setOriginLabel(addr)
    }
  }

  async function handleLocate() {
    setLocating(true)
    setLocationError(null)
    try {
      const pos = await getCurrentLocation()
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
      const found = await geocodeAddress(addressQuery)
      setAddressResults(found)
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

  async function handleSearch() {
    if (!draftOrigin || selectedSegments.length === 0) return
    setSearching(true)
    setSlowSearch(false)
    setSearchError(null)
    setUsedRadiusKm(null)
    const slowTimer = setTimeout(() => setSlowSearch(true), 7000)
    try {
      const { results: found, usedRadiusKm: usedR } = await searchEstablishmentsWithExpansion(selectedSegments, draftOrigin, radiusKm, { autoExpand })
      setResults(found)
      setUsedRadiusKm(usedR)
      if (found.length === 0) {
        setSearchError('Nenhum estabelecimento encontrado nessa região. Tente aumentar o raio ou escolher outros segmentos.')
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Falha ao buscar estabelecimentos. Tente novamente.')
    } finally {
      clearTimeout(slowTimer)
      setSlowSearch(false)
      setSearching(false)
    }
  }

  function handleAddToRoute(e: Establishment) {
    toggleDraftStop({
      id: e.id,
      origem: 'prospect',
      nome: e.nome,
      endereco: e.endereco,
      lat: e.lat,
      lng: e.lng,
      telefone: e.telefone,
      segmento: e.categoria,
    })
  }

  function handleSaveAsClient(e: Establishment) {
    addClient({
      razaoSocial: e.nome,
      nomeFantasia: e.nome,
      cnpj: '',
      segmento: e.categoria,
      status: 'lead',
      prioridade: 'media',
      contatos: e.telefone ? [{ id: crypto.randomUUID(), nome: 'Contato principal', telefone: e.telefone, whatsapp: e.telefone, principal: true }] : [],
      endereco: { logradouro: e.endereco, cidade: '', uf: '', lat: e.lat, lng: e.lng },
      industriaIds: [],
      observacoes: 'Encontrado via prospecção por segmento.',
    })
    setSavedAsClient((s) => new Set(s).add(e.id))
  }

  function isAlreadyClient(nome: string) {
    return clients.some((c) => (c.nomeFantasia ?? c.razaoSocial).toLowerCase() === nome.toLowerCase())
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Prospecção Comercial</h1>
        <p className="mt-1 text-[13px] text-[#8F8676]">Geolocalização e roteirização inteligente</p>
      </div>

      {emAndamento && (
        <button
          onClick={() => navigate(`/rotas?id=${emAndamento.id}`)}
          className="mb-5 flex w-full items-center justify-between rounded-md border border-[#3FA9A0]/40 bg-[#3FA9A0]/10 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-[13px] font-medium text-[#2B2620]">
            <Play size={14} className="text-[#3FA9A0]" /> Rota "{emAndamento.nome}" em andamento
          </span>
          <span className="text-[12px] font-medium text-[#3FA9A0]">continuar →</span>
        </button>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-4">
          <Card title="1. Ponto de Partida da Prospecção">
            {draftOrigin ? (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-[6px] border border-[#3FA9A0]/30 bg-[#3FA9A0]/10 px-3 py-2 text-[12.5px] text-[#3FA9A0]">
                <span className="flex min-w-0 items-center gap-1.5"><LocateFixed size={14} className="shrink-0" /> <span className="truncate">{originLabel ?? 'Localização definida'}</span></span>
                <button onClick={handleLocate} className="shrink-0 text-[11px] underline decoration-dotted">atualizar</button>
              </div>
            ) : (
              <Button variant="secondary" className="mb-3 w-full" onClick={handleLocate} disabled={locating}>
                <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização atual'}
              </Button>
            )}
            {locationError && (
              <p className="mb-3 flex items-start gap-1.5 text-[11.5px] text-[#D9695F]"><AlertCircle size={13} className="mt-0.5 shrink-0" /> {locationError}</p>
            )}

            <div className="mb-2 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {EXAMPLE_LOCATIONS.map((loc) => (
                <button
                  key={loc.label}
                  onClick={() => setOrigin(loc.lat, loc.lng, loc.label)}
                  className="shrink-0 whitespace-nowrap rounded-full border border-[#E4DCC8] bg-[#F3EEE3] px-2.5 py-1 text-[11px] text-[#5A5346] hover:bg-[#ECE3D2]"
                >
                  {loc.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] px-3 py-2 text-[13px] text-[#8F8676]">
                <Search size={14} />
                <input
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                  placeholder="Ou digite: endereço, bairro, cidade…"
                  className="w-full bg-transparent text-[#2B2620] outline-none placeholder:text-[#8F8676]"
                />
                <button onClick={handleAddressSearch} className="shrink-0 text-[11px] font-medium text-[#3B82F6]">
                  {addressSearching ? '...' : 'buscar'}
                </button>
              </div>
              {addressResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[6px] border border-[#E4DCC8] bg-[#FFFFFF] shadow-xl">
                  {addressResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { setOrigin(r.lat, r.lng, r.label); setAddressResults([]); setAddressQuery('') }}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#F3EEE3]"
                    >
                      <MapPin size={13} className="mt-0.5 shrink-0 text-[#8F8676]" />
                      <span className="text-[#2B2620]">{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card title="2. Segmento(s) de Prospecção">
            <div className="mb-2 flex items-center gap-2 rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] px-3 py-2 text-[13px] text-[#8F8676]">
              <Search size={14} />
              <input
                value={segmentQuery}
                onChange={(e) => setSegmentQuery(e.target.value)}
                placeholder="Pesquisar segmento…"
                className="w-full bg-transparent text-[#2B2620] outline-none placeholder:text-[#8F8676]"
              />
            </div>
            <div className="mb-2 flex gap-1.5">
              <input
                value={customSegmentText}
                onChange={(e) => setCustomSegmentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomSegment()}
                placeholder="Outro segmento…"
                className="min-w-0 flex-1 rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] px-3 py-2 text-[13px] text-[#2B2620] outline-none placeholder:text-[#8F8676]"
              />
              <Button variant="secondary" onClick={addCustomSegment}><Plus size={13} /> Adicionar</Button>
            </div>
            <div className="flex max-h-[220px] flex-wrap gap-1.5 overflow-y-auto">
              {filteredSegments.map((s) => {
                const checked = selectedIds.has(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSegment(s)}
                    className={`rounded-full border px-2.5 py-1 text-[11.5px] ${checked ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#E4DCC8] text-[#5A5346] hover:bg-[#F3EEE3]'}`}
                  >
                    {s.label}
                  </button>
                )
              })}
              {filteredSegments.length === 0 && <p className="text-[12px] text-[#8F8676]">Nenhum segmento encontrado.</p>}
            </div>
            {selectedSegments.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#ECE5D6] pt-3">
                <span className="text-[11px] text-[#8F8676]">Selecionados ({selectedSegments.length}):</span>
                {selectedSegments.map((s) => (
                  <span key={s.id} className="flex items-center gap-1 rounded-full bg-[#ECE3D2] px-2 py-0.5 text-[11px] text-[#2B2620]">
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
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`rounded-full border px-3 py-1 text-[12px] ${radiusKm === r ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#E4DCC8] text-[#8F8676]'}`}
                >
                  {r} km
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-start gap-2 rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] px-3 py-2.5 text-[12px]">
              <input type="checkbox" checked={autoExpand} onChange={(e) => setAutoExpand(e.target.checked)} className="mt-0.5 accent-[#3B82F6]" />
              <span>
                <span className="font-medium text-[#2B2620]">Expandir busca automaticamente caso haja poucos resultados</span>
                <span className="mt-0.5 block text-[11px] text-[#8F8676]">Amplia o raio (até 80 km) se houver menos de 3 estabelecimentos.</span>
              </span>
            </label>
          </Card>

          <Button className="w-full" disabled={!draftOrigin || selectedSegments.length === 0 || searching} onClick={handleSearch}>
            <Search size={15} /> {searching ? 'Buscando…' : 'Buscar Clientes na Região'}
          </Button>
          {slowSearch && (
            <p className="text-center text-[11.5px] text-[#8F8676]">
              Os servidores públicos do OpenStreetMap estão respondendo devagar agora — pode levar até 1 minuto. Continue aguardando…
            </p>
          )}

          {draftStops.length > 0 && (
            <Button variant="secondary" className="w-full" onClick={() => navigate('/rotas')}>
              <Route size={14} /> Ir para Rota ({draftStops.length} selecionados)
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-[320px] overflow-hidden rounded-md border border-[#E4DCC8]">
            <MapContainer
              center={draftOrigin ? [draftOrigin.lat, draftOrigin.lng] : [-16.6799, -49.255]}
              zoom={draftOrigin ? 13 : 11}
              style={{ height: '100%', width: '100%' }}
              key={draftOrigin ? `${draftOrigin.lat}-${draftOrigin.lng}` : 'default'}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              {draftOrigin && (
                <>
                  <Marker position={[draftOrigin.lat, draftOrigin.lng]} icon={meIcon}>
                    <Popup>Você está aqui</Popup>
                  </Marker>
                  <Circle center={[draftOrigin.lat, draftOrigin.lng]} radius={(usedRadiusKm ?? radiusKm) * 1000} pathOptions={{ color: '#5B8DEF', fillOpacity: 0.04, weight: 1 }} />
                </>
              )}
              {results.map((r) => (
                <Marker key={r.id} position={[r.lat, r.lng]} icon={resultIcon(draftIds.has(r.id))}>
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <strong>{r.nome}</strong>
                      <div style={{ fontSize: 12, color: '#666' }}>{r.categoria} · {r.distanciaKm} km</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#ECE5D6] px-4 py-3">
              <span className="flex items-center gap-2 text-[13px] font-medium text-[#2B2620]">
                <MapPin size={14} className="text-[#8F8676]" /> Estabelecimentos Encontrados
                <span className="rounded-full bg-[#F3EEE3] px-1.5 py-0.5 text-[11px] text-[#5A5346]">{results.length}</span>
              </span>
              {usedRadiusKm != null && <span className="text-[11px] text-[#8F8676]">raio usado: {usedRadiusKm} km</span>}
            </div>
            {searchError && (
              <div className="flex items-start gap-2 border-b border-[#ECE5D6] px-4 py-3 text-[12.5px] text-[#B9762C]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span className="flex-1">
                  {searchError}
                  <button onClick={handleSearch} className="ml-2 font-medium text-[#3B82F6] underline decoration-dotted">
                    tentar novamente
                  </button>
                </span>
              </div>
            )}
            <div className="max-h-[420px] divide-y divide-[#ECE5D6] overflow-y-auto">
              {results.map((r) => {
                const inDraft = draftIds.has(r.id)
                const already = isAlreadyClient(r.nome)
                return (
                  <div key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-medium text-[#2B2620]">{r.nome}</span>
                          {already && <span className="shrink-0 rounded-full border border-[#3FA9A0]/40 px-1.5 py-0.5 text-[10px] text-[#3FA9A0]">já é cliente</span>}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11.5px] text-[#8F8676]">
                          <MapPin size={11} /> {r.endereco} · {r.distanciaKm} km
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#8F8676]">
                          <span className="rounded-full border border-[#E4DCC8] px-2 py-0.5">{r.categoria}</span>
                          {r.telefone && <span className="flex items-center gap-1"><Phone size={11} /> {r.telefone}</span>}
                          {r.horario && <span className="flex items-center gap-1"><Clock size={11} /> {r.horario}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant={inDraft ? 'secondary' : 'primary'} onClick={() => handleAddToRoute(r)} className="flex-1">
                        {inDraft ? <Check size={13} /> : <Plus size={13} />} {inDraft ? 'Adicionado à rota' : 'Adicionar à Rota'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleSaveAsClient(r)}
                        disabled={savedAsClient.has(r.id) || already}
                      >
                        <UserPlus size={13} /> {savedAsClient.has(r.id) ? 'Salvo' : 'Salvar como cliente'}
                      </Button>
                    </div>
                  </div>
                )
              })}
              {results.length === 0 && !searchError && (
                <div className="px-4 py-10 text-center text-[13px] text-[#8F8676]">
                  Defina sua localização, escolha os segmentos e busque estabelecimentos próximos.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
