import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Clock, MapPin } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Drawer from '../components/ui/Drawer'
import { Button, Field, Input, Select, Textarea } from '../components/ui/Field'
import { addDays, formatTime, isSameDay } from '../lib/date'
import { VISIT_STATUS_LABEL } from '../lib/ui'
import type { Visit } from '../types'

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function emptyForm(clientId: string, day: Date): Omit<Visit, 'id' | 'criadoEm'> {
  const d = new Date(day)
  d.setHours(9, 0, 0, 0)
  return { clientId, dataHora: d.toISOString(), status: 'agendada', proximaAcao: '' }
}

export default function Agenda() {
  const { visits, clients, addVisit } = useAppStore()
  const [params] = useSearchParams()
  const [selectedDay, setSelectedDay] = useState(0)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm(params.get('client') ?? clients[0]?.id ?? '', new Date()))

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)), [])

  const dayVisits = (day: Date) =>
    [...visits]
      .filter((v) => isSameDay(v.dataHora, day) && v.status !== 'cancelada')
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())

  const activeDay = days[selectedDay]
  const activeVisits = dayVisits(activeDay)

  function openNew() {
    setForm(emptyForm(clients[0]?.id ?? '', activeDay))
    setOpen(true)
  }

  function submit() {
    if (!form.clientId) return
    addVisit(form)
    setOpen(false)
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Agenda</h1>
          <p className="mt-1 text-[13px] text-[#8D95A3]">Próximos 7 dias</p>
        </div>
        <Button onClick={openNew}><Plus size={15} /> Agendar visita</Button>
      </div>

      <div className="mb-5 grid grid-cols-7 gap-2">
        {days.map((d, idx) => {
          const count = dayVisits(d).length
          const isToday = idx === 0
          return (
            <button
              key={idx}
              onClick={() => setSelectedDay(idx)}
              className={`flex flex-col items-center gap-1 rounded-[8px] border py-3 transition-colors ${
                selectedDay === idx ? 'border-[#E2963C]/50 bg-[#E2963C]/10' : 'border-[#2A313D] bg-[#171C24] hover:bg-[#1E2530]'
              }`}
            >
              <span className="text-[10.5px] uppercase text-[#8D95A3]">{isToday ? 'hoje' : WEEKDAY_SHORT[d.getDay()]}</span>
              <span className={`text-[16px] font-semibold ${selectedDay === idx ? 'text-[#E2963C]' : 'text-[#F2F0EA]'}`}>{d.getDate()}</span>
              {count > 0 && <span className="mono text-[10px] text-[#3FA9A0]">{count}</span>}
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        {activeVisits.length === 0 && (
          <Card><p className="py-6 text-center text-[13px] text-[#8D95A3]">Nenhuma visita agendada para este dia.</p></Card>
        )}
        {activeVisits.map((v) => {
          const client = clients.find((c) => c.id === v.clientId)
          return (
            <Card key={v.id} className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[6px] bg-[#212833] text-[#E2963C]">
                    <Clock size={14} />
                    <span className="mono text-[10px]">{formatTime(v.dataHora)}</span>
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium">{client?.nomeFantasia ?? client?.razaoSocial}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#8D95A3]">
                      <MapPin size={11} /> {client?.endereco.cidade}/{client?.endereco.uf}
                    </div>
                    {v.proximaAcao && <div className="mt-1 text-[11.5px] text-[#C7CCD6]">{v.proximaAcao}</div>}
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-[#2A313D] px-2 py-0.5 text-[10.5px] text-[#8D95A3]">{VISIT_STATUS_LABEL[v.status]}</span>
              </div>
            </Card>
          )
        })}
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Agendar visita"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={submit}>Agendar</Button>
          </div>
        }
      >
        <Field label="Cliente">
          <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nomeFantasia ?? c.razaoSocial}</option>)}
          </Select>
        </Field>
        <Field label="Data e hora">
          <Input
            type="datetime-local"
            value={new Date(form.dataHora).toISOString().slice(0, 16)}
            onChange={(e) => setForm({ ...form, dataHora: new Date(e.target.value).toISOString() })}
          />
        </Field>
        <Field label="Observação (opcional)">
          <Textarea rows={2} value={form.proximaAcao ?? ''} onChange={(e) => setForm({ ...form, proximaAcao: e.target.value })} />
        </Field>
      </Drawer>
    </>
  )
}
