import { useMemo } from 'react'
import { CalendarCheck, Gauge, Fuel, Wallet, UserPlus, Users, RotateCcw } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { KpiCard } from '../components/ui/StatTile'
import { currency, isToday } from '../lib/format'

export default function Relatorio() {
  const { routes, expenses, clients } = useAppStore()

  const todaysRoutes = useMemo(
    () => routes.filter((r) => (r.iniciadaEm && isToday(r.iniciadaEm)) || (r.finalizadaEm && isToday(r.finalizadaEm))),
    [routes],
  )
  const todaysStops = useMemo(() => todaysRoutes.flatMap((r) => r.paradas), [todaysRoutes])

  const visitasRealizadas = todaysStops.filter((p) => p.status === 'visitado').length
  const visitasNaoRealizadas = todaysStops.filter((p) => p.status === 'nao_visitado').length
  const visitasPendentes = todaysStops.filter((p) => p.status === 'pendente').length
  const retornosNecessarios = todaysStops.filter((p) => p.resultado === 'retornar').length

  const kmPlanejado = Math.round(todaysRoutes.reduce((s, r) => s + r.distanciaKm, 0) * 10) / 10
  const kmReal = todaysRoutes.some((r) => r.kmRealPercorrido != null)
    ? Math.round(todaysRoutes.reduce((s, r) => s + (r.kmRealPercorrido ?? 0), 0) * 10) / 10
    : null

  const combustivelEstimado = todaysRoutes.reduce((s, r) => s + r.combustivel.custoEstimado, 0)

  const todaysExpenses = useMemo(() => expenses.filter((e) => isToday(e.data)), [expenses])
  const combustivelReal = todaysExpenses.filter((e) => e.categoria === 'combustivel').reduce((s, e) => s + e.valor, 0)
  const outrasDespesas = todaysExpenses.filter((e) => e.categoria !== 'combustivel').reduce((s, e) => s + e.valor, 0)
  const custoTotalDia = (combustivelReal || combustivelEstimado) + outrasDespesas

  const prospectsEncontrados = useMemo(() => clients.filter((c) => isToday(c.criadoEm) && c.status === 'prospect').length, [clients])
  const clientesCadastrados = useMemo(() => clients.filter((c) => isToday(c.criadoEm)).length, [clients])

  const hasActivityToday = todaysRoutes.length > 0 || todaysExpenses.length > 0 || clientesCadastrados > 0

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Relatório do Dia</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
      </div>

      {!hasActivityToday ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-2 py-16 text-center">
          <CalendarCheck size={28} className="text-[#3B82F6]" />
          <p className="text-[13.5px] text-[#6B7F93]">Nenhuma atividade registrada hoje ainda. Comece uma rota ou registre uma despesa para ver o resumo aqui.</p>
        </div>
      ) : (
        <>
          <Card className="mb-4" title="Visitas de hoje">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Realizadas" value={String(visitasRealizadas)} tone="success" />
              <KpiCard label="Não realizadas" value={String(visitasNaoRealizadas)} tone="danger" />
              <KpiCard label="Pendentes" value={String(visitasPendentes)} />
              <KpiCard label="Retornos necessários" value={String(retornosNecessarios)} tone="accent" />
            </div>
          </Card>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Gauge size={14} /> Quilometragem</span>}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#6B7F93]">Planejado</span>
                <span className="mono font-medium text-[#0F2A44]">{kmPlanejado} km</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[13px]">
                <span className="text-[#6B7F93]">Realizado</span>
                <span className="mono font-medium text-[#0F2A44]">{kmReal != null ? `${kmReal} km` : '—'}</span>
              </div>
              {kmReal != null && (
                <div className="mt-1.5 flex items-center justify-between border-t border-[#E1EDFB] pt-1.5 text-[12.5px]">
                  <span className="text-[#6B7F93]">Diferença</span>
                  <span className={`mono font-medium ${kmReal > kmPlanejado ? 'text-[#EF4444]' : 'text-[#16A34A]'}`}>{kmReal > kmPlanejado ? '+' : ''}{Math.round((kmReal - kmPlanejado) * 10) / 10} km</span>
                </div>
              )}
            </Card>

            <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Fuel size={14} /> Combustível</span>}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#6B7F93]">Estimado pela rota</span>
                <span className="mono font-medium text-[#0F2A44]">{currency(combustivelEstimado)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[13px]">
                <span className="text-[#6B7F93]">Gasto real (despesas)</span>
                <span className="mono font-medium text-[#0F2A44]">{combustivelReal > 0 ? currency(combustivelReal) : '—'}</span>
              </div>
            </Card>
          </div>

          <Card className="mb-4" title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Wallet size={14} /> Custo da operação hoje</span>}>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#6B7F93]">Outras despesas (pedágio, alimentação, etc.)</span>
              <span className="mono font-medium text-[#0F2A44]">{currency(outrasDespesas)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-[#E1EDFB] pt-2 text-[15px]">
              <span className="font-semibold text-[#33495E]">Custo total do dia</span>
              <span className="mono font-bold text-[#3B82F6]">{currency(custoTotalDia)}</span>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard label="Prospects encontrados" value={String(prospectsEncontrados)} tone="accent" />
            <KpiCard label="Clientes cadastrados" value={String(clientesCadastrados)} />
          </div>

          {(prospectsEncontrados > 0 || clientesCadastrados > 0) && (
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#6B7F93]">
              <UserPlus size={13} /> Continue prospectando para manter o funil de clientes ativo.
            </p>
          )}
          {retornosNecessarios > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#6B7F93]">
              <RotateCcw size={13} /> {retornosNecessarios} cliente{retornosNecessarios > 1 ? 's' : ''} pediu retorno — confira em <Users size={12} className="inline" /> Clientes.
            </p>
          )}
        </>
      )}
    </>
  )
}
