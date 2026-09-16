import { Search, Bell, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { initials } from '../../lib/ui'

export default function Topbar({ onMenuClick, title }: { onMenuClick: () => void; title?: string }) {
  const navigate = useNavigate()
  const { clients, routes, repName } = useAppStore()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const emAndamento = routes.filter((r) => r.status === 'em_andamento').length

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const clientMatches = clients
      .filter((c) => (c.nomeFantasia ?? c.razaoSocial).toLowerCase().includes(q) || c.cnpj.includes(q))
      .slice(0, 5)
      .map((c) => ({ type: 'Cliente', label: c.nomeFantasia ?? c.razaoSocial, to: `/clientes?id=${c.id}` }))
    const routeMatches = routes
      .filter((r) => r.nome.toLowerCase().includes(q))
      .slice(0, 5)
      .map((r) => ({ type: 'Rota', label: r.nome, to: `/rotas?id=${r.id}` }))
    return [...clientMatches, ...routeMatches]
  }, [query, clients, routes])

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[#2A313D] px-4 py-3 sm:px-7 sm:py-4">
      <button className="text-[#8D95A3] md:hidden" onClick={onMenuClick} aria-label="Abrir menu">
        <Menu size={20} />
      </button>

      <div className="relative hidden flex-1 sm:block sm:max-w-[320px]">
        <div className="flex items-center gap-2 rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[13px] text-[#8D95A3]">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Buscar cliente ou rota…"
            className="w-full bg-transparent text-[#F2F0EA] outline-none placeholder:text-[#8D95A3]"
          />
        </div>
        {focused && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-[6px] border border-[#2A313D] bg-[#1A1F27] shadow-xl">
            {results.map((r, i) => (
              <button
                key={i}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-[#1E2530]"
                onMouseDown={() => {
                  navigate(r.to)
                  setQuery('')
                }}
              >
                <span className="text-[#F2F0EA]">{r.label}</span>
                <span className="text-[11px] text-[#8D95A3]">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {title && <div className="flex-1 text-[15px] font-semibold sm:hidden">{title}</div>}

      <div className="flex items-center gap-2.5 sm:gap-4">
        <button onClick={() => navigate('/rotas')} className="relative text-[#8D95A3]">
          <Bell size={18} />
          {emAndamento > 0 && (
            <span className="mono absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E2963C] px-1 text-[9px] font-bold text-[#12151B]">
              {emAndamento}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/configuracoes')}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2A313D] text-[11px] font-bold text-[#F2F0EA]"
        >
          {initials(repName)}
        </button>
      </div>
    </header>
  )
}
