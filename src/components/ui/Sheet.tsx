import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex h-full w-full flex-col border-l border-[#CFE0F5] bg-white shadow-2xl sm:w-auto" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between border-b border-[#CFE0F5] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#0F2A44]">{title}</h2>
          <button onClick={onClose} className="rounded-[6px] p-1.5 text-[#6B7F93] hover:bg-[#DCEAFB] hover:text-[#0F2A44]">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-[#CFE0F5] px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
