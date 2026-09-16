import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Drawer from '../components/ui/Drawer'
import KpiCard from '../components/ui/KpiCard'
import { Button, Field, Input, Select, Textarea } from '../components/ui/Field'
import { currency, formatDate, todayISO } from '../lib/date'
import { isSameMonth } from '../lib/calc'
import { EXPENSE_CATEGORY_LABEL } from '../lib/ui'
import type { Expense, ExpenseCategory } from '../types'

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  combustivel: '#E2963C',
  alimentacao: '#3FA9A0',
  hospedagem: '#5B8DEF',
  manutencao: '#9B7FE0',
  pedagio: '#4FC97A',
  outros: '#8F8676',
}

function empty(): Omit<Expense, 'id'> {
  return { data: todayISO(), categoria: 'combustivel', valor: 0, descricao: '' }
}

export default function Despesas() {
  const { expenses, clients, addExpense, deleteExpense } = useAppStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty())

  const thisMonth = expenses.filter((e) => isSameMonth(e.data))
  const totalThisMonth = thisMonth.reduce((s, e) => s + e.valor, 0)
  const totalAll = expenses.reduce((s, e) => s + e.valor, 0)

  const byCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>()
    thisMonth.forEach((e) => map.set(e.categoria, (map.get(e.categoria) ?? 0) + e.valor))
    return Array.from(map.entries()).map(([categoria, valor]) => ({ categoria, valor }))
  }, [thisMonth])

  const sorted = [...expenses].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  function submit() {
    if (!form.valor || !form.descricao.trim()) return
    addExpense(form)
    setForm(empty())
    setOpen(false)
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Despesas</h1>
          <p className="mt-1 text-[13px] text-[#8F8676]">Controle de gastos de viagens e visitas</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={15} /> Nova despesa</Button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard label="Despesas do mês" value={currency(totalThisMonth)} sub={`${thisMonth.length} lançamentos`} tone="accent" />
        <KpiCard label="Total acumulado" value={currency(totalAll)} sub={`${expenses.length} lançamentos no total`} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1" title="Por categoria (mês)">
          {byCategory.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-[#8F8676]">Sem despesas este mês.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={byCategory} dataKey="valor" nameKey="categoria" innerRadius={40} outerRadius={65} paddingAngle={2}>
                    {byCategory.map((c) => <Cell key={c.categoria} fill={CATEGORY_COLORS[c.categoria]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#F3EEE3', border: '1px solid #E4DCC8', borderRadius: 6, fontSize: 12 }} formatter={(v) => currency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {byCategory.map((c) => (
                  <div key={c.categoria} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5 text-[#5A5346]">
                      <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[c.categoria] }} />
                      {EXPENSE_CATEGORY_LABEL[c.categoria]}
                    </span>
                    <span className="mono text-[#8F8676]">{currency(c.valor)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="hidden grid-cols-[0.8fr_1fr_1.4fr_0.8fr_40px] gap-3 border-b border-[#E4DCC8] px-5 py-3 text-[11.5px] font-medium text-[#8F8676] md:grid">
            <span>Data</span>
            <span>Categoria</span>
            <span>Descrição</span>
            <span>Valor</span>
            <span />
          </div>
          <div className="max-h-[380px] divide-y divide-[#ECE5D6] overflow-y-auto">
            {sorted.map((e) => (
              <div key={e.id} className="grid grid-cols-2 gap-2 px-5 py-3 text-[13px] md:grid-cols-[0.8fr_1fr_1.4fr_0.8fr_40px] md:items-center md:gap-3">
                <span className="text-[#8F8676]">{formatDate(e.data)}</span>
                <span className="flex items-center gap-1.5 text-[#5A5346]">
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[e.categoria] }} />
                  {EXPENSE_CATEGORY_LABEL[e.categoria]}
                </span>
                <span className="truncate text-[#5A5346]">{e.descricao}</span>
                <span className="mono text-[#D9695F]">{currency(e.valor)}</span>
                <button onClick={() => deleteExpense(e.id)} className="justify-self-end text-[#8F8676] hover:text-[#D9695F]"><Trash2 size={13} /></button>
              </div>
            ))}
            {sorted.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-[#8F8676]">Nenhuma despesa registrada.</div>}
          </div>
        </Card>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Nova despesa"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={submit}>Salvar</Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <Input type="date" value={form.data.slice(0, 10)} onChange={(e) => setForm({ ...form, data: new Date(e.target.value).toISOString() })} />
          </Field>
          <Field label="Categoria">
            <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as ExpenseCategory })}>
              {Object.entries(EXPENSE_CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></Field>
        <Field label="Descrição"><Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></Field>
        <Field label="Cliente relacionado (opcional)">
          <Select value={form.clientId ?? ''} onChange={(e) => setForm({ ...form, clientId: e.target.value || undefined })}>
            <option value="">Nenhum</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nomeFantasia ?? c.razaoSocial}</option>)}
          </Select>
        </Field>
      </Drawer>
    </>
  )
}
