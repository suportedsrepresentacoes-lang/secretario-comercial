import { useNavigate } from 'react-router-dom'
import { Route, Compass, ChevronRight, Play, MapPin, Fuel } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import KpiCard from '../components/ui/KpiCard'
import { Button } from '../components/ui/Field'
import { currency, formatLongDate, formatDate } from '../lib/date'

export default function Inicio() {
  const navigate = useNavigate()
  const { repName, routes, clients, draftStops } = useAppStore()

  const emAndamento = routes.find((r) => r.status === 'em_andamento')
  const planejadas = routes.filter((r) => r.status === 'planejada')
  const concluidas = routes.filter((r) => r.status === 'concluida')
  const historico = [...concluidas].sort((a, b) => new Date(b.finalizadaEm ?? b.criadoEm).getTime() - new Date(a.finalizadaEm ?? a.criadoEm).getTime())
  const custoTotalMes = concluidas.reduce((s, r) => s + r.combustivel.custoEstimado, 0)

  const firstName = repName.split(' ')[0]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold sm:text-[22px]">Bom dia, {firstName}</h1>
        <p className="mt-1 text-[13px] text-[#8D95A3]">{formatLongDate(new Date())}</p>
      </div>

      {emAndamento ? (
        <Card className="mb-5 !border-[#3FA9A0]/40 !bg-[#3FA9A0]/[0.06]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[12px] font-medium text-[#3FA9A0]">
                <Play size={13} /> ROTA EM ANDAMENTO
              </div>
              <div className="text-[16px] font-semibold">{emAndamento.nome}</div>
              <div className="mt-1 text-[12.5px] text-[#8D95A3]">
                {emAndamento.paradas.filter((p) => p.status !== 'pendente').length} de {emAndamento.paradas.length} paradas registradas
              </div>
            </div>
            <Button onClick={() => navigate(`/rotas?id=${emAndamento.id}`)}>
              Continuar rota <ChevronRight size={14} />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mb-5 !border-[#E2963C]/40 !bg-[#E2963C]/[0.06]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[16px] font-semibold">Montar a rota de hoje</div>
              <p className="mt-1 text-[12.5px] text-[#8D95A3]">
                Encontre estabelecimentos por segmento, selecione clientes e monte um roteiro otimizado.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/prospeccao')}>
                <Compass size={14} /> Prospectar
              </Button>
              <Button onClick={() => navigate('/rotas')}>
                <Route size={14} /> Nova rota{draftStops.length > 0 ? ` (${draftStops.length})` : ''}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Rotas planejadas" value={String(planejadas.length)} sub="prontas para iniciar" />
        <KpiCard label="Clientes cadastrados" value={String(clients.length)} />
        <KpiCard label="Rotas concluídas" value={String(concluidas.length)} />
        <KpiCard label="Combustível estimado" value={currency(custoTotalMes)} sub="acumulado" tone="accent" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Rotas planejadas"
          action={
            <button onClick={() => navigate('/rotas')}>
              <ChevronRight size={15} className="text-[#8D95A3]" />
            </button>
          }
        >
          {planejadas.length === 0 ? (
            <p className="py-4 text-[13px] text-[#8D95A3]">Nenhuma rota planejada ainda.</p>
          ) : (
            <div className="divide-y divide-[#212833]">
              {planejadas.slice(0, 4).map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/rotas?id=${r.id}`)}
                  className="flex w-full items-center justify-between py-2.5 text-left"
                >
                  <div>
                    <div className="text-[13px] text-[#F2F0EA]">{r.nome}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#8D95A3]">
                      <MapPin size={11} /> {r.paradas.length} paradas · {r.distanciaTotalKm} km
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[#8D95A3]" />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Histórico recente"
          action={
            <button onClick={() => navigate('/historico')}>
              <ChevronRight size={15} className="text-[#8D95A3]" />
            </button>
          }
        >
          {historico.length === 0 ? (
            <p className="py-4 text-[13px] text-[#8D95A3]">Nenhuma rota concluída ainda.</p>
          ) : (
            <div className="divide-y divide-[#212833]">
              {historico.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-[13px] text-[#F2F0EA]">{r.nome}</div>
                    <div className="mt-0.5 text-[11.5px] text-[#8D95A3]">{formatDate(r.finalizadaEm ?? r.criadoEm)} · {r.distanciaTotalKm} km</div>
                  </div>
                  <span className="mono flex items-center gap-1 text-[12px] text-[#E2963C]">
                    <Fuel size={12} /> {currency(r.combustivel.custoEstimado)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
