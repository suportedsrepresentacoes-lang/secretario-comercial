import { useState } from 'react'
import { Plus, Factory, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Drawer from '../components/ui/Drawer'
import { Button, Field, Input } from '../components/ui/Field'
import { currency } from '../lib/date'
import { orderTotal } from '../lib/calc'
import type { Industry } from '../types'

const COLOR_OPTIONS = ['#3B82F6', '#3FA9A0', '#5B8DEF', '#9B7FE0', '#D9695F', '#4FC97A']

function empty(): Omit<Industry, 'id'> {
  return { nome: '', cnpj: '', contatoNome: '', contatoTelefone: '', comissaoPadrao: 5, categorias: [], cor: COLOR_OPTIONS[0], condicaoPagamento: '', prazoEntregaDias: 10 }
}

export default function Industrias() {
  const { industries, products, clients, orders, addIndustry, updateIndustry, deleteIndustry } = useAppStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Industry | null>(null)
  const [form, setForm] = useState(empty())
  const [categoriasText, setCategoriasText] = useState('')

  function openNew() {
    setEditing(null)
    setForm(empty())
    setCategoriasText('')
    setOpen(true)
  }
  function openEdit(i: Industry) {
    setEditing(i)
    setForm(i)
    setCategoriasText(i.categorias.join(', '))
    setOpen(true)
  }
  function submit() {
    if (!form.nome.trim()) return
    const payload = { ...form, categorias: categoriasText.split(',').map((s) => s.trim()).filter(Boolean) }
    if (editing) updateIndustry(editing.id, payload)
    else addIndustry(payload)
    setOpen(false)
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Indústrias</h1>
          <p className="mt-1 text-[13px] text-[#8F8676]">{industries.length} indústrias representadas</p>
        </div>
        <Button onClick={openNew}><Plus size={15} /> Nova indústria</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((ind) => {
          const prodCount = products.filter((p) => p.industriaId === ind.id).length
          const clientCount = clients.filter((c) => c.industriaIds.includes(ind.id)).length
          const revenue = orders.filter((o) => o.industriaId === ind.id && o.status !== 'cancelado').reduce((s, o) => s + orderTotal(o), 0)
          return (
            <Card key={ind.id}>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[6px]" style={{ background: `${ind.cor}22`, color: ind.cor }}>
                    <Factory size={17} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold">{ind.nome}</div>
                    <div className="text-[11.5px] text-[#8F8676]">{ind.cnpj}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(ind)} className="rounded-[6px] p-1.5 text-[#8F8676] hover:bg-[#F3EEE3] hover:text-[#2B2620]">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => confirm('Remover indústria?') && deleteIndustry(ind.id)}
                    className="rounded-[6px] p-1.5 text-[#8F8676] hover:bg-[#D9695F]/10 hover:text-[#D9695F]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {ind.categorias.map((c) => (
                  <span key={c} className="rounded-full border border-[#E4DCC8] px-2 py-0.5 text-[11px] text-[#8F8676]">{c}</span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-[#ECE5D6] pt-3 text-center">
                <div>
                  <div className="text-[15px] font-semibold">{prodCount}</div>
                  <div className="text-[10.5px] text-[#8F8676]">Produtos</div>
                </div>
                <div>
                  <div className="text-[15px] font-semibold">{clientCount}</div>
                  <div className="text-[10.5px] text-[#8F8676]">Clientes</div>
                </div>
                <div>
                  <div className="text-[15px] font-semibold" style={{ color: ind.cor }}>{ind.comissaoPadrao}%</div>
                  <div className="text-[10.5px] text-[#8F8676]">Comissão</div>
                </div>
              </div>
              <div className="mt-3 text-[11.5px] text-[#8F8676]">Faturamento total: <span className="mono text-[#5A5346]">{currency(revenue)}</span></div>
            </Card>
          )
        })}
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar indústria' : 'Nova indústria'}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={submit}>Salvar</Button>
          </div>
        }
      >
        <Field label="Nome"><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
        <Field label="CNPJ"><Input value={form.cnpj ?? ''} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contato"><Input value={form.contatoNome ?? ''} onChange={(e) => setForm({ ...form, contatoNome: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={form.contatoTelefone ?? ''} onChange={(e) => setForm({ ...form, contatoTelefone: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Comissão padrão (%)">
            <Input type="number" value={form.comissaoPadrao} onChange={(e) => setForm({ ...form, comissaoPadrao: Number(e.target.value) })} />
          </Field>
          <Field label="Prazo de entrega (dias)">
            <Input type="number" value={form.prazoEntregaDias ?? 0} onChange={(e) => setForm({ ...form, prazoEntregaDias: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Condição de pagamento"><Input value={form.condicaoPagamento ?? ''} onChange={(e) => setForm({ ...form, condicaoPagamento: e.target.value })} /></Field>
        <Field label="Categorias (separadas por vírgula)">
          <Input value={categoriasText} onChange={(e) => setCategoriasText(e.target.value)} placeholder="Fechaduras, Dobradiças" />
        </Field>
        <Field label="Cor de identificação">
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setForm({ ...form, cor: c })}
                className="h-7 w-7 rounded-full border-2"
                style={{ background: c, borderColor: form.cor === c ? '#2B2620' : 'transparent' }}
              />
            ))}
          </div>
        </Field>
      </Drawer>
    </>
  )
}
