import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAppStore } from '../../store/useAppStore'

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/clientes': 'Clientes',
  '/mapa': 'Mapa',
  '/rotas': 'Rotas',
  '/agenda': 'Agenda',
  '/visitas': 'Visitas',
  '/crm': 'CRM / Funil',
  '/whatsapp': 'WhatsApp',
  '/ia': 'IA Comercial',
  '/follow-ups': 'Follow-ups',
  '/pedidos': 'Pedidos',
  '/produtos': 'Produtos',
  '/industrias': 'Indústrias',
  '/comissoes': 'Comissões',
  '/despesas': 'Despesas',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const refreshOverdueFollowUps = useAppStore((s) => s.refreshOverdueFollowUps)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    refreshOverdueFollowUps()
  }, [refreshOverdueFollowUps])

  return (
    <div
      className="flex h-dvh w-full overflow-hidden bg-[#12151B] text-[#F2F0EA]"
      style={{ fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} title={TITLES[location.pathname]} />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
