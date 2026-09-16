import type { ReactNode } from 'react'

export default function Card({
  children,
  className = '',
  title,
  action,
}: {
  children: ReactNode
  className?: string
  title?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={`rounded-md border border-[#2A313D] bg-[#1A1F27] p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {typeof title === 'string' ? (
            <span className="text-[13px] font-medium text-[#C7CCD6]">{title}</span>
          ) : (
            title
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
