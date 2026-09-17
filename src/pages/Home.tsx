import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play, MapPin, Route as RouteIcon, Fuel, Users, AlertCircle, LocateFixed,
  ChevronRight, Compass, Gauge,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import { Button } from '../components/ui/Field'
import LocationActions from '../components/ui/LocationActions'
import { getCurrentLocation } from '../lib/geolocation'
import { reverseGeocodeCity } from '../lib/geocode'
import { haversineKm } from '../lib/geo'
import { currency } from '../lib/date'

const NEARBY_RADIUS_KM = 15

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Home() {
  const navigate = useNavigate()
  const { repName, clients, routes, toggleDraftStop, draftStops } = useAppStore()

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [cityLabel, setCityLabel] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  async function handleLocate() {
    setLocating(true)
    setLocationError(null)
    try {
      const pos = await getCurrentLocation()
      setLocation({ lat: pos.lat, lng: pos.lng })
      const city = await reverseGeocodeCity(pos.lat, pos.lng)
      setCityLabel(city)
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Não foi possível obter sua localização.')
    } finally {
      setLocating(false)
    }
  }

  const activeRoute = routes.find((r) => r.status === 'em_andamento')
  const workingRoutes = useMemo(() => routes.filter((r) => r.status !== 'concluida'), [routes])

  const visitsPlanned = workingRoutes.reduce((s, r) => s + r.paradas.length, 0)
  const pendingVisits = workingRoutes.reduce((s, r) => s + r.paradas.filter((p) => p.status === 'pendente').length, 0)
  const kmPlanned = Math.round(workingRoutes.reduce((s, r) => s + r.distanciaTotalKm, 0) * 10) / 10
  const fuelEstimate = workingRoutes.reduce((s, r) => s + r.combustivel.custoEstimado, 0)

  const nearbyClients = useMemo(() => {
    if (!location) return []
    return clients
      .map((c) => ({ client: c, distanciaKm: Math.round(haversineKm(location, c.endereco) * 10) / 10 }))
      .filter((c) => c.distanciaKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanciaKm - b.distanciaKm)
      .slice(0, 5)
  }, [location, clients])

  const nearbyProspects = useMemo(
    () => nearbyClients.filter((c) => c.client.status === 'lead' || c.client.status === 'potencial').length,
    [nearbyClients],
  )

  function handleStartRoute() {
    if (activeRoute) {
      navigate(`/rotas?id=${activeRoute.id}`)
      return
    }
    const planned = routes.find((r) => r.status === 'planejada')
    if (planned) {
      navigate(`/rotas?id=${planned.id}`)
      return
    }
    if (draftStops.length > 0) {
      navigate('/rotas')
      return
    }
    navigate('/buscar')
  }

  function addNearbyToRoute(c: (typeof nearbyClients)[number]) {
    toggleDraftStop({
      id: c.client.id,
      origem: 'cliente',
      clientId: c.client.id,
      nome: c.client.nomeFantasia ?? c.client.razaoSocial,
      endereco: `${c.client.endereco.logradouro}, ${c.client.endereco.cidade}/${c.client.endereco.uf}`,
      lat: c.client.endereco.lat,
      lng: c.client.endereco.lng,
      telefone: c.client.contatos[0]?.telefone,
      whatsapp: c.client.contatos[0]?.whatsapp,
      segmento: c.client.segmento,
    })
  }

  const firstName = repName.split(' ')[0]

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-[#0F2A44]">{greeting()}, {firstName}!</h1>
        {location ? (
          <p className="mt-1 flex items-center gap-1 text-[13px] text-[#6B7F93]">
            <MapPin size={13} /> Você está em {cityLabel ?? 'localização definida'}
          </p>
        ) : (
          <button onClick={handleLocate} disabled={locating} className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#3B82F6] disabled:opacity-60">
            <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização'}
          </button>
        )}
        {locationError && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] text-[#EF4444]"><AlertCircle size={13} className="mt-0.5 shrink-0" /> {locationError}</p>
        )}
      </div>

      {activeRoute && (
        <button
          onClick={() => navigate(`/rotas?id=${activeRoute.id}`)}
          className="mb-5 flex w-full items-center justify-between rounded-md border border-[#16A34A]/40 bg-[#16A34A]/10 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-[13px] font-medium text-[#0F2A44]">
            <Play size={14} className="text-[#16A34A]" /> Rota "{activeRoute.nome}" em andamento
          </span>
          <span className="text-[12px] font-medium text-[#16A34A]">continuar →</span>
        </button>
      )}

      <Card className="mb-5" title="Sua operação de hoje">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
            <RouteIcon size={15} className="mb-1.5 text-[#3B82F6]" />
            <div className="text-[18px] font-bold text-[#0F2A44]">{visitsPlanned}</div>
            <div className="text-[11px] text-[#6B7F93]">visitas planejadas</div>
          </div>
          <div className="rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
            <Gauge size={15} className="mb-1.5 text-[#3B82F6]" />
            <div className="text-[18px] font-bold text-[#0F2A44]">{kmPlanned} km</div>
            <div className="text-[11px] text-[#6B7F93]">km planejados</div>
          </div>
          <div className="rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
            <Fuel size={15} className="mb-1.5 text-[#3B82F6]" />
            <div className="text-[18px] font-bold text-[#0F2A44]">{currency(fuelEstimate)}</div>
            <div className="text-[11px] text-[#6B7F93]">combustível estimado</div>
          </div>
          <div className="rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
            <Users size={15} className="mb-1.5 text-[#3B82F6]" />
            <div className="text-[18px] font-bold text-[#0F2A44]">{location ? nearbyProspects : '—'}</div>
            <div className="text-[11px] text-[#6B7F93]">prospects próximos</div>
          </div>
        </div>
        {pendingVisits > 0 && (
          <p className="mt-3 text-[12.5px] text-[#6B7F93]">
            <strong className="text-[#0F2A44]">{pendingVisits}</strong> visita{pendingVisits > 1 ? 's' : ''} pendente{pendingVisits > 1 ? 's' : ''} nas rotas em aberto.
          </p>
        )}
      </Card>

      <Button className="mb-5 w-full !py-3.5 text-[15px]" onClick={handleStartRoute}>
        <Play size={16} /> Começar rota
      </Button>

      <Card
        title="Clientes próximos"
        action={
          <button onClick={() => navigate('/buscar')} className="flex items-center gap-1 text-[12px] font-medium text-[#3B82F6]">
            <Compass size={13} /> Prospectar
          </button>
        }
      >
        {!location ? (
          <div className="py-6 text-center">
            <p className="mb-3 text-[13px] text-[#6B7F93]">Ative sua localização para ver quem está perto de você agora.</p>
            <Button variant="secondary" onClick={handleLocate} disabled={locating}>
              <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização'}
            </Button>
          </div>
        ) : nearbyClients.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-[#6B7F93]">Nenhum cliente cadastrado em até {NEARBY_RADIUS_KM} km. Que tal prospectar a região?</p>
        ) : (
          <div className="space-y-2">
            {nearbyClients.map((c) => {
              const inDraft = draftStops.some((p) => p.id === c.client.id)
              return (
                <div key={c.client.id} className="rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
                  <button onClick={() => navigate(`/clientes?id=${c.client.id}`)} className="flex w-full items-center justify-between gap-2 text-left">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-[#0F2A44]">{c.client.nomeFantasia ?? c.client.razaoSocial}</div>
                      <div className="truncate text-[11.5px] text-[#6B7F93]">{c.distanciaKm} km · {c.client.segmento}</div>
                    </div>
                    <ChevronRight size={15} className="shrink-0 text-[#6B7F93]" />
                  </button>
                  <div className="mt-2 flex gap-2">
                    <LocationActions lat={c.client.endereco.lat} lng={c.client.endereco.lng} size="sm" className="flex-1" />
                    <Button variant={inDraft ? 'secondary' : 'primary'} className="!px-3" onClick={() => addNearbyToRoute(c)}>
                      <RouteIcon size={13} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}
