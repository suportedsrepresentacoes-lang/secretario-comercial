export default function KpiCard({
  label,
  value,
  sub,
  tone = 'default',
  size = 'md',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'accent' | 'teal' | 'danger'
  size?: 'md' | 'lg'
}) {
  const toneMap = {
    default: 'text-[#0F2A44]',
    accent: 'text-[#3B82F6]',
    teal: 'text-[#16A34A]',
    danger: 'text-[#EF4444]',
  }
  return (
    <div
      className={`flex flex-col justify-between rounded-md border border-[#CFE0F5] bg-[#FFFFFF] p-5 ${
        size === 'lg' ? 'lg:row-span-2' : ''
      }`}
    >
      <span className="text-[13px] tracking-normal text-[#6B7F93]">{label}</span>
      <div className="mt-6">
        <div className={`truncate font-semibold ${size === 'lg' ? 'text-[22px] sm:text-[26px] lg:text-[28px]' : 'text-[24px] sm:text-[28px]'} ${toneMap[tone]}`}>
          {value}
        </div>
        {sub && <div className="mt-1 text-[12px] text-[#6B7F93]">{sub}</div>}
      </div>
    </div>
  )
}
