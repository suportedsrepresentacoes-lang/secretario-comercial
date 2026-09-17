import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, MapPin, Pencil, Trash2, Route as RouteIcon, Check } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Drawer from '../components/ui/Drawer'
import StatusBadge from '../components/ui/StatusBadge'
import { Button, Field, Input, Select, Textarea } from '../components/ui/Field'
import LocationActions from '../components/ui/LocationActions'
import { STATUS_LABEL, initials, STOP_STATUS_LABEL } from '../lib/ui'
import { daysAgo, formatDate } from '../lib/date'
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
  const { clients, routes, addClient, updateClient, deleteClient, toggleDraftStop, draftStops } = useAppStore()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'todos'>('todos')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyClient())

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

  function addToRoute(c: Client) {
    toggleDraftStop({
      id: c.id,
      origem: 'cliente',
      clientId: c.id,
      nome: c.nomeFantasia ?? c.razaoSocial,
      endereco: `${c.endereco.logradouro}, ${c.endereco.cidade}/${c.endereco.uf}`,
      lat: c.endereco.lat,
      lng: c.endereco.lng,
      telefone: c.contatos[0]?.telefone,
      whatsapp: c.contatos[0]?.whatsapp,
      segmento: c.segmento,
    })
  }

  const clientVisits = useMemo(() => {
    if (!detailClient) return []
    const rows: { rota: string; data: string; status: string; observacao?: string }[] = []
    routes.forEach((r) => {
      r.paradas
        .filter((p) => p.clientId === detailClient.id && p.status !== 'pendente')
        .forEach((p) => rows.push({ rota: r.nome, data: r.finalizadaEm ?? r.iniciadaEm ?? r.criadoEm, status: p.status, observacao: p.observacao }))
    })
    return rows.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [detailClient, routes])

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Clientes</h1>
          <p className="mt-1 text-[13px] text-[#6B7F93]">{clients.length} clientes e prospects cadastrados</p>
        </div>
        <Button onClick={openNewForm}>
          <Plus size={15} /> Novo cliente
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93] sm:max-w-[320px] sm:flex-1">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ, cidade…"
            className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
                statusFilter === s
                  ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]'
                  : 'border-[#CFE0F5] bg-[#EAF3FC] text-[#6B7F93] hover:text-[#33495E]'
              }`}
            >
              {s === 'todos' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="hidden grid-cols-[2fr_1.1fr_1fr_0.8fr_0.9fr_100px] gap-3 border-b border-[#CFE0F5] px-5 py-3 text-[11.5px] font-medium text-[#6B7F93] md:grid">
          <span>Cliente</span>
          <span>Segmento</span>
          <span>Cidade</span>
          <span>Status</span>
          <span>Última visita</span>
          <span />
        </div>
        <div className="divide-y divide-[#E1EDFB]">
          {filtered.map((c) => {
            const inDraft = draftStops.some((p) => p.id === c.id)
            return (
              <div
                key={c.id}
                className="grid grid-cols-2 gap-2 px-5 py-3.5 text-[13px] md:grid-cols-[2fr_1.1fr_1fr_0.8fr_0.9fr_100px] md:items-center md:gap-3"
              >
                <button onClick={() => openDetail(c.id)} className="col-span-2 flex items-center gap-3 text-left md:col-span-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#CFE0F5] text-[11px] font-bold">
                    {initials(c.nomeFantasia ?? c.razaoSocial)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[#0F2A44]">{c.nomeFantasia ?? c.razaoSocial}</div>
                    <div className="truncate text-[11.5px] text-[#6B7F93]">{c.cnpj || 'sem CNPJ'}</div>
                  </div>
                </button>
                <span className="truncate text-[#33495E]">{c.segmento}</span>
                <span className="truncate text-[#33495E]">{c.endereco.cidade}/{c.endereco.uf}</span>
                <span><StatusBadge status={c.status} /></span>
                <span className="mono text-[#6B7F93]">{c.ultimaVisitaEm ? `${daysAgo(c.ultimaVisitaEm)}d atrás` : '—'}</span>
                <button
                  onClick={() => addToRoute(c)}
                  className={`flex items-center justify-center gap-1 rounded-full border px-2 py-1 text-[11px] ${inDraft ? 'border-[#16A34A]/50 bg-[#16A34A]/15 text-[#16A34A]' : 'border-[#CFE0F5] text-[#6B7F93] hover:text-[#33495E]'}`}
                >
                  {inDraft ? <Check size={12} /> : <RouteIcon size={12} />} {inDraft ? 'Na rota' : 'Add à rota'}
                </button>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-[13px] text-[#6B7F93]">Nenhum cliente encontrado.</div>
          )}
        </div>
      </Card>

      {/* Detail drawer */}
      <Drawer open={!!detailClient} onClose={closeDetail} title={detailClient?.nomeFantasia ?? detailClient?.razaoSocial ?? ''} width={480}>
        {detailClient && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <StatusBadge status={detailClient.status} />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { addToRoute(detailClient); }}>
                  <RouteIcon size={14} /> Adicionar à rota
                </Button>
                <Button variant="secondary" onClick={() => openEditForm(detailClient)}>
                  <Pencil size={14} />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-[15px] font-semibold">{detailClient.razaoSocial}</div>
              <div className="text-[12.5px] text-[#6B7F93]">{detailClient.cnpj || 'CNPJ não informado'} · {detailClient.segmento}</div>
            </div>

            <div className="flex items-start gap-2 text-[13px] text-[#33495E]">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#6B7F93]" />
              <span>
                {detailClient.endereco.logradouro}{detailClient.endereco.numero ? `, ${detailClient.endereco.numero}` : ''}
                {detailClient.endereco.bairro ? ` — ${detailClient.endereco.bairro}` : ''}, {detailClient.endereco.cidade}/{detailClient.endereco.uf}
              </span>
            </div>

            <LocationActions lat={detailClient.endereco.lat} lng={detailClient.endereco.lng} />

            <div>
              <div className="mb-2 text-[12px] font-medium text-[#6B7F93]">Contatos</div>
              <div className="space-y-2">
                {detailClient.contatos.filter((ct) => ct.nome).map((ct) => (
                  <div key={ct.id} className="rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px]">
                    <div className="font-medium">{ct.nome} {ct.cargo && <span className="text-[#6B7F93]">— {ct.cargo}</span>}</div>
                    <div className="text-[11.5px] text-[#6B7F93]">{ct.telefone}{ct.email ? ` · ${ct.email}` : ''}</div>
                  </div>
                ))}
                {detailClient.contatos.filter((ct) => ct.nome).length === 0 && (
                  <span className="text-[12.5px] text-[#6B7F93]">Nenhum contato cadastrado.</span>
                )}
              </div>
            </div>

            {detailClient.observacoes && (
              <div>
                <div className="mb-1 text-[12px] font-medium text-[#6B7F93]">Observações</div>
                <p className="text-[13px] text-[#33495E]">{detailClient.observacoes}</p>
              </div>
            )}

            <div>
              <div className="mb-2 text-[12px] font-medium text-[#6B7F93]">Histórico de visitas</div>
              <div className="space-y-1.5">
                {clientVisits.length === 0 && <span className="text-[12.5px] text-[#6B7F93]">Nenhuma visita registrada ainda.</span>}
                {clientVisits.map((v, idx) => (
                  <div key={idx} className="rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[12.5px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#33495E]">{v.rota} — {formatDate(v.data)}</span>
                      <span className={v.status === 'visitado' ? 'text-[#16A34A]' : 'text-[#EF4444]'}>{STOP_STATUS_LABEL[v.status as 'visitado' | 'nao_visitado']}</span>
                    </div>
                    {v.observacao && <div className="mt-1 text-[#6B7F93]">{v.observacao}</div>}
                  </div>
                ))}
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
        <Field label="Classificação">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
            {(['lead', 'novo', 'ativo', 'potencial', 'inativo', 'perdido'] as ClientStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </Select>
        </Field>

        <div className="mb-1.5 mt-2 text-[12px] font-medium text-[#6B7F93]">Endereço</div>
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

        <div className="mb-1.5 mt-2 text-[12px] font-medium text-[#6B7F93]">Contato</div>
        <Field label="Nome">
          <Input
            value={form.contatos[0]?.nome ?? ''}
            onChange={(e) => setForm({ ...form, contatos: [{ ...form.contatos[0], nome: e.target.value }] })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone / WhatsApp">
            <Input
              value={form.contatos[0]?.telefone ?? ''}
              onChange={(e) => setForm({ ...form, contatos: [{ ...form.contatos[0], telefone: e.target.value, whatsapp: e.target.value }] })}
            />
          </Field>
          <Field label="E-mail">
            <Input
              value={form.contatos[0]?.email ?? ''}
              onChange={(e) => setForm({ ...form, contatos: [{ ...form.contatos[0], email: e.target.value }] })}
            />
          </Field>
        </div>

        <Field label="Observações">
          <Textarea rows={3} value={form.observacoes ?? ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </Field>
      </Drawer>
    </>
  )
}
