import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes } from 'react'

const base =
  'w-full rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#0F2A44] placeholder:text-[#93A5BC] outline-none focus:border-[#3B82F6]/60'

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">{children}</label>
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} resize-none ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ''}`} />
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#3B82F6] text-[#0F2A44] hover:bg-[#2563EB] font-semibold',
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
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] px-3.5 py-2 text-[13px] transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  )
}
