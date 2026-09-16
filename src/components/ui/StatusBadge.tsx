import { STATUS_COLOR, STATUS_LABEL } from '../../lib/ui'
import type { ClientStatus } from '../../types'

export default function StatusBadge({ status }: { status: ClientStatus }) {
  const color = STATUS_COLOR[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ borderColor: `${color}55`, background: `${color}1A`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {STATUS_LABEL[status]}
    </span>
  )
}
