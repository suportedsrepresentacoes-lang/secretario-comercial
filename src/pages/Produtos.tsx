import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Drawer from '../components/ui/Drawer'
import { Button, Field, Input, Select } from '../components/ui/Field'
import { currency } from '../lib/date'
import type { Product } from '../types'

function empty(industriaId: string): Omit<Product, 'id'> {
  return { industriaId, nome: '', sku: '', categoria: '', precoTabela: 0, unidade: 'un', comissaoPercentual: undefined }
}

export default function Produtos() {
  const { products, industries, addProduct, updateProduct, deleteProduct } = useAppStore()
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('todas')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(empty(industries[0]?.id ?? ''))

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) => {
      const matchesQ = !q || p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      const matchesInd = industryFilter === 'todas' || p.industriaId === industryFilter
      return matchesQ && matchesInd
    })
  }, [products, search, industryFilter])

  function openNew() {
    setEditing(null)
    setForm(empty(industries[0]?.id ?? ''))
    setOpen(true)
  }
  function openEdit(p: Product) {
    setEditing(p)
    setForm(p)
    setOpen(true)
  }
  function submit() {
    if (!form.nome.trim() || !form.industriaId) return
    if (editing) updateProduct(editing.id, form)
    else addProduct(form)
    setOpen(false)
  }

  function industryOf(id: string) {
    return industries.find((i) => i.id === id)
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Produtos</h1>
          <p className="mt-1 text-[13px] text-[#8F8676]">{products.length} itens no catálogo</p>
        </div>
        <Button onClick={openNew}><Plus size={15} /> Novo produto</Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] px-3 py-2 text-[13px] text-[#8F8676] sm:max-w-[300px] sm:flex-1">
          <Search size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto ou SKU…" className="w-full bg-transparent text-[#2B2620] outline-none placeholder:text-[#8F8676]" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setIndustryFilter('todas')} className={`rounded-full border px-2.5 py-1 text-[11.5px] ${industryFilter === 'todas' ? 'border-[#E2963C]/50 bg-[#E2963C]/15 text-[#E2963C]' : 'border-[#E4DCC8] text-[#8F8676]'}`}>Todas</button>
          {industries.map((ind) => (
            <button key={ind.id} onClick={() => setIndustryFilter(ind.id)} className={`rounded-full border px-2.5 py-1 text-[11.5px] ${industryFilter === ind.id ? 'text-[#E2963C]' : 'border-[#E4DCC8] text-[#8F8676]'}`} style={industryFilter === ind.id ? { borderColor: `${ind.cor}55`, background: `${ind.cor}1A`, color: ind.cor } : {}}>
              {ind.nome}
            </button>
          ))}
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="hidden grid-cols-[2fr_1fr_1fr_0.8fr_0.8fr_60px] gap-3 border-b border-[#E4DCC8] px-5 py-3 text-[11.5px] font-medium text-[#8F8676] md:grid">
          <span>Produto</span>
          <span>Indústria</span>
          <span>Categoria</span>
          <span>Preço tabela</span>
          <span>Comissão</span>
          <span />
        </div>
        <div className="divide-y divide-[#ECE5D6]">
          {filtered.map((p) => {
            const ind = industryOf(p.industriaId)
            return (
              <div key={p.id} className="grid grid-cols-2 gap-2 px-5 py-3.5 text-[13px] md:grid-cols-[2fr_1fr_1fr_0.8fr_0.8fr_60px] md:items-center md:gap-3">
                <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#ECE5D6] text-[#8F8676]"><Package size={15} /></div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[#2B2620]">{p.nome}</div>
                    <div className="mono truncate text-[11.5px] text-[#8F8676]">{p.sku}</div>
                  </div>
                </div>
                <span className="truncate text-[11.5px]" style={{ color: ind?.cor }}>{ind?.nome}</span>
                <span className="truncate text-[#5A5346]">{p.categoria}</span>
                <span className="mono text-[#5A5346]">{currency(p.precoTabela)}/{p.unidade}</span>
                <span className="mono text-[#3FA9A0]">{p.comissaoPercentual ?? ind?.comissaoPadrao ?? 0}%</span>
                <div className="flex gap-1 justify-end md:justify-start">
                  <button onClick={() => openEdit(p)} className="rounded-[6px] p-1.5 text-[#8F8676] hover:bg-[#F3EEE3] hover:text-[#2B2620]"><Pencil size={13} /></button>
                  <button onClick={() => confirm('Remover produto?') && deleteProduct(p.id)} className="rounded-[6px] p-1.5 text-[#8F8676] hover:bg-[#D9695F]/10 hover:text-[#D9695F]"><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-[#8F8676]">Nenhum produto encontrado.</div>}
        </div>
      </Card>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar produto' : 'Novo produto'}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={submit}>Salvar</Button>
          </div>
        }
      >
        <Field label="Indústria">
          <Select value={form.industriaId} onChange={(e) => setForm({ ...form, industriaId: e.target.value })}>
            {industries.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </Select>
        </Field>
        <Field label="Nome do produto"><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU"><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
          <Field label="Categoria"><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Preço tabela (R$)"><Input type="number" value={form.precoTabela} onChange={(e) => setForm({ ...form, precoTabela: Number(e.target.value) })} /></Field>
          <Field label="Unidade"><Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="un, cx, kg…" /></Field>
          <Field label="Comissão (%)"><Input type="number" value={form.comissaoPercentual ?? ''} onChange={(e) => setForm({ ...form, comissaoPercentual: e.target.value ? Number(e.target.value) : undefined })} /></Field>
        </div>
      </Drawer>
    </>
  )
}
