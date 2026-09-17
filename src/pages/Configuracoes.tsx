import { useState } from 'react'
import { Download, RotateCcw, Smartphone, Fuel, Star, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Field'
import { initials } from '../lib/format'
import { FUEL_TYPE_LABEL } from '../lib/labels'
import type { FuelType } from '../types'

export default function Configuracoes() {
  const store = useAppStore()
  const [repName, setRepName] = useState(store.repName)
  const [companyName, setCompanyName] = useState(store.companyName)
  const [tipo, setTipo] = useState<FuelType>(store.vehicle.combustivel)
  const [consumo, setConsumo] = useState(String(store.vehicle.consumoKmL))
  const [preco, setPreco] = useState(String(store.vehicle.precoLitro))

  function saveProfile() {
    store.updateProfile({ repName, companyName })
  }

  function saveVehicle() {
    store.updateVehicle({ combustivel: tipo, consumoKmL: consumo === '' ? 0 : Number(consumo), precoLitro: preco === '' ? 0 : Number(preco) })
  }

  function exportData() {
    const data = localStorage.getItem('campovista-store') ?? '{}'
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'campovista-dados.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-[20px] font-bold">Configurações</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">Perfil, veículo, locais favoritos e dados do aplicativo</p>
      </div>

      <Card title="Perfil">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16A34A] text-[14px] font-bold text-white">{initials(repName)}</div>
          <div>
            <div className="text-[14px] font-semibold">{repName}</div>
            <div className="text-[12px] text-[#6B7F93]">{companyName}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nome do representante"><Input value={repName} onChange={(e) => setRepName(e.target.value)} /></Field>
          <Field label="Empresa / Razão social"><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
        </div>
        <Button onClick={saveProfile}>Salvar perfil</Button>
      </Card>

      <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Fuel size={14} /> Meu veículo</span>}>
        <p className="mb-3 text-[12.5px] text-[#6B7F93]">Usado como ponto de partida ao criar uma nova rota. Cada rota permite ajustar esses valores individualmente.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Combustível">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as FuelType)}>
              {Object.entries(FUEL_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Consumo médio (km/L)"><Input type="number" step="0.1" value={consumo} onChange={(e) => setConsumo(e.target.value)} /></Field>
          <Field label="Preço do combustível (R$/L)"><Input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} /></Field>
        </div>
        <Button onClick={saveVehicle}>Salvar veículo</Button>
      </Card>

      <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Star size={14} /> Locais favoritos</span>}>
        <p className="mb-3 text-[12.5px] text-[#6B7F93]">Salvos em Buscar/Rota ao definir sua localização (ex: casa, escritório). Usados como ponto de partida rápido.</p>
        {store.favorites.length === 0 ? (
          <p className="text-[12.5px] text-[#6B7F93]">Nenhum local favorito salvo ainda.</p>
        ) : (
          <div className="space-y-2">
            {store.favorites.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px]">
                <span className="text-[#0F2A44]">{f.nome}</span>
                <button onClick={() => store.deleteFavorite(f.id)} className="text-[#6B7F93] hover:text-[#EF4444]"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Aplicativo (PWA)">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#3B82F6]/15 text-[#3B82F6]"><Smartphone size={17} /></div>
          <div className="text-[12.5px] text-[#6B7F93]">
            Este aplicativo pode ser instalado no celular ou computador. No Chrome/Edge, use o ícone de instalação na barra de
            endereço; no celular, use "Adicionar à tela inicial" no menu do navegador. Depois de instalado, funciona
            offline para as telas já visitadas.
          </div>
        </div>
      </Card>

      <Card title="Dados">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={exportData}><Download size={14} /> Exportar dados</Button>
          <Button variant="danger" className="flex-1" onClick={() => confirm('Restaurar dados de demonstração? Isso substitui os dados atuais.') && store.resetDemoData()}>
            <RotateCcw size={14} /> Restaurar dados de demonstração
          </Button>
        </div>
      </Card>
    </div>
  )
}
