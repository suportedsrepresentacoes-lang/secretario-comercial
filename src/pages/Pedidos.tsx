import { useState } from 'react'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Drawer from '../components/ui/Drawer'
import { Button, Field, Input, Select } from '../components/ui/Field'
import { currency, formatDate, todayISO } from '../lib/date'
import { orderTotal } from '../lib/calc'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../lib/ui'
import type { OrderItem, OrderStatus } from '../types'

const STATUSES: OrderStatus[] = ['rascunho', 'enviado', 'aprovado', 'faturado', 'cancelado']

export default function Pedidos() {
  const { orders, clients, industries, products, addOrder, updateOrder, deleteOrder } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'todos'>('todos')
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [industriaId, setIndustriaId] = useState(industries[0]?.id ?? '')
  const [items, setItems] = useState<OrderItem[]>([])

  const filtered = statusFilter === 'todos' ? orders : orders.filter((o) => o.status === statusFilter)
  const sorted = [...filtered].sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())

  const industryProducts = products.filter((p) => p.industriaId === industriaId)
  const selectedIndustry = industries.find((i) => i.id === industriaId)

  function addItem() {
    const first = industryProducts[0]
    if (!first) return
    setItems([...items, { productId: first.id, quantidade: 1, precoUnitario: first.precoTabela }])
  }
  function updateItem(idx: number, patch: Partial<OrderItem>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  function resetForm() {
    setClientId('')
    setIndustriaId(industries[0]?.id ?? '')
    setItems([])
  }

  function submit() {
    if (!clientId || !industriaId || items.length === 0) return
    addOrder({
      clientId,
      industriaId,
      itens: items,
      status: 'rascunho',
      dataCriacao: todayISO(),
      comissaoPercentual: selectedIndustry?.comissaoPadrao ?? 5,
    })
    setOpen(false)
    resetForm()
  }

  const draftTotal = items.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0)

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Pedidos</h1>
          <p className="mt-1 text-[13px] text-[#8F8676]">{orders.length} pedidos registrados</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={15} /> Novo pedido</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button onClick={() => setStatusFilter('todos')} className={`rounded-full border px-2.5 py-1 text-[11.5px] ${statusFilter === 'todos' ? 'border-[#E2963C]/50 bg-[#E2963C]/15 text-[#E2963C]' : 'border-[#E4DCC8] text-[#8F8676]'}`}>Todos</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className="rounded-full border px-2.5 py-1 text-[11.5px]" style={statusFilter === s ? { borderColor: `${ORDER_STATUS_COLOR[s]}55`, background: `${ORDER_STATUS_COLOR[s]}1A`, color: ORDER_STATUS_COLOR[s] } : { borderColor: '#E4DCC8', color: '#8F8676' }}>
            {ORDER_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="hidden grid-cols-[0.8fr_1.6fr_1fr_1fr_0.9fr_1fr] gap-3 border-b border-[#E4DCC8] px-5 py-3 text-[11.5px] font-medium text-[#8F8676] md:grid">
          <span>Pedido</span>
          <span>Cliente</span>
          <span>Indústria</span>
          <span>Data</span>
          <span>Total</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-[#ECE5D6]">
          {sorted.map((o) => {
            const client = clients.find((c) => c.id === o.clientId)
            const ind = industries.find((i) => i.id === o.industriaId)
            const total = orderTotal(o)
            return (
              <div key={o.id} className="grid grid-cols-2 gap-2 px-5 py-3.5 text-[13px] md:grid-cols-[0.8fr_1.6fr_1fr_1fr_0.9fr_1fr] md:items-center md:gap-3">
                <div className="col-span-2 flex items-center gap-2 md:col-span-1">
                  <ShoppingCart size={14} className="text-[#8F8676]" />
                  <span className="mono font-medium">{o.numero}</span>
                </div>
                <span className="truncate text-[#5A5346]">{client?.nomeFantasia ?? client?.razaoSocial}</span>
                <span className="truncate text-[11.5px]" style={{ color: ind?.cor }}>{ind?.nome}</span>
                <span className="text-[#8F8676]">{formatDate(o.dataCriacao)}</span>
                <span className="mono text-[#E2963C]">{currency(total)}</span>
                <div className="flex items-center gap-2">
                  <Select
                    value={o.status}
                    onChange={(e) => updateOrder(o.id, { status: e.target.value as OrderStatus })}
                    className="!w-auto !py-1 !text-[11.5px]"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                  </Select>
                  <button onClick={() => confirm('Remover pedido?') && deleteOrder(o.id)} className="rounded-[6px] p-1 text-[#8F8676] hover:text-[#D9695F]"><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
          {sorted.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-[#8F8676]">Nenhum pedido encontrado.</div>}
        </div>
      </Card>

      <Drawer
        open={open}
        onClose={() => { setOpen(false); resetForm() }}
        title="Novo pedido"
        footer={
          <div className="flex items-center gap-3">
            <div className="mr-auto text-[13px] text-[#8F8676]">Total: <span className="mono text-[#E2963C]">{currency(draftTotal)}</span></div>
            <Button variant="secondary" onClick={() => { setOpen(false); resetForm() }}>Cancelar</Button>
            <Button onClick={submit}>Criar pedido</Button>
          </div>
        }
      >
        <Field label="Cliente">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Selecione…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nomeFantasia ?? c.razaoSocial}</option>)}
          </Select>
        </Field>
        <Field label="Indústria">
          <Select value={industriaId} onChange={(e) => { setIndustriaId(e.target.value); setItems([]) }}>
            {industries.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </Select>
        </Field>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-medium text-[#8F8676]">Itens do pedido</span>
          <button onClick={addItem} className="flex items-center gap-1 text-[11.5px] text-[#E2963C]"><Plus size={13} /> Adicionar item</button>
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] p-2">
              <Select
                value={it.productId}
                onChange={(e) => {
                  const prod = products.find((p) => p.id === e.target.value)
                  updateItem(idx, { productId: e.target.value, precoUnitario: prod?.precoTabela ?? 0 })
                }}
                className="!flex-1"
              >
                {industryProducts.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </Select>
              <Input type="number" min={1} value={it.quantidade} onChange={(e) => updateItem(idx, { quantidade: Number(e.target.value) })} className="!w-16" />
              <Input type="number" value={it.precoUnitario} onChange={(e) => updateItem(idx, { precoUnitario: Number(e.target.value) })} className="!w-24" />
              <button onClick={() => removeItem(idx)} className="text-[#8F8676] hover:text-[#D9695F]"><Trash2 size={14} /></button>
            </div>
          ))}
          {items.length === 0 && <p className="text-[12.5px] text-[#8F8676]">Nenhum item adicionado.</p>}
        </div>
      </Drawer>
    </>
  )
}
