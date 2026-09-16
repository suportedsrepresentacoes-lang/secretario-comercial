import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Route, Save, Clock, Gauge, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import { Button, Input } from '../components/ui/Field'
import { buildRoute } from '../lib/geo'
import { HOME_BASE } from '../data/seed'
import { formatDate, todayISO } from '../lib/date'
import { STATUS_COLOR } from '../lib/ui'

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
  html: `<div style="width:20px;height:20px;border-radius:6px;background:#E2963C;border:2px solid #12151B;display:flex;align-items:center;justify-content:center;color:#12151B;font-weight:800;font-size:10px">DS</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

export default function Rotas() {
  const { clients, savedRoutes, addSavedRoute, deleteSavedRoute } = useAppStore()
  const [selected, setSelected] = useState<string[]>([])
  const [routeName, setRouteName] = useState('')
  const [cityFilter, setCityFilter] = useState('todas')

  const cities = useMemo(() => Array.from(new Set(clients.map((c) => c.endereco.cidade))).sort(), [clients])
  const visibleClients = cityFilter === 'todas' ? clients : clients.filter((c) => c.endereco.cidade === cityFilter)

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const result = useMemo(() => {
    if (selected.length === 0) return null
    const chosen = clients.filter((c) => selected.includes(c.id))
    return buildRoute(HOME_BASE, chosen)
  }, [selected, clients])

  function saveRoute() {
    if (!result) return
    addSavedRoute({
      nome: routeName || `Rota de ${result.ordered.length} paradas`,
      data: todayISO(),
      clientIds: result.ordered.map((c) => c.id),
      distanciaTotalKm: result.distanciaTotalKm,
      tempoEstimadoMin: result.tempoEstimadoMin,
    })
    setRouteName('')
    setSelected([])
  }

  const polylinePositions: [number, number][] = result
    ? [[HOME_BASE.lat, HOME_BASE.lng], ...result.ordered.map((c) => [c.endereco.lat, c.endereco.lng] as [number, number])]
    : []

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Rotas</h1>
        <p className="mt-1 text-[13px] text-[#8D95A3]">Selecione clientes e monte a melhor sequência de visitas</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#2A313D] px-4 py-3">
            <span className="text-[12.5px] font-medium text-[#C7CCD6]">Clientes ({selected.length} selecionados)</span>
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="rounded-[6px] border border-[#2A313D] bg-[#171C24] px-2 py-1 text-[11px] text-[#8D95A3]">
              <option value="todas">Todas as cidades</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="max-h-[420px] divide-y divide-[#212833] overflow-y-auto">
            {visibleClients.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-[12.5px] hover:bg-[#171C24]">
                <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="accent-[#E2963C]" />
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[c.status] }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[#F2F0EA]">{c.nomeFantasia ?? c.razaoSocial}</div>
                  <div className="truncate text-[11px] text-[#8D95A3]">{c.endereco.cidade}/{c.endereco.uf}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="h-[320px] overflow-hidden rounded-md border border-[#2A313D]">
            <MapContainer center={[HOME_BASE.lat, HOME_BASE.lng]} zoom={9} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              <Marker position={[HOME_BASE.lat, HOME_BASE.lng]} icon={homeIcon}><Popup>Base</Popup></Marker>
              {result?.ordered.map((c, idx) => (
                <Marker key={c.id} position={[c.endereco.lat, c.endereco.lng]} icon={numberIcon(idx + 1, '#E2963C')}>
                  <Popup>{idx + 1}. {c.nomeFantasia ?? c.razaoSocial}</Popup>
                </Marker>
              ))}
              {polylinePositions.length > 1 && <Polyline positions={polylinePositions} pathOptions={{ color: '#E2963C', weight: 3, opacity: 0.8, dashArray: '6 6' }} />}
            </MapContainer>
          </div>

          {result ? (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-4 text-[13px]">
                  <span className="flex items-center gap-1.5 text-[#C7CCD6]"><Gauge size={14} className="text-[#3FA9A0]" /> {result.distanciaTotalKm} km</span>
                  <span className="flex items-center gap-1.5 text-[#C7CCD6]"><Clock size={14} className="text-[#E2963C]" /> {Math.round(result.tempoEstimadoMin / 60 * 10) / 10}h estimadas</span>
                </div>
              </div>
              <ol className="space-y-2">
                {result.ordered.map((c, idx) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[12.5px]">
                    <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E2963C] text-[11px] font-bold text-[#12151B]">{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[#F2F0EA]">{c.nomeFantasia ?? c.razaoSocial}</div>
                      <div className="truncate text-[11px] text-[#8D95A3]">{c.endereco.logradouro}, {c.endereco.cidade}/{c.endereco.uf}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex gap-2">
                <Input value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Nome da rota (opcional)" className="flex-1" />
                <Button onClick={saveRoute}><Save size={14} /> Salvar</Button>
              </div>
            </Card>
          ) : (
            <Card><p className="flex items-center justify-center gap-2 py-8 text-[13px] text-[#8D95A3]"><Route size={16} /> Selecione clientes na lista para montar a rota.</p></Card>
          )}

          {savedRoutes.length > 0 && (
            <Card title="Rotas salvas">
              <div className="space-y-2">
                {savedRoutes.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[12.5px]">
                    <div>
                      <div className="text-[#F2F0EA]">{r.nome}</div>
                      <div className="text-[11px] text-[#8D95A3]">{formatDate(r.data)} · {r.clientIds.length} paradas · {r.distanciaTotalKm} km</div>
                    </div>
                    <button onClick={() => deleteSavedRoute(r.id)} className="text-[#8D95A3] hover:text-[#D9695F]"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
