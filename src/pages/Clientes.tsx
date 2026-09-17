import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, MapPin, Pencil, Trash2, Route as RouteIcon, Check, LocateFixed, AlertCircle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { Sheet } from '../components/ui/Sheet'
import { Badge, Tag } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { LocationButtons } from '../components/ui/LocationButtons'
import { getCurrentPosition } from '../services/geolocation'
import { searchAddress, type AddressMatch } from '../services/geocoding'
import { CLIENT_STATUS_LABEL, CLIENT_STATUS_COLOR, STOP_STATUS_LABEL, SUGGESTED_TAGS } from '../lib/labels'
import { daysAgo, formatDate } from '../lib/format'
import type { Client, ClientStatus } from '../types'

const STATUS_FILTERS: (ClientStatus | 'todos')[] = ['todos', 'prospect', 'ativo', 'retorno', 'inativo', 'sem_interesse']

function emptyClient(): Omit<Client, 'id' | 'criadoEm'> {
  return {
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    segmento: '',
    status: 'prospect',
    telefone: '',
    whatsapp: '',
    endereco: { logradouro: '', cidade: '', uf: 'GO', lat: -16.6799, lng: -49.255 },
    tags: [],
  }
}

export default function Clientes() {
  const { clients, routes, addClient, updateClient, deleteClient, toggleDraftStop, draftStops } = useAppStore()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'todos'>('todos')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyClient())
  const [tagDraft, setTagDraft] = useState('')
  const [hasLocation, setHasLocation] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<AddressMatch[]>([])
  const [addressSearching, setAddressSearching] = useState(false)

  const detailId = params.get('id')
  const detailClient = clients.find((c) => c.id === detailId) ?? null

  const allTags = useMemo(() => {
    const set = new Set<string>()
    clients.forEach((c) => c.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [clients])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter((c) => {
      const matchesQ = !q || c.nomeFantasia.toLowerCase().includes(q) || (c.cnpj ?? '').includes(q) || c.endereco.cidade.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'todos' || c.status === statusFilter
      const matchesTag = !tagFilter || c.tags.includes(tagFilter)
      return matchesQ && matchesStatus && matchesTag
    })
  }, [clients, search, statusFilter, tagFilter])

  function openDetail(id: string) { setParams({ id }) }
  function closeDetail() { params.delete('id'); setParams(params) }

  function resetLocationPicker() {
    setLocating(false)
    setLocationError(null)
    setAddressQuery('')
    setAddressResults([])
  }
  function openNewForm() { setEditing(null); setForm(emptyClient()); setHasLocation(false); resetLocationPicker(); setFormOpen(true) }
  function openEditForm(c: Client) { setEditing(c); setForm(c); setHasLocation(true); resetLocationPicker(); setFormOpen(true) }

  async function handleLocateForClient() {
    setLocating(true)
    setLocationError(null)
    try {
      const pos = await getCurrentPosition()
      setForm((f) => ({ ...f, endereco: { ...f.endereco, lat: pos.lat, lng: pos.lng } }))
      setHasLocation(true)
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Não foi possível obter sua localização.')
    } finally {
      setLocating(false)
    }
  }

  async function handleAddressSearchForClient() {
    if (addressQuery.trim().length < 3) return
    setAddressSearching(true)
    try {
      setAddressResults(await searchAddress(addressQuery))
    } catch {
      setAddressResults([])
    } finally {
      setAddressSearching(false)
    }
  }

  function pickAddressResult(r: AddressMatch) {
    setForm((f) => ({ ...f, endereco: { ...f.endereco, lat: r.lat, lng: r.lng } }))
    setHasLocation(true)
    setAddressResults([])
    setAddressQuery('')
  }

  function submitForm() {
    if (!form.nomeFantasia.trim() || !form.endereco.cidade.trim()) return
    if (!hasLocation) { setLocationError('Defina a localização (GPS ou busca de endereço) antes de salvar — sem isso o cliente não aparece certo no mapa e na rota.'); return }
    if (editing) updateClient(editing.id, form)
    else addClient(form)
    setFormOpen(false)
  }

  function addTagToForm() {
    const t = tagDraft.trim()
    if (!t || form.tags.includes(t)) return
    setForm({ ...form, tags: [...form.tags, t] })
    setTagDraft('')
  }
  function removeTagFromForm(t: string) {
    setForm({ ...form, tags: form.tags.filter((x) => x !== t) })
  }

  function addToRoute(c: Client) {
    toggleDraftStop({ id: c.id, origem: 'cliente', clientId: c.id, nome: c.nomeFantasia, endereco: `${c.endereco.logradouro}, ${c.endereco.cidade}/${c.endereco.uf}`, lat: c.endereco.lat, lng: c.endereco.lng, telefone: c.telefone, segmento: c.segmento })
  }

  const clientVisits = useMemo(() => {
    if (!detailClient) return []
    const rows: { rota: string; data: string; status: string; observacao?: string }[] = []
    routes.forEach((r) => {
      r.paradas.filter((p) => p.clientId === detailClient.id && p.status !== 'pendente').forEach((p) => rows.push({ rota: r.nome, data: r.finalizadaEm ?? r.iniciadaEm ?? r.criadoEm, status: p.status, observacao: p.observacao }))
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
        <Button onClick={openNewForm}><Plus size={15} /> Novo cliente</Button>
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93] sm:max-w-[320px] sm:flex-1">
          <Search size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, CNPJ, cidade…" className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${statusFilter === s ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] bg-[#EAF3FC] text-[#6B7F93] hover:text-[#33495E]'}`}>
              {s === 'todos' ? 'Todos' : CLIENT_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[#6B7F93]">Tags:</span>
          {allTags.map((t) => (
            <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} className={`rounded-full border px-2 py-0.5 text-[11px] ${tagFilter === t ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] text-[#6B7F93]'}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="hidden grid-cols-[2fr_1.1fr_1fr_0.8fr_0.9fr_100px] gap-3 border-b border-[#CFE0F5] px-5 py-3 text-[11.5px] font-medium text-[#6B7F93] md:grid">
          <span>Cliente</span><span>Segmento</span><span>Cidade</span><span>Status</span><span>Última visita</span><span />
        </div>
        <div className="divide-y divide-[#E1EDFB]">
          {filtered.map((c) => {
            const inDraft = draftStops.some((p) => p.id === c.id)
            return (
              <div key={c.id} className="grid grid-cols-2 gap-2 px-5 py-3.5 text-[13px] md:grid-cols-[2fr_1.1fr_1fr_0.8fr_0.9fr_100px] md:items-center md:gap-3">
                <button onClick={() => openDetail(c.id)} className="col-span-2 flex items-center gap-3 text-left md:col-span-1">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[#0F2A44]">{c.nomeFantasia}</div>
                    <div className="truncate text-[11.5px] text-[#6B7F93]">{c.cnpj || 'sem CNPJ'}</div>
                  </div>
                </button>
                <span className="truncate text-[#33495E]">{c.segmento}</span>
                <span className="truncate text-[#33495E]">{c.endereco.cidade}/{c.endereco.uf}</span>
                <span><Badge label={CLIENT_STATUS_LABEL[c.status]} color={CLIENT_STATUS_COLOR[c.status]} /></span>
                <span className="mono text-[#6B7F93]">{c.ultimaVisitaEm ? `${daysAgo(c.ultimaVisitaEm)}d atrás` : '—'}</span>
                <button onClick={() => addToRoute(c)} className={`flex items-center justify-center gap-1 rounded-full border px-2 py-1 text-[11px] ${inDraft ? 'border-[#16A34A]/50 bg-[#16A34A]/15 text-[#16A34A]' : 'border-[#CFE0F5] text-[#6B7F93] hover:text-[#33495E]'}`}>
                  {inDraft ? <Check size={12} /> : <RouteIcon size={12} />} {inDraft ? 'Na rota' : 'Add à rota'}
                </button>
              </div>
            )
          })}
          {filtered.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-[#6B7F93]">Nenhum cliente encontrado.</div>}
        </div>
      </Card>

      <Sheet open={!!detailClient} onClose={closeDetail} title={detailClient?.nomeFantasia ?? ''} width={480}>
        {detailClient && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Badge label={CLIENT_STATUS_LABEL[detailClient.status]} color={CLIENT_STATUS_COLOR[detailClient.status]} />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => addToRoute(detailClient)}><RouteIcon size={14} /> Adicionar à rota</Button>
                <Button variant="secondary" onClick={() => openEditForm(detailClient)}><Pencil size={14} /></Button>
              </div>
            </div>

            <div>
              <div className="text-[15px] font-semibold">{detailClient.razaoSocial || detailClient.nomeFantasia}</div>
              <div className="text-[12.5px] text-[#6B7F93]">{detailClient.cnpj || 'CNPJ não informado'} · {detailClient.segmento}</div>
            </div>

            {detailClient.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">{detailClient.tags.map((t) => <Tag key={t} label={t} />)}</div>
            )}

            <div className="flex items-start gap-2 text-[13px] text-[#33495E]">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#6B7F93]" />
              <span>
                {detailClient.endereco.logradouro}{detailClient.endereco.numero ? `, ${detailClient.endereco.numero}` : ''}
                {detailClient.endereco.bairro ? ` — ${detailClient.endereco.bairro}` : ''}, {detailClient.endereco.cidade}/{detailClient.endereco.uf}
              </span>
            </div>

            <LocationButtons lat={detailClient.endereco.lat} lng={detailClient.endereco.lng} />

            {(detailClient.telefone || detailClient.whatsapp) && (
              <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#33495E]">{detailClient.telefone}</div>
            )}

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
                  <div key={idx} className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[12.5px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#33495E]">{v.rota} — {formatDate(v.data)}</span>
                      <span className={v.status === 'visitado' ? 'text-[#16A34A]' : 'text-[#EF4444]'}>{STOP_STATUS_LABEL[v.status as 'visitado' | 'nao_visitado']}</span>
                    </div>
                    {v.observacao && <div className="mt-1 text-[#6B7F93]">{v.observacao}</div>}
                  </div>
                ))}
              </div>
            </div>

            <Button variant="danger" className="w-full" onClick={() => { if (confirm('Remover este cliente? Essa ação não pode ser desfeita.')) { deleteClient(detailClient.id); closeDetail() } }}>
              <Trash2 size={14} /> Remover cliente
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
        footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setFormOpen(false)}>Cancelar</Button><Button className="flex-1" onClick={submitForm}>Salvar</Button></div>}
      >
        <Field label="Nome fantasia"><Input value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} /></Field>
        <Field label="Razão social"><Input value={form.razaoSocial ?? ''} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} /></Field>
        <Field label="CNPJ"><Input value={form.cnpj ?? ''} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" /></Field>
        <Field label="Segmento"><Input value={form.segmento} onChange={(e) => setForm({ ...form, segmento: e.target.value })} placeholder="Ex: Loja de ferragens" /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
            {(['prospect', 'ativo', 'inativo', 'retorno', 'sem_interesse'] as ClientStatus[]).map((s) => <option key={s} value={s}>{CLIENT_STATUS_LABEL[s]}</option>)}
          </Select>
        </Field>

        <div className="mb-1.5 mt-2 text-[12px] font-medium text-[#6B7F93]">Endereço</div>

        <div className="mb-3">
          {hasLocation ? (
            <div className="flex items-center justify-between gap-2 rounded-[8px] border border-[#16A34A]/30 bg-[#16A34A]/10 px-3 py-2 text-[12px] text-[#16A34A]">
              <span className="flex items-center gap-1.5"><MapPin size={13} /> Localização definida ({form.endereco.lat.toFixed(5)}, {form.endereco.lng.toFixed(5)})</span>
              <button onClick={() => setHasLocation(false)} className="shrink-0 text-[11px] underline decoration-dotted">alterar</button>
            </div>
          ) : (
            <>
              <Button type="button" variant="secondary" className="mb-2 w-full" onClick={handleLocateForClient} disabled={locating}>
                <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização atual (estou no local)'}
              </Button>
              <div className="relative">
                <div className="flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93]">
                  <Search size={14} />
                  <input
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearchForClient())}
                    placeholder="Ou buscar endereço para localizar…"
                    className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]"
                  />
                  <button type="button" onClick={handleAddressSearchForClient} className="shrink-0 text-[11px] font-medium text-[#3B82F6]">{addressSearching ? '...' : 'buscar'}</button>
                </div>
                {addressResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[8px] border border-[#CFE0F5] bg-white shadow-xl">
                    {addressResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => pickAddressResult(r)} className="flex w-full items-start gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#EAF3FC]">
                        <MapPin size={13} className="mt-0.5 shrink-0 text-[#6B7F93]" />
                        <span className="text-[#0F2A44]">{r.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {locationError && <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-[#EF4444]"><AlertCircle size={12} className="mt-0.5 shrink-0" /> {locationError}</p>}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Logradouro"><Input value={form.endereco.logradouro} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, logradouro: e.target.value } })} /></Field>
          <Field label="Número"><Input value={form.endereco.numero ?? ''} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, numero: e.target.value } })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade"><Input value={form.endereco.cidade} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, cidade: e.target.value } })} /></Field>
          <Field label="UF"><Input value={form.endereco.uf} maxLength={2} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, uf: e.target.value.toUpperCase() } })} /></Field>
        </div>

        <div className="mb-1.5 mt-2 text-[12px] font-medium text-[#6B7F93]">Contato</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone"><Input value={form.telefone ?? ''} onChange={(e) => setForm({ ...form, telefone: e.target.value, whatsapp: e.target.value })} /></Field>
          <Field label="WhatsApp"><Input value={form.whatsapp ?? ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
        </div>

        <div className="mb-1.5 mt-2 text-[12px] font-medium text-[#6B7F93]">Tags</div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {form.tags.map((t) => <Tag key={t} label={t} onRemove={() => removeTagFromForm(t)} />)}
        </div>
        <div className="mb-2 flex gap-1.5">
          <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTagToForm()} placeholder="Nova tag…" className="min-w-0 flex-1 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#0F2A44] outline-none placeholder:text-[#6B7F93]" />
          <Button variant="secondary" onClick={addTagToForm}><Plus size={13} /></Button>
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {SUGGESTED_TAGS.filter((t) => !form.tags.includes(t)).map((t) => (
            <button key={t} onClick={() => setForm({ ...form, tags: [...form.tags, t] })} className="rounded-full border border-dashed border-[#CFE0F5] px-2 py-0.5 text-[11px] text-[#6B7F93] hover:border-[#3B82F6]/50 hover:text-[#3B82F6]">
              + {t}
            </button>
          ))}
        </div>

        <Field label="Observações"><Textarea rows={3} value={form.observacoes ?? ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Field>
      </Sheet>
    </>
  )
}
