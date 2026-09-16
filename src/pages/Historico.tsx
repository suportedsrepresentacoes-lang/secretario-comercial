import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Fuel, Gauge, MapPin, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import KpiCard from '../components/ui/KpiCard'
import { currency, formatDate, daysAgo } from '../lib/date'

type Period = 'todas' | '7dias' | 'mes'

export default function Historico() {
  const navigate = useNavigate()
  const { routes } = useAppStore()
  const [period, setPeriod] = useState<Period>('todas')

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

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Histórico</h1>
        <p className="mt-1 text-[13px] text-[#8D95A3]">Rotas realizadas, visitas registradas e custo de combustível</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {([['todas', 'Todas'], ['7dias', 'Últimos 7 dias'], ['mes', 'Este mês']] as [Period, string][]).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setPeriod(v)}
            className={`rounded-full border px-3 py-1 text-[12px] ${period === v ? 'border-[#E2963C]/50 bg-[#E2963C]/15 text-[#E2963C]' : 'border-[#2A313D] text-[#8D95A3]'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Rotas realizadas" value={String(filtered.length)} />
        <KpiCard label="Distância total" value={`${Math.round(totalDistancia * 10) / 10} km`} />
        <KpiCard label="Combustível estimado" value={currency(totalCusto)} sub={`${totalLitros.toFixed(1)} L`} tone="accent" />
      </div>

      <Card className="!p-0 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-[#8D95A3]">Nenhuma rota concluída nesse período.</div>
        ) : (
          <div className="divide-y divide-[#212833]">
            {sorted.map((r) => {
              const visitados = r.paradas.filter((p) => p.status === 'visitado').length
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(`/rotas?id=${r.id}`)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-[#171C24]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[#3FA9A0]/15 text-[#3FA9A0]">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#F2F0EA]">{r.nome}</div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11.5px] text-[#8D95A3]">
                        <span>{formatDate(r.finalizadaEm ?? r.criadoEm)}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {visitados}/{r.paradas.length} visitados</span>
                        <span className="flex items-center gap-1"><Gauge size={11} /> {r.distanciaTotalKm} km</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="mono flex items-center gap-1 text-[12.5px] text-[#E2963C]"><Fuel size={12} /> {currency(r.combustivel.custoEstimado)}</span>
                    <ChevronRight size={15} className="text-[#8D95A3]" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}
