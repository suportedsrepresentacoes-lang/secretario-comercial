export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ borderColor: `${color}55`, background: `${color}1A`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

export function Tag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#DCEAFB] px-2 py-0.5 text-[11px] text-[#0F2A44]">
      {label}
      {onRemove && (
        <button onClick={onRemove} className="text-[#6B7F93] hover:text-[#EF4444]">
          ×
        </button>
      )}
    </span>
  )
}
