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
    default: 'text-[#F2F0EA]',
    accent: 'text-[#E2963C]',
    teal: 'text-[#3FA9A0]',
    danger: 'text-[#D9695F]',
  }
  return (
    <div
      className={`flex flex-col justify-between rounded-md border border-[#2A313D] bg-[#1A1F27] p-5 ${
        size === 'lg' ? 'lg:row-span-2' : ''
      }`}
    >
      <span className="text-[13px] tracking-normal text-[#8D95A3]">{label}</span>
      <div className="mt-6">
        <div className={`truncate font-semibold ${size === 'lg' ? 'text-[22px] sm:text-[26px] lg:text-[28px]' : 'text-[24px] sm:text-[28px]'} ${toneMap[tone]}`}>
          {value}
        </div>
        {sub && <div className="mt-1 text-[12px] text-[#8D95A3]">{sub}</div>}
      </div>
    </div>
  )
}
