import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Compass, Route, Bookmark, Users, Settings, ChevronDown, Route as LogoIcon } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { initials } from '../../lib/ui'

const TABS = [
  { label: 'Buscar', icon: Compass, to: '/' },
  { label: 'Rota', icon: Route, to: '/rotas' },
  { label: 'Salvas', icon: Bookmark, to: '/salvas' },
]

const MORE_LINKS = [
  { label: 'Clientes', icon: Users, to: '/clientes' },
  { label: 'Configurações', icon: Settings, to: '/configuracoes' },
]

function TabLink({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Compass; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors ${
          isActive ? 'bg-[#3B82F6] text-[#FFFFFF] shadow-sm' : 'text-[#5A5346] hover:bg-[#F3EEE3]'
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
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#E4DCC8] bg-[#FFFFFF] px-4 py-3 sm:px-6">
        <button onClick={() => navigate('/')} className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#3B82F6]">
            <LogoIcon size={18} className="text-[#FFFFFF]" strokeWidth={2.5} />
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-[14px] font-bold text-[#2B2620]">Secretário Comercial</div>
            <div className="text-[11px] text-[#8F8676]">Prospecção &amp; Roteirização</div>
          </div>
        </button>

        <nav className="hidden items-center gap-1 rounded-full border border-[#E4DCC8] bg-[#F7F4EE] p-1 sm:flex">
          {TABS.map((t) => (
            <TabLink key={t.to} to={t.to} label={t.label} icon={t.icon} end={t.to === '/'} />
          ))}
        </nav>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-[#E4DCC8] py-1 pl-1 pr-2.5 hover:bg-[#F3EEE3]"
          >
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#3FA9A0] text-[11px] font-bold text-[#FFFFFF]">
              {initials(repName)}
              {emAndamento && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#FFFFFF] bg-[#3B82F6]" />}
            </span>
            <ChevronDown size={14} className="hidden text-[#8F8676] sm:block" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-[10px] border border-[#E4DCC8] bg-[#FFFFFF] shadow-lg">
                <div className="border-b border-[#ECE5D6] px-3.5 py-3">
                  <div className="text-[13px] font-semibold text-[#2B2620]">{repName}</div>
                  <div className="text-[11.5px] text-[#8F8676]">{companyName}</div>
                </div>
                {MORE_LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] ${isActive ? 'bg-[#F3EEE3] text-[#2B2620]' : 'text-[#5A5346] hover:bg-[#F3EEE3]'}`
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

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-[#E4DCC8] bg-[#FFFFFF] sm:hidden">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-[#3B82F6]' : 'text-[#8F8676]'}`
            }
          >
            <t.icon size={19} />
            {t.label}
          </NavLink>
        ))}
        <button
          onClick={() => navigate('/clientes')}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-[#8F8676]"
        >
          <Users size={19} />
          Mais
        </button>
      </nav>
    </>
  )
}
