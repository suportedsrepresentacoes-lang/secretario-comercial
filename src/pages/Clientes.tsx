import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, MessageCircle, CalendarPlus, BellPlus, Trash2, Pencil, MapPin } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Drawer from '../components/ui/Drawer'
import StatusBadge from '../components/ui/StatusBadge'
import { Button, Field, Input, Select, Textarea } from '../components/ui/Field'
import { STATUS_LABEL, initials } from '../lib/ui'
import { currency, daysAgo, formatDate, addDays } from '../lib/date'
import type { Client, ClientStatus } from '../types'

const STATUS_FILTERS: (ClientStatus | 'todos')[] = ['todos', 'lead', 'novo', 'ativo', 'potencial', 'inativo', 'perdido']

function emptyClient(): Omit<Client, 'id' | 'criadoEm'> {
  return {
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    segmento: '',
    status: 'lead',
    prioridade: 'media',
    contatos: [{ id: crypto.randomUUID(), nome: '', telefone: '', whatsapp: '', principal: true }],
    endereco: { logradouro: '', cidade: '', uf: 'GO', lat: -16.6799, lng: -49.255 },
    industriaIds: [],
  }
}

export default function Clientes() {
  const navigate = useNavigate()
  const { clients, industries, orders, visits, followUps, addClient, updateClient, deleteClient, addFollowUp } = useAppStore()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'todos'>('todos')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyClient())
  const [followUpDraft, setFollowUpDraft] = useState({ open: false, days: 7, contexto: '' })

  const detailId = params.get('id')
  const detailClient = clients.find((c) => c.id === detailId) ?? null

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter((c) => {
      const matchesQ =
        !q ||
        (c.nomeFantasia ?? '').toLowerCase().includes(q) ||
        c.razaoSocial.toLowerCase().includes(q) ||
        c.cnpj.includes(q) ||
        c.endereco.cidade.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'todos' || c.status === statusFilter
      return matchesQ && matchesStatus
    })
  }, [clients, search, statusFilter])

  function openDetail(id: string) {
    setParams({ id })
  }
  function closeDetail() {
    params.delete('id')
    setParams(params)
  }

  function openNewForm() {
    setEditing(null)
    setForm(emptyClient())
    setFormOpen(true)
  }
  function openEditForm(c: Client) {
    setEditing(c)
    setForm(c)
    setFormOpen(true)
  }

  function submitForm() {
    if (!form.razaoSocial.trim() || !form.endereco.cidade.trim()) return
    if (editing) {
      updateClient(editing.id, form)
    } else {
      addClient(form)
    }
    setFormOpen(false)
  }

  function submitFollowUp() {
    if (!detailClient) return
    addFollowUp({
      clientId: detailClient.id,
      contexto: followUpDraft.contexto || 'Follow-up agendado manualmente.',
      dataAgendada: addDays(new Date(), followUpDraft.days).toISOString(),
      origem: 'manual',
    })
    setFollowUpDraft({ open: false, days: 7, contexto: '' })
  }

  const clientOrders = detailClient ? orders.filter((o) => o.clientId === detailClient.id) : []
  const clientVisits = detailClient ? visits.filter((v) => v.clientId === detailClient.id) : []
  const clientFollowUps = detailClient ? followUps.filter((f) => f.clientId === detailClient.id) : []

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Clientes</h1>
          <p className="mt-1 text-[13px] text-[#8D95A3]">{clients.length} clientes cadastrados</p>
        </div>
        <Button onClick={openNewForm}>
          <Plus size={15} /> Novo cliente
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[13px] text-[#8D95A3] sm:max-w-[320px] sm:flex-1">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ, cidade…"
            className="w-full bg-transparent text-[#F2F0EA] outline-none placeholder:text-[#8D95A3]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
                statusFilter === s
                  ? 'border-[#E2963C]/50 bg-[#E2963C]/15 text-[#E2963C]'
                  : 'border-[#2A313D] bg-[#171C24] text-[#8D95A3] hover:text-[#C7CCD6]'
              }`}
            >
              {s === 'todos' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="hidden grid-cols-[2fr_1.1fr_1fr_0.8fr_0.9fr_28px] gap-3 border-b border-[#2A313D] px-5 py-3 text-[11.5px] font-medium text-[#8D95A3] md:grid">
          <span>Cliente</span>
          <span>Segmento</span>
          <span>Cidade</span>
          <span>Status</span>
          <span>Última compra</span>
          <span />
        </div>
        <div className="divide-y divide-[#212833]">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => openDetail(c.id)}
              className="grid w-full grid-cols-2 gap-2 px-5 py-3.5 text-left text-[13px] hover:bg-[#171C24] md:grid-cols-[2fr_1.1fr_1fr_0.8fr_0.9fr_28px] md:items-center md:gap-3"
            >
              <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2A313D] text-[11px] font-bold">
                  {initials(c.nomeFantasia ?? c.razaoSocial)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-[#F2F0EA]">{c.nomeFantasia ?? c.razaoSocial}</div>
                  <div className="truncate text-[11.5px] text-[#8D95A3]">{c.cnpj}</div>
                </div>
              </div>
              <span className="truncate text-[#C7CCD6]">{c.segmento}</span>
              <span className="truncate text-[#C7CCD6]">{c.endereco.cidade}/{c.endereco.uf}</span>
              <span><StatusBadge status={c.status} /></span>
              <span className="mono text-[#8D95A3]">{c.ultimaCompraEm ? `${daysAgo(c.ultimaCompraEm)}d atrás` : '—'}</span>
              <ChevronRight size={15} className="hidden text-[#8D95A3] md:block" />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-[13px] text-[#8D95A3]">Nenhum cliente encontrado.</div>
          )}
        </div>
      </Card>

      {/* Detail drawer */}
      <Drawer open={!!detailClient} onClose={closeDetail} title={detailClient?.nomeFantasia ?? detailClient?.razaoSocial ?? ''} width={520}>
        {detailClient && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <StatusBadge status={detailClient.status} />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => navigate(`/whatsapp?client=${detailClient.id}`)}>
                  <MessageCircle size={14} /> WhatsApp
                </Button>
                <Button variant="secondary" onClick={() => openEditForm(detailClient)}>
                  <Pencil size={14} />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-[15px] font-semibold">{detailClient.razaoSocial}</div>
              <div className="text-[12.5px] text-[#8D95A3]">{detailClient.cnpj} · {detailClient.segmento}</div>
            </div>

            <div className="flex items-start gap-2 text-[13px] text-[#C7CCD6]">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#8D95A3]" />
              <span>
                {detailClient.endereco.logradouro}{detailClient.endereco.numero ? `, ${detailClient.endereco.numero}` : ''}
                {detailClient.endereco.bairro ? ` — ${detailClient.endereco.bairro}` : ''}, {detailClient.endereco.cidade}/{detailClient.endereco.uf}
              </span>
            </div>

            <div>
              <div className="mb-2 text-[12px] font-medium text-[#8D95A3]">Contatos</div>
              <div className="space-y-2">
                {detailClient.contatos.map((ct) => (
                  <div key={ct.id} className="rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[13px]">
                    <div className="font-medium">{ct.nome} {ct.cargo && <span className="text-[#8D95A3]">— {ct.cargo}</span>}</div>
                    <div className="text-[11.5px] text-[#8D95A3]">{ct.telefone}{ct.email ? ` · ${ct.email}` : ''}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[12px] font-medium text-[#8D95A3]">Indústrias representadas para este cliente</div>
              <div className="flex flex-wrap gap-1.5">
                {detailClient.industriaIds.length === 0 && <span className="text-[12.5px] text-[#8D95A3]">Nenhuma vinculada ainda.</span>}
                {detailClient.industriaIds.map((id) => {
                  const ind = industries.find((i) => i.id === id)
                  if (!ind) return null
                  return (
                    <span key={id} className="rounded-full border px-2.5 py-1 text-[11.5px]" style={{ borderColor: `${ind.cor}55`, color: ind.cor, background: `${ind.cor}1A` }}>
                      {ind.nome}
                    </span>
                  )
                })}
              </div>
            </div>

            {detailClient.observacoes && (
              <div>
                <div className="mb-1 text-[12px] font-medium text-[#8D95A3]">Observações</div>
                <p className="text-[13px] text-[#C7CCD6]">{detailClient.observacoes}</p>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#8D95A3]">Follow-ups</span>
                <button
                  className="flex items-center gap-1 text-[11.5px] text-[#E2963C]"
                  onClick={() => setFollowUpDraft((d) => ({ ...d, open: !d.open }))}
                >
                  <BellPlus size={13} /> Novo
                </button>
              </div>
              {followUpDraft.open && (
                <div className="mb-3 space-y-2 rounded-[6px] border border-[#2A313D] bg-[#171C24] p-3">
                  <Textarea
                    rows={2}
                    placeholder="O que foi combinado?"
                    value={followUpDraft.contexto}
                    onChange={(e) => setFollowUpDraft((d) => ({ ...d, contexto: e.target.value }))}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#8D95A3]">Daqui</span>
                    <Input
                      type="number"
                      className="w-16"
                      value={followUpDraft.days}
                      onChange={(e) => setFollowUpDraft((d) => ({ ...d, days: Number(e.target.value) }))}
                    />
                    <span className="text-[12px] text-[#8D95A3]">dias</span>
                    <Button className="ml-auto" onClick={submitFollowUp}>Agendar</Button>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                {clientFollowUps.length === 0 && <span className="text-[12.5px] text-[#8D95A3]">Nenhum follow-up registrado.</span>}
                {clientFollowUps.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[12.5px]">
                    <span className="truncate text-[#C7CCD6]">{f.contexto}</span>
                    <span className="mono shrink-0 pl-2 text-[#E2963C]">{formatDate(f.dataAgendada)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[12px] font-medium text-[#8D95A3]">Histórico de visitas</div>
              <div className="space-y-1.5">
                {clientVisits.length === 0 && <span className="text-[12.5px] text-[#8D95A3]">Nenhuma visita registrada.</span>}
                {clientVisits.map((v) => (
                  <div key={v.id} className="rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[12.5px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#C7CCD6]">{formatDate(v.dataHora)}</span>
                      <span className="text-[#8D95A3]">{v.status}</span>
                    </div>
                    {v.resultado && <div className="mt-1 text-[#8D95A3]">{v.resultado}</div>}
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="mt-2 w-full" onClick={() => navigate(`/agenda?client=${detailClient.id}`)}>
                <CalendarPlus size={14} /> Agendar visita
              </Button>
            </div>

            <div>
              <div className="mb-2 text-[12px] font-medium text-[#8D95A3]">Histórico de compras</div>
              <div className="space-y-1.5">
                {clientOrders.length === 0 && <span className="text-[12.5px] text-[#8D95A3]">Nenhum pedido registrado.</span>}
                {clientOrders.map((o) => {
                  const total = o.itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0)
                  return (
                    <div key={o.id} className="flex items-center justify-between rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[12.5px]">
                      <span className="mono text-[#C7CCD6]">{o.numero}</span>
                      <span className="text-[#8D95A3]">{formatDate(o.dataCriacao)}</span>
                      <span className="mono text-[#E2963C]">{currency(total)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                if (confirm('Remover este cliente? Essa ação não pode ser desfeita.')) {
                  deleteClient(detailClient.id)
                  closeDetail()
                }
              }}
            >
              <Trash2 size={14} /> Remover cliente
            </Button>
          </div>
        )}
      </Drawer>

      {/* Form drawer */}
      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={submitForm}>Salvar</Button>
          </div>
        }
      >
        <Field label="Razão social">
          <Input value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} />
        </Field>
        <Field label="Nome fantasia">
          <Input value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} />
        </Field>
        <Field label="CNPJ">
          <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
        </Field>
        <Field label="Segmento">
          <Input value={form.segmento} onChange={(e) => setForm({ ...form, segmento: e.target.value })} placeholder="Ex: Loja de ferragens" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Classificação">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
              {(['lead', 'novo', 'ativo', 'potencial', 'inativo', 'perdido'] as ClientStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridade">
            <Select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as Client['prioridade'] })}>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </Select>
          </Field>
        </div>

        <div className="mb-1.5 mt-2 text-[12px] font-medium text-[#8D95A3]">Endereço</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Logradouro">
            <Input value={form.endereco.logradouro} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, logradouro: e.target.value } })} />
          </Field>
          <Field label="Número">
            <Input value={form.endereco.numero ?? ''} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, numero: e.target.value } })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade">
            <Input value={form.endereco.cidade} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, cidade: e.target.value } })} />
          </Field>
          <Field label="UF">
            <Input value={form.endereco.uf} maxLength={2} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, uf: e.target.value.toUpperCase() } })} />
          </Field>
        </div>

        <div className="mb-1.5 mt-2 text-[12px] font-medium text-[#8D95A3]">Contato principal</div>
        <Field label="Nome">
          <Input
            value={form.contatos[0]?.nome ?? ''}
            onChange={(e) => setForm({ ...form, contatos: [{ ...form.contatos[0], nome: e.target.value }] })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone/WhatsApp">
            <Input
              value={form.contatos[0]?.telefone ?? ''}
              onChange={(e) => setForm({ ...form, contatos: [{ ...form.contatos[0], telefone: e.target.value, whatsapp: e.target.value }] })}
            />
          </Field>
          <Field label="Cargo">
            <Input
              value={form.contatos[0]?.cargo ?? ''}
              onChange={(e) => setForm({ ...form, contatos: [{ ...form.contatos[0], cargo: e.target.value }] })}
            />
          </Field>
        </div>

        <Field label="Indústrias vinculadas">
          <div className="flex flex-wrap gap-1.5">
            {industries.map((ind) => {
              const checked = form.industriaIds.includes(ind.id)
              return (
                <button
                  type="button"
                  key={ind.id}
                  onClick={() =>
                    setForm({
                      ...form,
                      industriaIds: checked ? form.industriaIds.filter((id) => id !== ind.id) : [...form.industriaIds, ind.id],
                    })
                  }
                  className={`rounded-full border px-2.5 py-1 text-[11.5px] ${checked ? 'border-[#E2963C]/50 bg-[#E2963C]/15 text-[#E2963C]' : 'border-[#2A313D] text-[#8D95A3]'}`}
                >
                  {ind.nome}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Observações">
          <Textarea rows={3} value={form.observacoes ?? ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </Field>
      </Drawer>
    </>
  )
}
