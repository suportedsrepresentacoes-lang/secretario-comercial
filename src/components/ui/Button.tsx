import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-[#3B82F6] text-white hover:bg-[#1D4ED8] font-semibold',
  secondary: 'border border-[#CFE0F5] bg-[#EAF3FC] text-[#0F2A44] hover:bg-[#DCEAFB]',
  ghost: 'text-[#6B7F93] hover:bg-[#EAF3FC] hover:text-[#0F2A44]',
  danger: 'border border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] px-3.5 py-2 text-[13px] transition-colors disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
    />
  )
}
