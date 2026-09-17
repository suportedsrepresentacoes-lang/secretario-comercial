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
    <div className={`rounded-md border border-[#CFE0F5] bg-[#FFFFFF] p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {typeof title === 'string' ? (
            <span className="text-[13px] font-medium text-[#33495E]">{title}</span>
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
