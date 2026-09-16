import { useMemo, useState } from 'react'
import { BellRing, Plus, Sparkles, MessageCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Drawer from '../components/ui/Drawer'
import { Button, Field, Input, Select, Textarea } from '../components/ui/Field'
import { formatDate, formatRelativeDay, isPast, isToday, addDays } from '../lib/date'
import { interpretFollowUpResponse } from '../lib/ai'
import { FOLLOWUP_STATUS_LABEL } from '../lib/ui'
import type { FollowUp } from '../types'

const ORIGIN_LABEL = { manual: 'Manual', ia: 'IA Comercial', whatsapp: 'WhatsApp' }

export default function FollowUps() {
  const navigate = useNavigate()
  const { followUps, clients, opportunities, addFollowUp, completeFollowUp, moveOpportunityStage, setClientStatus } = useAppStore()
  const [newOpen, setNewOpen] = useState(false)
  const [newForm, setNewForm] = useState({ clientId: clients[0]?.id ?? '', contexto: '', dias: 7 })
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [lastResult, setLastResult] = useState<string | null>(null)

  const atrasados = followUps.filter((f) => (f.status === 'pendente' || f.status === 'atrasado') && isPast(f.dataAgendada) && !isToday(f.dataAgendada))
  const hoje = followUps.filter((f) => (f.status === 'pendente' || f.status === 'atrasado') && isToday(f.dataAgendada))
  const proximos = followUps.filter((f) => f.status === 'pendente' && !isToday(f.dataAgendada) && !isPast(f.dataAgendada))
  const concluidos = useMemo(
    () => [...followUps.filter((f) => f.status === 'concluido' || f.status === 'cancelado')].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()).slice(0, 8),
    [followUps],
  )

  function clientOf(f: FollowUp) {
    return clients.find((c) => c.id === f.clientId)
  }

  function submitNew() {
    if (!newForm.clientId) return
    addFollowUp({ clientId: newForm.clientId, contexto: newForm.contexto || 'Follow-up agendado.', dataAgendada: addDays(new Date(), newForm.dias).toISOString(), origem: 'manual' })
    setNewForm({ clientId: clients[0]?.id ?? '', contexto: '', dias: 7 })
    setNewOpen(false)
  }

  function submitResponse(f: FollowUp) {
    const interpretation = interpretFollowUpResponse(responseText || 'sem retorno')
    completeFollowUp(f.id, `Resposta do cliente: "${responseText}". IA: ${interpretation.resumo}`)

    if (interpretation.sentimento === 'positivo') {
      if (f.opportunityId) {
        const opp = opportunities.find((o) => o.id === f.opportunityId)
        if (opp && opp.etapa !== 'venda_realizada' && opp.etapa !== 'perdido') {
          moveOpportunityStage(opp.id, 'negociacao')
        }
      }
      setClientStatus(f.clientId, 'ativo')
    } else if (interpretation.sentimento === 'negativo') {
      if (f.opportunityId) moveOpportunityStage(f.opportunityId, 'perdido')
    } else if (interpretation.reagendarDias) {
      addFollowUp({
        clientId: f.clientId,
        opportunityId: f.opportunityId,
        contexto: `Reagendado automaticamente pela IA: ${interpretation.resumo}`,
        dataAgendada: addDays(new Date(), interpretation.reagendarDias).toISOString(),
        origem: 'ia',
      })
    }

    setLastResult(interpretation.resumo)
    setRespondingId(null)
    setResponseText('')
  }

  function Section({ title, items, tone }: { title: string; items: FollowUp[]; tone: string }) {
    if (items.length === 0) return null
    return (
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
          <span className="text-[12.5px] font-semibold text-[#C7CCD6]">{title}</span>
          <span className="mono text-[11px] text-[#8D95A3]">{items.length}</span>
        </div>
        <div className="space-y-2.5">
          {items.map((f) => {
            const client = clientOf(f)
            return (
              <Card key={f.id} className="!p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-medium">{client?.nomeFantasia ?? client?.razaoSocial}</span>
                      <span className="rounded-full border border-[#2A313D] px-1.5 py-0.5 text-[10px] text-[#8D95A3]">{ORIGIN_LABEL[f.origem]}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-[#C7CCD6]">{f.contexto}</p>
                    <p className="mono mt-1 text-[11px] text-[#8D95A3]">{formatRelativeDay(f.dataAgendada)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" onClick={() => navigate(`/whatsapp?client=${f.clientId}`)}>
                      <MessageCircle size={13} />
                    </Button>
                    <Button onClick={() => { setRespondingId(f.id); setResponseText('') }}>
                      <Sparkles size={13} /> Retomar contato
                    </Button>
                  </div>
                </div>
                {respondingId === f.id && (
                  <div className="mt-3 space-y-2 rounded-[6px] border border-[#3FA9A0]/30 bg-[#3FA9A0]/5 p-3">
                    <p className="text-[11.5px] text-[#8D95A3]">O que o cliente respondeu? A IA vai interpretar e atualizar o CRM automaticamente.</p>
                    <Textarea rows={2} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder='Ex: "Pode mandar o pedido, tá fechado!"' />
                    <div className="flex flex-wrap gap-1.5">
                      {['Pode mandar, fechado!', 'Não tenho interesse agora', 'Me dá mais 15 dias pra decidir'].map((s) => (
                        <button key={s} onClick={() => setResponseText(s)} className="rounded-full border border-[#2A313D] px-2 py-0.5 text-[10.5px] text-[#8D95A3] hover:text-[#C7CCD6]">{s}</button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setRespondingId(null)}>Cancelar</Button>
                      <Button onClick={() => submitResponse(f)}>Interpretar e atualizar CRM</Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Follow-ups</h1>
          <p className="mt-1 text-[13px] text-[#8D95A3]">Contatos agendados, com retomada assistida por IA</p>
        </div>
        <Button onClick={() => setNewOpen(true)}><Plus size={15} /> Novo follow-up</Button>
      </div>

      {lastResult && (
        <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-[#3FA9A0]/40 bg-[#3FA9A0]/10 px-3 py-2 text-[12.5px] text-[#3FA9A0]">
          <CheckCircle2 size={15} /> CRM atualizado: {lastResult}
        </div>
      )}

      {atrasados.length === 0 && hoje.length === 0 && proximos.length === 0 && (
        <Card><p className="flex items-center justify-center gap-2 py-8 text-[13px] text-[#8D95A3]"><BellRing size={16} /> Nenhum follow-up pendente. Sua carteira está em dia!</p></Card>
      )}

      <Section title="Atrasados" items={atrasados} tone="#D9695F" />
      <Section title="Hoje" items={hoje} tone="#E2963C" />
      <Section title="Próximos" items={proximos} tone="#5B8DEF" />

      {concluidos.length > 0 && (
        <div>
          <div className="mb-2 text-[12.5px] font-semibold text-[#C7CCD6]">Histórico recente</div>
          <div className="space-y-2">
            {concluidos.map((f) => {
              const client = clientOf(f)
              return (
                <Card key={f.id} className="!p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-medium">{client?.nomeFantasia ?? client?.razaoSocial}</span>
                    <span className="text-[10.5px] text-[#8D95A3]">{FOLLOWUP_STATUS_LABEL[f.status]} · {formatDate(f.criadoEm)}</span>
                  </div>
                  {f.resultado && <p className="mt-1 text-[11.5px] text-[#8D95A3]">{f.resultado}</p>}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <Drawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Novo follow-up"
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
        <Field label="O que foi combinado?">
          <Textarea rows={2} value={newForm.contexto} onChange={(e) => setNewForm({ ...newForm, contexto: e.target.value })} />
        </Field>
        <Field label="Daqui quantos dias?">
          <Input type="number" value={newForm.dias} onChange={(e) => setNewForm({ ...newForm, dias: Number(e.target.value) })} />
        </Field>
      </Drawer>
    </>
  )
}
