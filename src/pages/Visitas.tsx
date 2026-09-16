import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, ClipboardList, Check } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Drawer from '../components/ui/Drawer'
import { Button, Field, Input, Select, Textarea } from '../components/ui/Field'
import { formatDateTime, addDays } from '../lib/date'
import { VISIT_STATUS_LABEL } from '../lib/ui'
import type { Visit, VisitStatus } from '../types'

const STATUS_COLOR: Record<VisitStatus, string> = {
  agendada: '#5B8DEF',
  realizada: '#3FA9A0',
  cancelada: '#D9695F',
  reagendada: '#E2963C',
}

function emptyNew(clientId: string): Omit<Visit, 'id' | 'criadoEm'> {
  return { clientId, dataHora: addDays(new Date(), 1).toISOString(), status: 'agendada', proximaAcao: '' }
}

export default function Visitas() {
  const { visits, clients, products, addVisit, updateVisit, addFollowUp } = useAppStore()
  const [params] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'todos'>('todos')
  const [newOpen, setNewOpen] = useState(false)
  const [newForm, setNewForm] = useState(emptyNew(params.get('client') ?? clients[0]?.id ?? ''))
  const [editing, setEditing] = useState<Visit | null>(null)
  const [outcome, setOutcome] = useState({ resultado: '', produtosApresentadosIds: [] as string[], proximaAcao: '', followUpDays: 0 })

  const sorted = useMemo(
    () => [...visits].sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()),
    [visits],
  )
  const filtered = statusFilter === 'todos' ? sorted : sorted.filter((v) => v.status === statusFilter)

  function openOutcome(v: Visit) {
    setEditing(v)
    setOutcome({ resultado: v.resultado ?? '', produtosApresentadosIds: v.produtosApresentadosIds ?? [], proximaAcao: v.proximaAcao ?? '', followUpDays: 0 })
  }

  function saveOutcome() {
    if (!editing) return
    updateVisit(editing.id, {
      status: 'realizada',
      resultado: outcome.resultado,
      produtosApresentadosIds: outcome.produtosApresentadosIds,
      proximaAcao: outcome.proximaAcao,
    })
    if (outcome.followUpDays > 0) {
      addFollowUp({
        clientId: editing.clientId,
        contexto: outcome.proximaAcao || 'Follow-up após visita.',
        dataAgendada: addDays(new Date(), outcome.followUpDays).toISOString(),
        origem: 'manual',
      })
    }
    setEditing(null)
  }

  function submitNew() {
    if (!newForm.clientId) return
    addVisit(newForm)
    setNewOpen(false)
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Visitas</h1>
          <p className="mt-1 text-[13px] text-[#8F8676]">{visits.length} visitas registradas</p>
        </div>
        <Button onClick={() => { setNewForm(emptyNew(clients[0]?.id ?? '')); setNewOpen(true) }}><Plus size={15} /> Agendar visita</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button onClick={() => setStatusFilter('todos')} className={`rounded-full border px-2.5 py-1 text-[11.5px] ${statusFilter === 'todos' ? 'border-[#E2963C]/50 bg-[#E2963C]/15 text-[#E2963C]' : 'border-[#E4DCC8] text-[#8F8676]'}`}>Todas</button>
        {(Object.keys(VISIT_STATUS_LABEL) as VisitStatus[]).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className="rounded-full border px-2.5 py-1 text-[11.5px]" style={statusFilter === s ? { borderColor: `${STATUS_COLOR[s]}55`, background: `${STATUS_COLOR[s]}1A`, color: STATUS_COLOR[s] } : { borderColor: '#E4DCC8', color: '#8F8676' }}>
            {VISIT_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((v) => {
          const client = clients.find((c) => c.id === v.clientId)
          return (
            <Card key={v.id} className="!p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px]" style={{ background: `${STATUS_COLOR[v.status]}22`, color: STATUS_COLOR[v.status] }}>
                    <ClipboardList size={16} />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium">{client?.nomeFantasia ?? client?.razaoSocial}</div>
                    <div className="mono text-[11.5px] text-[#8F8676]">{formatDateTime(v.dataHora)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: `${STATUS_COLOR[v.status]}1A`, color: STATUS_COLOR[v.status] }}>
                    {VISIT_STATUS_LABEL[v.status]}
                  </span>
                  {v.status === 'agendada' && (
                    <Button variant="secondary" onClick={() => openOutcome(v)}><Check size={13} /> Registrar resultado</Button>
                  )}
                </div>
              </div>
              {v.resultado && <p className="mt-3 border-t border-[#ECE5D6] pt-3 text-[12.5px] text-[#5A5346]">{v.resultado}</p>}
              {v.proximaAcao && <p className="mt-1 text-[11.5px] text-[#8F8676]">Próxima ação: {v.proximaAcao}</p>}
            </Card>
          )
        })}
        {filtered.length === 0 && <p className="py-10 text-center text-[13px] text-[#8F8676]">Nenhuma visita encontrada.</p>}
      </div>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Registrar resultado da visita"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={saveOutcome}>Salvar</Button>
          </div>
        }
      >
        <Field label="O que aconteceu na visita?">
          <Textarea rows={3} value={outcome.resultado} onChange={(e) => setOutcome({ ...outcome, resultado: e.target.value })} />
        </Field>
        <Field label="Produtos apresentados">
          <div className="flex flex-wrap gap-1.5">
            {products.slice(0, 16).map((p) => {
              const checked = outcome.produtosApresentadosIds.includes(p.id)
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() =>
                    setOutcome({
                      ...outcome,
                      produtosApresentadosIds: checked
                        ? outcome.produtosApresentadosIds.filter((id) => id !== p.id)
                        : [...outcome.produtosApresentadosIds, p.id],
                    })
                  }
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${checked ? 'border-[#3FA9A0]/50 bg-[#3FA9A0]/15 text-[#3FA9A0]' : 'border-[#E4DCC8] text-[#8F8676]'}`}
                >
                  {p.nome}
                </button>
              )
            })}
          </div>
        </Field>
        <Field label="Próxima ação sugerida">
          <Input value={outcome.proximaAcao} onChange={(e) => setOutcome({ ...outcome, proximaAcao: e.target.value })} placeholder="Ex: retornar com orçamento fechado" />
        </Field>
        <Field label="Agendar follow-up automático (dias, 0 = não agendar)">
          <Input type="number" value={outcome.followUpDays} onChange={(e) => setOutcome({ ...outcome, followUpDays: Number(e.target.value) })} />
        </Field>
      </Drawer>

      <Drawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Agendar visita"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={submitNew}>Agendar</Button>
          </div>
        }
      >
        <Field label="Cliente">
          <Select value={newForm.clientId} onChange={(e) => setNewForm({ ...newForm, clientId: e.target.value })}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nomeFantasia ?? c.razaoSocial}</option>)}
          </Select>
        </Field>
        <Field label="Data e hora">
          <Input
            type="datetime-local"
            value={new Date(newForm.dataHora).toISOString().slice(0, 16)}
            onChange={(e) => setNewForm({ ...newForm, dataHora: new Date(e.target.value).toISOString() })}
          />
        </Field>
        <Field label="Observação (opcional)">
          <Textarea rows={2} value={newForm.proximaAcao ?? ''} onChange={(e) => setNewForm({ ...newForm, proximaAcao: e.target.value })} />
        </Field>
      </Drawer>
    </>
  )
}
