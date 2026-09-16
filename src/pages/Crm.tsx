import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Drawer from '../components/ui/Drawer'
import { Button, Field, Input, Select, Textarea } from '../components/ui/Field'
import { STAGE_LABEL, STAGE_ORDER } from '../lib/ui'
import { currency } from '../lib/date'
import type { Opportunity, OpportunityStage } from '../types'

const STAGE_COLOR: Record<OpportunityStage, string> = {
  novo_lead: '#9B7FE0',
  primeiro_contato: '#5B8DEF',
  interessado: '#4FC97A',
  orcamento_enviado: '#E2963C',
  negociacao: '#F2B33D',
  venda_realizada: '#3FA9A0',
  perdido: '#D9695F',
}

function empty(): Omit<Opportunity, 'id' | 'criadoEm' | 'atualizadoEm'> {
  return { clientId: '', titulo: '', valorEstimado: 0, etapa: 'novo_lead', industriaId: undefined, observacoes: '' }
}

export default function Crm() {
  const { opportunities, clients, industries, addOpportunity, moveOpportunityStage, deleteOpportunity } = useAppStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty())

  function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const newStage = result.destination.droppableId as OpportunityStage
    moveOpportunityStage(result.draggableId, newStage)
  }

  function submit() {
    if (!form.clientId || !form.titulo.trim()) return
    addOpportunity(form)
    setForm(empty())
    setOpen(false)
  }

  const totalPipeline = opportunities
    .filter((o) => !['venda_realizada', 'perdido'].includes(o.etapa))
    .reduce((s, o) => s + o.valorEstimado, 0)

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold">CRM / Funil</h1>
          <p className="mt-1 text-[13px] text-[#8D95A3]">{opportunities.length} oportunidades · Pipeline em aberto: {currency(totalPipeline)}</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={15} /> Nova oportunidade</Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGE_ORDER.map((stage) => {
            const items = opportunities.filter((o) => o.etapa === stage)
            const stageTotal = items.reduce((s, o) => s + o.valorEstimado, 0)
            return (
              <Droppable droppableId={stage} key={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex w-[260px] shrink-0 flex-col rounded-md border p-3 ${snapshot.isDraggingOver ? 'border-[#E2963C]/50 bg-[#1E2530]' : 'border-[#2A313D] bg-[#171C24]'}`}
                  >
                    <div className="mb-3 flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLOR[stage] }} />
                        <span className="text-[12.5px] font-semibold">{STAGE_LABEL[stage]}</span>
                      </div>
                      <span className="mono text-[11px] text-[#8D95A3]">{items.length}</span>
                    </div>
                    {stageTotal > 0 && <div className="mb-2 px-1 text-[11px] text-[#8D95A3]">{currency(stageTotal)}</div>}
                    <div className="flex min-h-[80px] flex-1 flex-col gap-2">
                      {items.map((o, idx) => {
                        const client = clients.find((c) => c.id === o.clientId)
                        const ind = industries.find((i) => i.id === o.industriaId)
                        return (
                          <Draggable draggableId={o.id} index={idx} key={o.id}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onDoubleClick={() => confirm('Remover oportunidade?') && deleteOpportunity(o.id)}
                                className={`rounded-[6px] border border-[#2A313D] bg-[#1A1F27] p-3 text-[12.5px] ${dragSnapshot.isDragging ? 'shadow-xl ring-1 ring-[#E2963C]/40' : ''}`}
                              >
                                <div className="font-medium text-[#F2F0EA]">{o.titulo}</div>
                                <div className="mt-0.5 truncate text-[11.5px] text-[#8D95A3]">{client?.nomeFantasia ?? client?.razaoSocial}</div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="mono text-[#E2963C]">{currency(o.valorEstimado)}</span>
                                  {ind && <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: `${ind.cor}22`, color: ind.cor }}>{ind.nome}</span>}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Nova oportunidade"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={submit}>Criar</Button>
          </div>
        }
      >
        <Field label="Cliente">
          <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            <option value="">Selecione…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nomeFantasia ?? c.razaoSocial}</option>)}
          </Select>
        </Field>
        <Field label="Título da oportunidade"><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor estimado (R$)"><Input type="number" value={form.valorEstimado} onChange={(e) => setForm({ ...form, valorEstimado: Number(e.target.value) })} /></Field>
          <Field label="Etapa">
            <Select value={form.etapa} onChange={(e) => setForm({ ...form, etapa: e.target.value as OpportunityStage })}>
              {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Indústria (opcional)">
          <Select value={form.industriaId ?? ''} onChange={(e) => setForm({ ...form, industriaId: e.target.value || undefined })}>
            <option value="">Nenhuma</option>
            {industries.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </Select>
        </Field>
        <Field label="Observações"><Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Field>
      </Drawer>
    </>
  )
}
