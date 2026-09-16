import {
  LayoutGrid, Users, Map, Route, Calendar, ClipboardList, Kanban,
  MessageCircle, Sparkles, BellRing, ShoppingCart, Package, Factory,
  Wallet, Receipt, FileBarChart, Settings, X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { initials } from '../../lib/ui'
import { isPast, isToday } from '../../lib/date'

const NAV = [
  { label: 'Dashboard', icon: LayoutGrid, to: '/' },
  { label: 'Clientes', icon: Users, to: '/clientes' },
  { label: 'Mapa', icon: Map, to: '/mapa' },
  { label: 'Rotas', icon: Route, to: '/rotas' },
  { label: 'Agenda', icon: Calendar, to: '/agenda' },
  { label: 'Visitas', icon: ClipboardList, to: '/visitas' },
  { label: 'CRM / Funil', icon: Kanban, to: '/crm' },
  { label: 'WhatsApp', icon: MessageCircle, to: '/whatsapp' },
  { label: 'IA Comercial', icon: Sparkles, to: '/ia' },
  { label: 'Follow-ups', icon: BellRing, to: '/follow-ups' },
  { label: 'Pedidos', icon: ShoppingCart, to: '/pedidos' },
  { label: 'Produtos', icon: Package, to: '/produtos' },
  { label: 'Indústrias', icon: Factory, to: '/industrias' },
  { label: 'Comissões', icon: Wallet, to: '/comissoes' },
  { label: 'Despesas', icon: Receipt, to: '/despesas' },
  { label: 'Relatórios', icon: FileBarChart, to: '/relatorios' },
  { label: 'Configurações', icon: Settings, to: '/configuracoes' },
]

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { repName, companyName, followUps, conversations } = useAppStore()

  const followUpsDue = followUps.filter(
    (f) => (f.status === 'pendente' || f.status === 'atrasado') && (isToday(f.dataAgendada) || isPast(f.dataAgendada)),
  ).length
  const unread = conversations.reduce((s, c) => s + c.naoLidas, 0)

  const badges: Record<string, number> = {
    'Follow-ups': followUpsDue,
    WhatsApp: unread,
  }

  return (
    <aside className="flex h-full w-[236px] shrink-0 flex-col border-r border-[#2A313D] bg-[#0F1218]">
      <div className="flex items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#E2963C]">
            <Route size={17} className="text-[#12151B]" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-bold">Secretário</div>
            <div className="-mt-0.5 text-[14px] font-bold">Comercial</div>
          </div>
        </div>
        <button className="text-[#8D95A3] md:hidden" onClick={onNavigate} aria-label="Fechar menu">
          <X size={18} />
        </button>
      </div>

      <nav className="mt-2 flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map(({ label, icon: Icon, to }) => {
          const badge = badges[label]
          return (
            <NavLink
              key={label}
              to={to}
              end={to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `mb-0.5 flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left text-[13.5px] transition-colors ${
                  isActive
                    ? 'bg-[#1E2530] text-[#F2F0EA]'
                    : 'text-[#8D95A3] hover:bg-[#171C24] hover:text-[#C7CCD6]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16.5} strokeWidth={2} className={isActive ? 'text-[#E2963C]' : ''} />
                  <span className="flex-1">{label}</span>
                  {!!badge && (
                    <span className="mono rounded-full bg-[#E2963C] px-1.5 py-0.5 text-[10px] font-medium text-[#12151B]">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <NavLink
        to="/configuracoes"
        onClick={onNavigate}
        className="flex items-center gap-2.5 border-t border-[#2A313D] px-5 py-4 hover:bg-[#171C24]"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3FA9A0] text-[12px] font-bold text-[#0F1218]">
          {initials(repName)}
        </div>
        <div className="leading-tight">
          <div className="text-[12.5px] font-semibold">{repName}</div>
          <div className="text-[11px] text-[#8D95A3]">{companyName}</div>
        </div>
      </NavLink>
    </aside>
  )
}
