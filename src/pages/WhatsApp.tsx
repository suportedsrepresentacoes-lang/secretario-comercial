import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, BellPlus, Search, MessageCircle } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Drawer from '../components/ui/Drawer'
import { Button, Field, Input, Textarea } from '../components/ui/Field'
import { formatTime, addDays } from '../lib/date'
import { initials } from '../lib/ui'

const QUICK_REPLIES = [
  'Perfeito, pode mandar!',
  'Preciso pensar um pouco mais',
  'Qual o prazo de entrega?',
  'Fechado, pode faturar',
]

export default function WhatsApp() {
  const { clients, conversations, sendMessage, markConversationRead, addFollowUp } = useAppStore()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({ contexto: '', dias: 7 })

  const clientsWithConvo = useMemo(() => {
    return clients
      .map((c) => ({ client: c, convo: conversations.find((cv) => cv.clientId === c.id) }))
      .filter((row) => row.convo)
      .sort((a, b) => {
        const at = a.convo!.mensagens.at(-1)?.hora ?? ''
        const bt = b.convo!.mensagens.at(-1)?.hora ?? ''
        return bt.localeCompare(at)
      })
  }, [clients, conversations])

  const filtered = clientsWithConvo.filter((row) => {
    const q = search.toLowerCase()
    return !q || (row.client.nomeFantasia ?? row.client.razaoSocial).toLowerCase().includes(q)
  })

  const activeClientId = params.get('client') ?? filtered[0]?.client.id ?? ''
  const activeClient = clients.find((c) => c.id === activeClientId)
  const activeConvo = conversations.find((c) => c.clientId === activeClientId)

  useEffect(() => {
    if (activeClientId) markConversationRead(activeClientId)
  }, [activeClientId, markConversationRead])

  function selectClient(id: string) {
    setParams({ client: id })
  }

  function submitMessage() {
    if (!draft.trim() || !activeClientId) return
    sendMessage(activeClientId, draft.trim(), 'representante')
    setDraft('')
  }

  function simulateReply() {
    if (!activeClientId) return
    const replies = ['Beleza, obrigado!', 'Vou avaliar e te retorno.', 'Pode ser, me manda mais detalhes.', 'Fechado!']
    sendMessage(activeClientId, replies[Math.floor(Math.random() * replies.length)], 'cliente')
  }

  function submitFollowUp() {
    if (!activeClientId) return
    addFollowUp({
      clientId: activeClientId,
      contexto: followUpForm.contexto || 'Follow-up criado a partir da conversa de WhatsApp.',
      dataAgendada: addDays(new Date(), followUpForm.dias).toISOString(),
      origem: 'whatsapp',
    })
    setFollowUpForm({ contexto: '', dias: 7 })
    setFollowUpOpen(false)
  }

  return (
    <div className="flex h-[calc(100dvh-96px)] gap-4 sm:h-[calc(100dvh-104px)]">
      <div className="flex w-full max-w-[300px] shrink-0 flex-col rounded-md border border-[#E4DCC8] bg-[#FFFFFF]">
        <div className="border-b border-[#E4DCC8] p-3">
          <div className="flex items-center gap-2 rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] px-3 py-2 text-[13px] text-[#8F8676]">
            <Search size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar conversa…" className="w-full bg-transparent text-[#2B2620] outline-none placeholder:text-[#8F8676]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(({ client, convo }) => {
            const last = convo!.mensagens.at(-1)
            return (
              <button
                key={client.id}
                onClick={() => selectClient(client.id)}
                className={`flex w-full items-center gap-2.5 border-b border-[#ECE5D6] px-3 py-3 text-left hover:bg-[#F3EEE3] ${activeClientId === client.id ? 'bg-[#ECE3D2]' : ''}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4DCC8] text-[11px] font-bold">{initials(client.nomeFantasia ?? client.razaoSocial)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium">{client.nomeFantasia ?? client.razaoSocial}</span>
                    {last && <span className="mono shrink-0 text-[10px] text-[#8F8676]">{formatTime(last.hora)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11.5px] text-[#8F8676]">{last?.texto}</span>
                    {convo!.naoLidas > 0 && <span className="mono shrink-0 rounded-full bg-[#3FA9A0] px-1.5 py-0.5 text-[9px] font-bold text-[#2B2620]">{convo!.naoLidas}</span>}
                  </div>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && <p className="p-4 text-center text-[12.5px] text-[#8F8676]">Nenhuma conversa.</p>}
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-md border border-[#E4DCC8] bg-[#FFFFFF]">
        {activeClient ? (
          <>
            <div className="flex items-center justify-between border-b border-[#E4DCC8] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4DCC8] text-[11px] font-bold">{initials(activeClient.nomeFantasia ?? activeClient.razaoSocial)}</div>
                <div>
                  <div className="text-[13.5px] font-medium">{activeClient.nomeFantasia ?? activeClient.razaoSocial}</div>
                  <div className="text-[11px] text-[#8F8676]">{activeClient.contatos[0]?.nome}</div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setFollowUpOpen(true)}><BellPlus size={13} /> Criar follow-up</Button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {activeConvo?.mensagens.map((m) => (
                <div key={m.id} className={`flex ${m.autor === 'representante' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-[10px] px-3 py-2 text-[13px] ${m.autor === 'representante' ? 'bg-[#3FA9A0]/20 text-[#2B2620]' : 'bg-[#ECE5D6] text-[#2B2620]'}`}>
                    <div>{m.texto}</div>
                    <div className="mono mt-1 text-right text-[10px] text-[#8F8676]">{formatTime(m.hora)}</div>
                  </div>
                </div>
              ))}
              {(!activeConvo || activeConvo.mensagens.length === 0) && (
                <p className="py-10 text-center text-[12.5px] text-[#8F8676]">Nenhuma mensagem ainda.</p>
              )}
            </div>

            <div className="border-t border-[#E4DCC8] p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((q) => (
                  <button key={q} onClick={() => setDraft(q)} className="rounded-full border border-[#E4DCC8] px-2 py-0.5 text-[10.5px] text-[#8F8676] hover:text-[#5A5346]">{q}</button>
                ))}
                <button onClick={simulateReply} className="rounded-full border border-[#3FA9A0]/40 bg-[#3FA9A0]/10 px-2 py-0.5 text-[10.5px] text-[#3FA9A0]">Simular resposta do cliente</button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitMessage()}
                  placeholder="Digite uma mensagem…"
                  className="flex-1"
                />
                <Button onClick={submitMessage}><Send size={14} /></Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[#8F8676]">
            <MessageCircle size={28} />
            <span className="text-[13px]">Selecione uma conversa</span>
          </div>
        )}
      </div>

      <Drawer
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        title="Criar follow-up da conversa"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setFollowUpOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={submitFollowUp}>Agendar</Button>
          </div>
        }
      >
        <Field label="Contexto">
          <Textarea rows={3} value={followUpForm.contexto} onChange={(e) => setFollowUpForm({ ...followUpForm, contexto: e.target.value })} placeholder="O que foi combinado nesta conversa?" />
        </Field>
        <Field label="Daqui quantos dias?">
          <Input type="number" value={followUpForm.dias} onChange={(e) => setFollowUpForm({ ...followUpForm, dias: Number(e.target.value) })} />
        </Field>
      </Drawer>
    </div>
  )
}
