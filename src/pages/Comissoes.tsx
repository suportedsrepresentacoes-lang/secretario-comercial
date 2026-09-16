import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import KpiCard from '../components/ui/KpiCard'
import { currency, formatDate } from '../lib/date'
import { orderTotal, orderCommission, isSameMonth } from '../lib/calc'
import { ORDER_STATUS_LABEL } from '../lib/ui'

export default function Comissoes() {
  const { orders, clients, industries } = useAppStore()
  const valid = orders.filter((o) => o.status !== 'cancelado')

  const now = new Date()
  const thisMonth = valid.filter((o) => isSameMonth(o.dataCriacao))
  const commissionThisMonth = thisMonth.reduce((s, o) => s + orderCommission(o), 0)
  const pending = valid.filter((o) => o.status !== 'faturado')
  const pendingCommission = pending.reduce((s, o) => s + orderCommission(o), 0)
  const ytdCommission = valid
    .filter((o) => new Date(o.dataCriacao).getFullYear() === now.getFullYear())
    .reduce((s, o) => s + orderCommission(o), 0)

  const trend = useMemo(() => {
    const months: { m: string; v: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = ref.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const total = valid.filter((o) => isSameMonth(o.dataCriacao, ref)).reduce((s, o) => s + orderCommission(o), 0)
      months.push({ m: label.charAt(0).toUpperCase() + label.slice(1), v: Math.round(total) })
    }
    return months
  }, [valid])

  const byIndustry = industries.map((ind) => {
    const indOrders = valid.filter((o) => o.industriaId === ind.id)
    const sales = indOrders.reduce((s, o) => s + orderTotal(o), 0)
    const commission = indOrders.reduce((s, o) => s + orderCommission(o), 0)
    return { ind, sales, commission, count: indOrders.length }
  }).filter((r) => r.count > 0)

  const sorted = [...valid].sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Comissões</h1>
        <p className="mt-1 text-[13px] text-[#8F8676]">Acompanhamento de comissões por pedido e por indústria</p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Comissão do mês" value={currency(commissionThisMonth)} sub={`${thisMonth.length} pedidos`} tone="accent" />
        <KpiCard label="A receber (não faturado)" value={currency(pendingCommission)} sub={`${pending.length} pedidos em aberto`} tone="teal" />
        <KpiCard label="Acumulado no ano" value={currency(ytdCommission)} sub={now.getFullYear().toString()} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Comissão por mês">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trend}>
              <CartesianGrid stroke="#ECE5D6" vertical={false} />
              <XAxis dataKey="m" stroke="#8F8676" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8F8676" fontSize={12} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: '#F3EEE3', border: '1px solid #E4DCC8', borderRadius: 6, fontSize: 12 }}
                formatter={(v) => currency(Number(v))}
              />
              <Bar dataKey="v" fill="#E2963C" radius={[3, 3, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Por indústria">
          <div className="space-y-3">
            {byIndustry.map(({ ind, sales, commission }) => (
              <div key={ind.id}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span style={{ color: ind.cor }}>{ind.nome}</span>
                  <span className="mono text-[#5A5346]">{currency(commission)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#ECE5D6]">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (sales / Math.max(...byIndustry.map((b) => b.sales))) * 100)}%`, background: ind.cor }} />
                </div>
              </div>
            ))}
            {byIndustry.length === 0 && <p className="text-[12.5px] text-[#8F8676]">Sem pedidos registrados ainda.</p>}
          </div>
        </Card>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="hidden grid-cols-[0.8fr_1.4fr_1fr_0.9fr_0.9fr_0.9fr] gap-3 border-b border-[#E4DCC8] px-5 py-3 text-[11.5px] font-medium text-[#8F8676] md:grid">
          <span>Pedido</span>
          <span>Cliente</span>
          <span>Data</span>
          <span>Total</span>
          <span>Comissão</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-[#ECE5D6]">
          {sorted.map((o) => {
            const client = clients.find((c) => c.id === o.clientId)
            return (
              <div key={o.id} className="grid grid-cols-2 gap-2 px-5 py-3 text-[13px] md:grid-cols-[0.8fr_1.4fr_1fr_0.9fr_0.9fr_0.9fr] md:items-center md:gap-3">
                <span className="mono font-medium">{o.numero}</span>
                <span className="truncate text-[#5A5346]">{client?.nomeFantasia ?? client?.razaoSocial}</span>
                <span className="text-[#8F8676]">{formatDate(o.dataCriacao)}</span>
                <span className="mono text-[#5A5346]">{currency(orderTotal(o))}</span>
                <span className="mono text-[#3FA9A0]">{currency(orderCommission(o))} <span className="text-[#8F8676]">({o.comissaoPercentual}%)</span></span>
                <span className="text-[11.5px] text-[#8F8676]">{ORDER_STATUS_LABEL[o.status]}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
