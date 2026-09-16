import { Search, Bell, Mic, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { initials } from '../../lib/ui'
import { isPast, isToday } from '../../lib/date'

export default function Topbar({ onMenuClick, title }: { onMenuClick: () => void; title?: string }) {
  const navigate = useNavigate()
  const { clients, orders, industries, products, followUps, repName } = useAppStore()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const followUpsDue = followUps.filter(
    (f) => (f.status === 'pendente' || f.status === 'atrasado') && (isToday(f.dataAgendada) || isPast(f.dataAgendada)),
  ).length

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const clientMatches = clients
      .filter((c) => (c.nomeFantasia ?? c.razaoSocial).toLowerCase().includes(q) || c.cnpj.includes(q))
      .slice(0, 4)
      .map((c) => ({ type: 'Cliente', label: c.nomeFantasia ?? c.razaoSocial, to: `/clientes?id=${c.id}` }))
    const orderMatches = orders
      .filter((o) => o.numero.toLowerCase().includes(q))
      .slice(0, 3)
      .map((o) => ({ type: 'Pedido', label: o.numero, to: `/pedidos?id=${o.id}` }))
    const industryMatches = industries
      .filter((i) => i.nome.toLowerCase().includes(q))
      .slice(0, 3)
      .map((i) => ({ type: 'Indústria', label: i.nome, to: `/industrias?id=${i.id}` }))
    const productMatches = products
      .filter((p) => p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 3)
      .map((p) => ({ type: 'Produto', label: p.nome, to: `/produtos?id=${p.id}` }))
    return [...clientMatches, ...orderMatches, ...industryMatches, ...productMatches]
  }, [query, clients, orders, industries, products])

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
            placeholder="Buscar cliente, pedido, indústria…"
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
        <button
          onClick={() => navigate('/ia')}
          className="flex items-center gap-2 rounded-[6px] border border-[#3FA9A0]/40 bg-[#3FA9A0]/10 px-2.5 py-2 text-[12.5px] font-medium text-[#3FA9A0] sm:px-3"
        >
          <Mic size={14} />
          <span className="hidden sm:inline">Perguntar à IA</span>
        </button>
        <button onClick={() => navigate('/follow-ups')} className="relative text-[#8D95A3]">
          <Bell size={18} />
          {followUpsDue > 0 && (
            <span className="mono absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E2963C] px-1 text-[9px] font-bold text-[#12151B]">
              {followUpsDue}
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
