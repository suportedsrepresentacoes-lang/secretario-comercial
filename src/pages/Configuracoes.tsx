import { useState } from 'react'
import { Download, RotateCcw, Smartphone, Fuel } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import { Button, Field, Input, Select } from '../components/ui/Field'
import { initials } from '../lib/ui'
import type { FuelType } from '../types'

const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
  eletrico: 'Elétrico',
}

export default function Configuracoes() {
  const store = useAppStore()
  const [repName, setRepName] = useState(store.repName)
  const [companyName, setCompanyName] = useState(store.companyName)
  const [tipo, setTipo] = useState<FuelType>(store.fuelDefaults.tipo)
  const [consumo, setConsumo] = useState(String(store.fuelDefaults.consumoKmL))
  const [preco, setPreco] = useState(String(store.fuelDefaults.precoLitro))

  function saveProfile() {
    useAppStore.setState({ repName, companyName })
  }

  function saveFuel() {
    store.updateFuelDefaults({
      tipo,
      consumoKmL: consumo === '' ? 0 : Number(consumo),
      precoLitro: preco === '' ? 0 : Number(preco),
    })
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-[20px] font-bold">Configurações</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">Perfil, combustível e preferências do sistema</p>
      </div>

      <Card title="Perfil">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16A34A] text-[14px] font-bold text-[#0F2A44]">{initials(repName)}</div>
          <div>
            <div className="text-[14px] font-semibold">{repName}</div>
            <div className="text-[12px] text-[#6B7F93]">{companyName}</div>
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

      <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Fuel size={14} /> Meu veículo</span>}>
        <p className="mb-3 text-[12.5px] text-[#6B7F93]">
          Usado como ponto de partida ao criar uma nova rota. Cada rota permite ajustar esses valores individualmente.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Combustível">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as FuelType)}>
              {Object.entries(FUEL_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Consumo médio (km/L)">
            <Input type="number" step="0.1" value={consumo} onChange={(e) => setConsumo(e.target.value)} />
          </Field>
          <Field label="Preço do combustível (R$/L)">
            <Input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} />
          </Field>
        </div>
        <Button onClick={saveFuel}>Salvar veículo</Button>
      </Card>

      <Card title="Aplicativo (PWA)">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[#3B82F6]/15 text-[#3B82F6]"><Smartphone size={17} /></div>
          <div className="text-[12.5px] text-[#6B7F93]">
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
