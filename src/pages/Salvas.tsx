import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Fuel, Gauge, MapPin, CheckCircle2, Play, Bookmark, Compass } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import KpiCard from '../components/ui/KpiCard'
import { Button } from '../components/ui/Field'
import { currency, formatDate, daysAgo } from '../lib/date'

type Period = 'todas' | '7dias' | 'mes'

export default function Salvas() {
  const navigate = useNavigate()
  const { routes } = useAppStore()
  const [period, setPeriod] = useState<Period>('todas')

  const active = routes.filter((r) => r.status === 'em_andamento')
  const planned = routes.filter((r) => r.status === 'planejada')
  const concluded = routes.filter((r) => r.status === 'concluida')

  const filtered = useMemo(() => {
    return concluded.filter((r) => {
      if (period === 'todas') return true
      const finished = r.finalizadaEm ?? r.criadoEm
      const days = daysAgo(finished)
      return period === '7dias' ? days <= 7 : days <= 30
    })
  }, [concluded, period])

  const sorted = [...filtered].sort((a, b) => new Date(b.finalizadaEm ?? b.criadoEm).getTime() - new Date(a.finalizadaEm ?? a.criadoEm).getTime())

  const totalDistancia = filtered.reduce((s, r) => s + r.distanciaTotalKm, 0)
  const totalCusto = filtered.reduce((s, r) => s + r.combustivel.custoEstimado, 0)
  const totalLitros = filtered.reduce((s, r) => s + r.combustivel.litrosEstimados, 0)

  const nothingAtAll = active.length === 0 && planned.length === 0 && concluded.length === 0

  if (nothingAtAll) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3FC] text-[#3B82F6]">
          <Bookmark size={28} />
        </div>
        <h1 className="text-[18px] font-bold">Nenhum roteiro salvo</h1>
        <p className="text-[13.5px] text-[#6B7F93]">
          Você ainda não salvou nenhuma rota comercial. Monte sua rota em <strong>Buscar</strong> e ela aparece aqui, pronta para retomar quando quiser.
        </p>
        <Button onClick={() => navigate('/buscar')}>
          <Compass size={14} /> Ir para Buscar
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Salvas</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">Rotas em andamento, planejadas e concluídas</p>
      </div>

      {active.length > 0 && (
        <Card className="mb-4" title="Em andamento">
          <div className="space-y-2">
            {active.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/rotas?id=${r.id}`)}
                className="flex w-full items-center justify-between rounded-[6px] border border-[#16A34A]/30 bg-[#16A34A]/10 px-3 py-2.5 text-left"
              >
                <span className="flex items-center gap-2 text-[13px] text-[#0F2A44]"><Play size={13} className="text-[#16A34A]" /> {r.nome}</span>
                <span className="text-[11.5px] text-[#16A34A]">continuar →</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {planned.length > 0 && (
        <Card className="mb-4" title="Planejadas">
          <div className="space-y-2">
            {planned.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/rotas?id=${r.id}`)}
                className="flex w-full items-center justify-between rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2.5 text-left hover:bg-[#DCEAFB]"
              >
                <div>
                  <div className="text-[13px] text-[#0F2A44]">{r.nome}</div>
                  <div className="text-[11px] text-[#6B7F93]">{r.paradas.length} paradas · {r.distanciaTotalKm} km</div>
                </div>
                <span className="mono text-[11.5px] text-[#3B82F6]">{currency(r.combustivel.custoEstimado)}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {concluded.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {([['todas', 'Todas'], ['7dias', 'Últimos 7 dias'], ['mes', 'Este mês']] as [Period, string][]).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setPeriod(v)}
                className={`rounded-full border px-3 py-1 text-[12px] ${period === v ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] text-[#6B7F93]'}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard label="Rotas concluídas" value={String(filtered.length)} />
            <KpiCard label="Distância total" value={`${Math.round(totalDistancia * 10) / 10} km`} />
            <KpiCard label="Combustível estimado" value={currency(totalCusto)} sub={`${totalLitros.toFixed(1)} L`} tone="accent" />
          </div>

          <Card className="!p-0 overflow-hidden">
            {sorted.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-[#6B7F93]">Nenhuma rota concluída nesse período.</div>
            ) : (
              <div className="divide-y divide-[#E1EDFB]">
                {sorted.map((r) => {
                  const visitados = r.paradas.filter((p) => p.status === 'visitado').length
                  return (
                    <button
                      key={r.id}
                      onClick={() => navigate(`/rotas?id=${r.id}`)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-[#EAF3FC]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[#16A34A]/15 text-[#16A34A]">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-[#0F2A44]">{r.nome}</div>
                          <div className="mt-0.5 flex items-center gap-3 text-[11.5px] text-[#6B7F93]">
                            <span>{formatDate(r.finalizadaEm ?? r.criadoEm)}</span>
                            <span className="flex items-center gap-1"><MapPin size={11} /> {visitados}/{r.paradas.length} visitados</span>
                            <span className="flex items-center gap-1"><Gauge size={11} /> {r.distanciaTotalKm} km</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="mono flex items-center gap-1 text-[12.5px] text-[#3B82F6]"><Fuel size={12} /> {currency(r.combustivel.custoEstimado)}</span>
                        <ChevronRight size={15} className="text-[#6B7F93]" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </>
  )
}
