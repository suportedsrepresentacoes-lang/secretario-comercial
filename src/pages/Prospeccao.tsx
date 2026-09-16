import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, Search, Plus, Check, UserPlus, Phone, Clock, MapPin, Route, AlertCircle } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import { Button } from '../components/ui/Field'
import { getCurrentLocation } from '../lib/geolocation'
import { searchEstablishments } from '../lib/overpass'
import { SEGMENTS, searchSegments } from '../lib/segments'
import type { Establishment } from '../types'

const RADIUS_OPTIONS = [3, 5, 10, 20, 50]

const meIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#5B8DEF;border:3px solid #12151B;box-shadow:0 0 0 4px #5B8DEF33"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})
function resultIcon(active: boolean) {
  const color = active ? '#3FA9A0' : '#E2963C'
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #12151B"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export default function Prospeccao() {
  const navigate = useNavigate()
  const { draftOrigin, draftStops, setDraftOrigin, toggleDraftStop, addClient, clients } = useAppStore()

  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [segmentQuery, setSegmentQuery] = useState('')
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([])
  const [radiusKm, setRadiusKm] = useState(5)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [results, setResults] = useState<Establishment[]>([])
  const [savedAsClient, setSavedAsClient] = useState<Set<string>>(new Set())

  const filteredSegments = useMemo(() => searchSegments(segmentQuery), [segmentQuery])
  const selectedSegments = SEGMENTS.filter((s) => selectedSegmentIds.includes(s.id))
  const draftIds = new Set(draftStops.map((p) => p.id))

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

  function toggleSegment(id: string) {
    setSelectedSegmentIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function handleSearch() {
    if (!draftOrigin || selectedSegments.length === 0) return
    setSearching(true)
    setSearchError(null)
    try {
      const found = await searchEstablishments(selectedSegments, draftOrigin, radiusKm)
      setResults(found)
      if (found.length === 0) {
        setSearchError('Nenhum estabelecimento encontrado nesse raio. Tente aumentar a distância de busca.')
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Falha ao buscar estabelecimentos. Tente novamente.')
    } finally {
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
        <h1 className="text-[20px] font-bold">Mapa / Prospecção</h1>
        <p className="mt-1 text-[13px] text-[#8D95A3]">Encontre estabelecimentos reais por segmento e adicione à rota do dia</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-4">
          <Card title="1. Minha localização">
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
            {locationError && (
              <p className="mt-2 flex items-start gap-1.5 text-[11.5px] text-[#D9695F]"><AlertCircle size={13} className="mt-0.5 shrink-0" /> {locationError}</p>
            )}
          </Card>

          <Card title="2. Segmento(s) a prospectar">
            <div className="mb-2 flex items-center gap-2 rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[13px] text-[#8D95A3]">
              <Search size={14} />
              <input
                value={segmentQuery}
                onChange={(e) => setSegmentQuery(e.target.value)}
                placeholder="Buscar segmento…"
                className="w-full bg-transparent text-[#F2F0EA] outline-none placeholder:text-[#8D95A3]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredSegments.map((s) => {
                const checked = selectedSegmentIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSegment(s.id)}
                    className={`rounded-full border px-2.5 py-1 text-[11.5px] ${checked ? 'border-[#E2963C]/50 bg-[#E2963C]/15 text-[#E2963C]' : 'border-[#2A313D] text-[#8D95A3] hover:text-[#C7CCD6]'}`}
                  >
                    {s.label}
                  </button>
                )
              })}
              {filteredSegments.length === 0 && <p className="text-[12px] text-[#8D95A3]">Nenhum segmento encontrado.</p>}
            </div>
          </Card>

          <Card title="3. Raio de busca">
            <div className="flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`rounded-full border px-3 py-1 text-[12px] ${radiusKm === r ? 'border-[#E2963C]/50 bg-[#E2963C]/15 text-[#E2963C]' : 'border-[#2A313D] text-[#8D95A3]'}`}
                >
                  {r} km
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-[#8D95A3]">A distância não é uma barreira rígida — aumente o raio se precisar prospectar mais longe.</p>
          </Card>

          <Button className="w-full" disabled={!draftOrigin || selectedSegments.length === 0 || searching} onClick={handleSearch}>
            <Search size={15} /> {searching ? 'Buscando…' : 'Buscar estabelecimentos'}
          </Button>

          {draftStops.length > 0 && (
            <Button variant="secondary" className="w-full" onClick={() => navigate('/rotas')}>
              <Route size={14} /> Ir para Rotas ({draftStops.length} selecionados)
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-[320px] overflow-hidden rounded-md border border-[#2A313D]">
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
                  <Circle center={[draftOrigin.lat, draftOrigin.lng]} radius={radiusKm * 1000} pathOptions={{ color: '#5B8DEF', fillOpacity: 0.04, weight: 1 }} />
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
            {searchError && (
              <div className="flex items-start gap-2 border-b border-[#2A313D] px-4 py-3 text-[12.5px] text-[#E2963C]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> {searchError}
              </div>
            )}
            <div className="max-h-[420px] divide-y divide-[#212833] overflow-y-auto">
              {results.map((r) => {
                const inDraft = draftIds.has(r.id)
                const already = isAlreadyClient(r.nome)
                return (
                  <div key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-medium">{r.nome}</span>
                          {already && <span className="shrink-0 rounded-full border border-[#3FA9A0]/40 px-1.5 py-0.5 text-[10px] text-[#3FA9A0]">já é cliente</span>}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11.5px] text-[#8D95A3]">
                          <MapPin size={11} /> {r.endereco} · {r.distanciaKm} km
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#8D95A3]">
                          <span className="rounded-full border border-[#2A313D] px-2 py-0.5">{r.categoria}</span>
                          {r.telefone && <span className="flex items-center gap-1"><Phone size={11} /> {r.telefone}</span>}
                          {r.horario && <span className="flex items-center gap-1"><Clock size={11} /> {r.horario}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant={inDraft ? 'secondary' : 'primary'} onClick={() => handleAddToRoute(r)} className="flex-1">
                        {inDraft ? <Check size={13} /> : <Plus size={13} />} {inDraft ? 'Adicionado à rota' : 'Adicionar à rota'}
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
                <div className="px-4 py-10 text-center text-[13px] text-[#8D95A3]">
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
