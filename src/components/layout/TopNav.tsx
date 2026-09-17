import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Compass, Route, Bookmark, Users, Wallet, Settings, ChevronDown, Route as LogoIcon } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { initials } from '../../lib/ui'

const TABS = [
  { label: 'Início', icon: Home, to: '/' },
  { label: 'Buscar', icon: Compass, to: '/buscar' },
  { label: 'Rota', icon: Route, to: '/rotas' },
  { label: 'Clientes', icon: Users, to: '/clientes' },
]

const MORE_LINKS = [
  { label: 'Salvas', icon: Bookmark, to: '/salvas' },
  { label: 'Despesas', icon: Wallet, to: '/despesas' },
  { label: 'Configurações', icon: Settings, to: '/configuracoes' },
]

function TabLink({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Compass; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors ${
          isActive ? 'bg-[#3B82F6] text-[#FFFFFF] shadow-sm' : 'text-[#33495E] hover:bg-[#EAF3FC]'
        }`
      }
    >
      <Icon size={15} />
      {label}
    </NavLink>
  )
}

export default function TopNav() {
  const navigate = useNavigate()
  const { repName, companyName, routes } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const emAndamento = routes.some((r) => r.status === 'em_andamento')

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#CFE0F5] bg-[#FFFFFF] px-4 py-3 sm:px-6">
        <button onClick={() => navigate('/')} className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#3B82F6]">
            <LogoIcon size={18} className="text-[#FFFFFF]" strokeWidth={2.5} />
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-[14px] font-bold text-[#0F2A44]">Secretário Comercial</div>
            <div className="text-[11px] text-[#6B7F93]">O copiloto do representante na rua</div>
          </div>
        </button>

        <nav className="hidden items-center gap-1 rounded-full border border-[#CFE0F5] bg-[#F2F7FD] p-1 sm:flex">
          {TABS.map((t) => (
            <TabLink key={t.to} to={t.to} label={t.label} icon={t.icon} end={t.to === '/'} />
          ))}
        </nav>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-[#CFE0F5] py-1 pl-1 pr-2.5 hover:bg-[#EAF3FC]"
          >
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#16A34A] text-[11px] font-bold text-[#FFFFFF]">
              {initials(repName)}
              {emAndamento && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#FFFFFF] bg-[#3B82F6]" />}
            </span>
            <ChevronDown size={14} className="hidden text-[#6B7F93] sm:block" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-[10px] border border-[#CFE0F5] bg-[#FFFFFF] shadow-lg">
                <div className="border-b border-[#E1EDFB] px-3.5 py-3">
                  <div className="text-[13px] font-semibold text-[#0F2A44]">{repName}</div>
                  <div className="text-[11.5px] text-[#6B7F93]">{companyName}</div>
                </div>
                {MORE_LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] ${isActive ? 'bg-[#EAF3FC] text-[#0F2A44]' : 'text-[#33495E] hover:bg-[#EAF3FC]'}`
                    }
                  >
                    <l.icon size={15} />
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-[#CFE0F5] bg-[#FFFFFF] sm:hidden">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-[#3B82F6]' : 'text-[#6B7F93]'}`
            }
          >
            <t.icon size={19} />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
