import type { LucideIcon } from 'lucide-react'

export function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon?: LucideIcon
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
      {Icon && <Icon size={15} className="mb-1.5 text-[#3B82F6]" />}
      <div className="text-[18px] font-bold text-[#0F2A44]">{value}</div>
      <div className="text-[11px] text-[#6B7F93]">{label}</div>
      {sub && <div className="mt-0.5 text-[10.5px] text-[#93A5BC]">{sub}</div>}
    </div>
  )
}

export function KpiCard({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'accent' | 'success' | 'danger' }) {
  const toneClass: Record<string, string> = {
    default: 'text-[#0F2A44]',
    accent: 'text-[#3B82F6]',
    success: 'text-[#16A34A]',
    danger: 'text-[#EF4444]',
  }
  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#CFE0F5] bg-white p-5">
      <span className="text-[13px] text-[#6B7F93]">{label}</span>
      <div className="mt-6">
        <div className={`truncate text-[24px] font-semibold sm:text-[28px] ${toneClass[tone]}`}>{value}</div>
        {sub && <div className="mt-1 text-[12px] text-[#6B7F93]">{sub}</div>}
      </div>
    </div>
  )
}
