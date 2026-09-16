import { useState } from 'react'
import { Download, RotateCcw, Smartphone } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import { Button, Field, Input } from '../components/ui/Field'
import { initials } from '../lib/ui'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-[#3FA9A0]' : 'bg-[#2A313D]'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function Configuracoes() {
  const store = useAppStore()
  const [repName, setRepName] = useState(store.repName)
  const [companyName, setCompanyName] = useState(store.companyName)
  const [notifFollowUp, setNotifFollowUp] = useState(true)
  const [notifWhatsapp, setNotifWhatsapp] = useState(true)
  const [notifOrders, setNotifOrders] = useState(false)

  function saveProfile() {
    useAppStore.setState({ repName, companyName })
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-[20px] font-bold">Configurações</h1>
        <p className="mt-1 text-[13px] text-[#8D95A3]">Perfil, notificações e preferências do sistema</p>
      </div>

      <Card title="Perfil">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3FA9A0] text-[14px] font-bold text-[#0F1218]">{initials(repName)}</div>
          <div>
            <div className="text-[14px] font-semibold">{repName}</div>
            <div className="text-[12px] text-[#8D95A3]">{companyName}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nome do representante">
            <Input value={repName} onChange={(e) => setRepName(e.target.value)} />
          </Field>
          <Field label="Empresa / Razão social">
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </Field>
        </div>
        <Button onClick={saveProfile}>Salvar perfil</Button>
      </Card>

      <Card title="Notificações">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px]">Follow-ups pendentes</div>
              <div className="text-[11.5px] text-[#8D95A3]">Avisar quando um follow-up vencer</div>
            </div>
            <Toggle checked={notifFollowUp} onChange={setNotifFollowUp} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px]">Mensagens de WhatsApp</div>
              <div className="text-[11.5px] text-[#8D95A3]">Avisar sobre novas mensagens de clientes</div>
            </div>
            <Toggle checked={notifWhatsapp} onChange={setNotifWhatsapp} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px]">Mudança de status de pedidos</div>
              <div className="text-[11.5px] text-[#8D95A3]">Avisar quando um pedido mudar de status</div>
            </div>
            <Toggle checked={notifOrders} onChange={setNotifOrders} />
          </div>
        </div>
      </Card>

      <Card title="Aplicativo (PWA)">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[#E2963C]/15 text-[#E2963C]"><Smartphone size={17} /></div>
          <div className="text-[12.5px] text-[#8D95A3]">
            Este sistema funciona como aplicativo instalável. No Chrome/Edge, use o ícone de instalação na barra de
            endereço; no celular, use "Adicionar à tela inicial" no menu do navegador. Depois de instalado, funciona
            offline para as telas já visitadas.
          </div>
        </div>
      </Card>

      <Card title="Dados">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={() => {
            const data = JSON.stringify(localStorage.getItem('secretario-comercial-store'))
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'secretario-comercial-dados.json'
            a.click()
            URL.revokeObjectURL(url)
          }}>
            <Download size={14} /> Exportar dados
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => confirm('Restaurar dados de demonstração? Isso substitui os dados atuais.') && store.resetDemoData()}>
            <RotateCcw size={14} /> Restaurar dados de demonstração
          </Button>
        </div>
      </Card>
    </div>
  )
}
