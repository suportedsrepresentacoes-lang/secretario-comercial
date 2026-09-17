import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import { ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import KpiCard from '../components/ui/KpiCard'
import Card from '../components/ui/Card'
import { orderTotal, orderCommission, isSameMonth } from '../lib/calc'
import { currency, formatLongDate, formatRelativeDay, daysAgo, isPast, isToday, addDays } from '../lib/date'
import { STAGE_LABEL } from '../lib/ui'
import type { OpportunityStage } from '../types'

const FUNNEL_STAGES: OpportunityStage[] = [
  'novo_lead', 'primeiro_contato', 'interessado', 'orcamento_enviado', 'negociacao', 'venda_realizada',
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { clients, orders, visits, followUps, opportunities, repName } = useAppStore()
  const [range, setRange] = useState<'Dia' | 'Semana' | 'Mês'>('Mês')

  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const ordersThisMonth = orders.filter((o) => o.status !== 'cancelado' && isSameMonth(o.dataCriacao))
  const ordersLastMonth = orders.filter((o) => o.status !== 'cancelado' && isSameMonth(o.dataCriacao, lastMonth))
  const salesThisMonth = ordersThisMonth.reduce((s, o) => s + orderTotal(o), 0)
  const salesLastMonth = ordersLastMonth.reduce((s, o) => s + orderTotal(o), 0)
  const salesGrowth = salesLastMonth > 0 ? Math.round(((salesThisMonth - salesLastMonth) / salesLastMonth) * 100) : null
  const commissionThisMonth = ordersThisMonth.reduce((s, o) => s + orderCommission(o), 0)

  const activeClients = clients.filter((c) => c.status === 'ativo').length
  const newClientsThisMonth = clients.filter((c) => isSameMonth(c.criadoEm)).length

  const followUpsDue = followUps.filter(
    (f) => (f.status === 'pendente' || f.status === 'atrasado') && (isToday(f.dataAgendada) || isPast(f.dataAgendada)),
  )
  const followUpsDueToday = followUpsDue.filter((f) => isToday(f.dataAgendada)).length

  const weekEnd = addDays(now, 7)
  const visitsThisWeek = visits.filter((v) => v.status === 'agendada' && new Date(v.dataHora) <= weekEnd).length
  const visitsToday = visits.filter((v) => v.status === 'agendada' && isToday(v.dataHora)).length

  const openBudgets = opportunities.filter((o) => o.etapa === 'orcamento_enviado')
  const openBudgetsValue = openBudgets.reduce((s, o) => s + o.valorEstimado, 0)

  const salesTrend = useMemo(() => {
    const months: { m: string; v: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = ref.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const total = orders
        .filter((o) => o.status !== 'cancelado' && isSameMonth(o.dataCriacao, ref))
        .reduce((s, o) => s + orderTotal(o), 0)
      months.push({ m: label.charAt(0).toUpperCase() + label.slice(1), v: Math.round(total / 100) / 10 })
    }
    return months
  }, [orders])

  const funnel = FUNNEL_STAGES.map((stage) => ({
    stage: STAGE_LABEL[stage].replace(' enviado', '').replace(' realizada', ''),
    n: opportunities.filter((o) => o.etapa === stage).length,
  }))

  const followUpsToday = [...followUpsDue]
    .sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime())
    .slice(0, 5)

  const inactiveClients = [...clients]
    .filter((c) => c.ultimaCompraEm)
    .sort((a, b) => daysAgo(b.ultimaCompraEm!) - daysAgo(a.ultimaCompraEm!))
    .slice(0, 5)

  const firstName = repName.split(' ')[0]

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold sm:text-[22px]">Bom dia, {firstName}</h1>
          <p className="mt-1 text-[13px] text-[#6B7F93]">
            {formatLongDate(now)} — {visitsToday} visita{visitsToday === 1 ? '' : 's'} na agenda de hoje
          </p>
        </div>
        <div className="flex gap-1.5 self-start rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] p-1 text-[12px] text-[#6B7F93]">
          {(['Dia', 'Semana', 'Mês'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setRange(t)}
              className={`rounded-[4px] px-3 py-1.5 ${t === range ? 'bg-[#E1EDFB] text-[#0F2A44]' : ''}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Vendas do mês"
          value={currency(salesThisMonth)}
          sub={salesGrowth !== null ? `${salesGrowth >= 0 ? '↑' : '↓'} ${Math.abs(salesGrowth)}% vs. mês anterior` : `${ordersThisMonth.length} pedidos`}
          tone="accent"
          size="lg"
        />
        <KpiCard label="Comissão prevista" value={currency(commissionThisMonth)} sub={`${ordersThisMonth.length} pedidos`} />
        <KpiCard label="Clientes ativos" value={String(activeClients)} sub={`${newClientsThisMonth} novos este mês`} />
        <KpiCard label="Follow-ups pendentes" value={String(followUpsDue.length)} sub={`${followUpsDueToday} vencem hoje`} tone="teal" />
        <KpiCard label="Visitas programadas" value={String(visitsThisWeek)} sub="esta semana" />
        <KpiCard label="Orçamentos em aberto" value={String(openBudgets.length)} sub={`${currency(openBudgetsValue)} em jogo`} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title={<span className="text-[13px] font-medium text-[#33495E]">Evolução de vendas</span>}
          action={<span className="mono text-[11px] text-[#6B7F93]">R$ mil / mês</span>}
        >
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={salesTrend}>
              <CartesianGrid stroke="#E1EDFB" vertical={false} />
              <XAxis dataKey="m" stroke="#6B7F93" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7F93" fontSize={12} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={{ background: '#EAF3FC', border: '1px solid #CFE0F5', borderRadius: 6, fontSize: 12 }} />
              <Line type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3, fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Funil de conversão">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={funnel} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="stage" type="category" stroke="#6B7F93" fontSize={11} tickLine={false} axisLine={false} width={72} />
              <Tooltip contentStyle={{ background: '#EAF3FC', border: '1px solid #CFE0F5', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="n" fill="#16A34A" radius={[0, 3, 3, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Follow-ups de hoje"
          action={
            <button onClick={() => navigate('/follow-ups')}>
              <ChevronRight size={15} className="text-[#6B7F93]" />
            </button>
          }
        >
          {followUpsToday.length === 0 ? (
            <p className="py-2 text-[13px] text-[#6B7F93]">Nenhum follow-up pendente. 🎉</p>
          ) : (
            <div className="divide-y divide-[#E1EDFB]">
              {followUpsToday.map((f) => {
                const c = clients.find((c) => c.id === f.clientId)
                return (
                  <div key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-[13px]">{c ? (c.nomeFantasia ?? c.razaoSocial) : 'Cliente'}</div>
                      <div className="mt-0.5 truncate text-[11.5px] text-[#6B7F93]">{f.contexto}</div>
                    </div>
                    <span className="mono shrink-0 pl-3 text-[11.5px] text-[#3B82F6]">{formatRelativeDay(f.dataAgendada)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card
          title="Clientes sem compra"
          action={
            <button onClick={() => navigate('/clientes')}>
              <ChevronRight size={15} className="text-[#6B7F93]" />
            </button>
          }
        >
          <div className="divide-y divide-[#E1EDFB]">
            {inactiveClients.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <span className="truncate text-[13px]">{c.nomeFantasia ?? c.razaoSocial}</span>
                <span className="mono shrink-0 pl-3 text-[11.5px] text-[#EF4444]">{daysAgo(c.ultimaCompraEm!)} dias</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
