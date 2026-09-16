import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import KpiCard from '../components/ui/KpiCard'
import { currency } from '../lib/date'
import { orderTotal, orderCommission } from '../lib/calc'
import { STATUS_COLOR, STATUS_LABEL } from '../lib/ui'
import type { ClientStatus } from '../types'

export default function Relatorios() {
  const { orders, clients, industries, expenses } = useAppStore()
  const valid = orders.filter((o) => o.status !== 'cancelado')

  const totalSales = valid.reduce((s, o) => s + orderTotal(o), 0)
  const totalCommission = valid.reduce((s, o) => s + orderCommission(o), 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.valor, 0)

  const salesByIndustry = industries
    .map((ind) => ({ nome: ind.nome, valor: valid.filter((o) => o.industriaId === ind.id).reduce((s, o) => s + orderTotal(o), 0), cor: ind.cor }))
    .filter((r) => r.valor > 0)
    .sort((a, b) => b.valor - a.valor)

  const clientsByStatus = useMemo(() => {
    const statuses: ClientStatus[] = ['lead', 'novo', 'ativo', 'potencial', 'inativo', 'perdido']
    return statuses.map((s) => ({ status: s, n: clients.filter((c) => c.status === s).length })).filter((r) => r.n > 0)
  }, [clients])

  const topClients = useMemo(() => {
    return clients
      .map((c) => ({ client: c, valor: valid.filter((o) => o.clientId === c.id).reduce((s, o) => s + orderTotal(o), 0) }))
      .filter((r) => r.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6)
  }, [clients, valid])

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Relatórios</h1>
        <p className="mt-1 text-[13px] text-[#8D95A3]">Visão consolidada de vendas, comissões e carteira</p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Faturamento total" value={currency(totalSales)} sub={`${valid.length} pedidos`} tone="accent" />
        <KpiCard label="Comissão acumulada" value={currency(totalCommission)} tone="teal" />
        <KpiCard label="Despesas acumuladas" value={currency(totalExpenses)} tone="danger" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Vendas por indústria">
          {salesByIndustry.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-[#8D95A3]">Sem pedidos registrados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesByIndustry} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="#212833" horizontal={false} />
                <XAxis type="number" stroke="#8D95A3" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="nome" type="category" stroke="#8D95A3" fontSize={11} tickLine={false} axisLine={false} width={130} />
                <Tooltip contentStyle={{ background: '#171C24', border: '1px solid #2A313D', borderRadius: 6, fontSize: 12 }} formatter={(v) => currency(Number(v))} />
                <Bar dataKey="valor" radius={[0, 3, 3, 0]} barSize={16}>
                  {salesByIndustry.map((r) => <Cell key={r.nome} fill={r.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Carteira por classificação">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={clientsByStatus} dataKey="n" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {clientsByStatus.map((r) => <Cell key={r.status} fill={STATUS_COLOR[r.status]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#171C24', border: '1px solid #2A313D', borderRadius: 6, fontSize: 12 }} formatter={(v, n) => [String(v), STATUS_LABEL[n as ClientStatus]]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3">
            {clientsByStatus.map((r) => (
              <span key={r.status} className="flex items-center gap-1.5 text-[11.5px] text-[#8D95A3]">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[r.status] }} /> {STATUS_LABEL[r.status]} ({r.n})
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Top clientes por faturamento">
        <div className="space-y-3">
          {topClients.map(({ client, valor }) => (
            <div key={client.id}>
              <div className="mb-1 flex items-center justify-between text-[12.5px]">
                <span className="text-[#C7CCD6]">{client.nomeFantasia ?? client.razaoSocial}</span>
                <span className="mono text-[#E2963C]">{currency(valor)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#212833]">
                <div className="h-full rounded-full bg-[#E2963C]" style={{ width: `${(valor / topClients[0].valor) * 100}%` }} />
              </div>
            </div>
          ))}
          {topClients.length === 0 && <p className="py-4 text-center text-[12.5px] text-[#8D95A3]">Sem dados de faturamento ainda.</p>}
        </div>
      </Card>
    </>
  )
}
