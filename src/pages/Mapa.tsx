import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppStore } from '../store/useAppStore'
import { STATUS_COLOR, STATUS_LABEL } from '../lib/ui'
import { daysAgo } from '../lib/date'
import { HOME_BASE } from '../data/seed'
import type { ClientStatus } from '../types'

function dotIcon(color: string, big = false) {
  const size = big ? 22 : 16
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #2B2620;box-shadow:0 0 0 2px ${color}55"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const STATUS_FILTERS: (ClientStatus | 'todos')[] = ['todos', 'lead', 'novo', 'ativo', 'potencial', 'inativo', 'perdido']

export default function Mapa() {
  const navigate = useNavigate()
  const { clients, orders } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'todos'>('todos')

  const filtered = statusFilter === 'todos' ? clients : clients.filter((c) => c.status === statusFilter)

  const homeIcon = useMemo(() => L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:6px;background:#3B82F6;border:2px solid #2B2620;display:flex;align-items:center;justify-content:center;color:#2B2620;font-weight:800;font-size:10px">DS</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  }), [])

  return (
    <div className="flex h-[calc(100dvh-96px)] flex-col sm:h-[calc(100dvh-104px)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[20px] font-bold">Mapa</h1>
          <p className="mt-1 text-[13px] text-[#8F8676]">{filtered.length} clientes exibidos</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="rounded-full border px-2.5 py-1 text-[11.5px]"
              style={
                statusFilter === s
                  ? s === 'todos'
                    ? { borderColor: '#3B82F655', background: '#3B82F61A', color: '#3B82F6' }
                    : { borderColor: `${STATUS_COLOR[s]}55`, background: `${STATUS_COLOR[s]}1A`, color: STATUS_COLOR[s] }
                  : { borderColor: '#E4DCC8', color: '#8F8676' }
              }
            >
              {s === 'todos' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-md border border-[#E4DCC8]">
        <MapContainer center={[HOME_BASE.lat, HOME_BASE.lng]} zoom={9} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[HOME_BASE.lat, HOME_BASE.lng]} icon={homeIcon}>
            <Popup>Base — DS Representações</Popup>
          </Marker>
          {filtered.map((c) => {
            const orderCount = orders.filter((o) => o.clientId === c.id).length
            return (
              <Marker key={c.id} position={[c.endereco.lat, c.endereco.lng]} icon={dotIcon(STATUS_COLOR[c.status])}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{c.nomeFantasia ?? c.razaoSocial}</div>
                    <div style={{ fontSize: 12, color: '#8F8676', marginBottom: 6 }}>{c.segmento} · {c.endereco.cidade}/{c.endereco.uf}</div>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>
                      Status: <strong>{STATUS_LABEL[c.status]}</strong>
                    </div>
                    {c.ultimaCompraEm && <div style={{ fontSize: 12, marginBottom: 6 }}>Última compra: {daysAgo(c.ultimaCompraEm)} dias atrás</div>}
                    <div style={{ fontSize: 12, marginBottom: 8 }}>{orderCount} pedido(s) no histórico</div>
                    <button
                      onClick={() => navigate(`/clientes?id=${c.id}`)}
                      style={{ background: '#3B82F6', color: '#2B2620', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%' }}
                    >
                      Ver cliente
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
