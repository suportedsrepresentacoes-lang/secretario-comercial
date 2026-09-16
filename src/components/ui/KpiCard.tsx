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
    default: 'text-[#2B2620]',
    accent: 'text-[#E2963C]',
    teal: 'text-[#3FA9A0]',
    danger: 'text-[#D9695F]',
  }
  return (
    <div
      className={`flex flex-col justify-between rounded-md border border-[#E4DCC8] bg-[#FFFFFF] p-5 ${
        size === 'lg' ? 'lg:row-span-2' : ''
      }`}
    >
      <span className="text-[13px] tracking-normal text-[#8F8676]">{label}</span>
      <div className="mt-6">
        <div className={`truncate font-semibold ${size === 'lg' ? 'text-[22px] sm:text-[26px] lg:text-[28px]' : 'text-[24px] sm:text-[28px]'} ${toneMap[tone]}`}>
          {value}
        </div>
        {sub && <div className="mt-1 text-[12px] text-[#8F8676]">{sub}</div>}
      </div>
    </div>
  )
}
