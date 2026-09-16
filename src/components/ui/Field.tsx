import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes } from 'react'

const base =
  'w-full rounded-[6px] border border-[#2A313D] bg-[#171C24] px-3 py-2 text-[13px] text-[#F2F0EA] placeholder:text-[#5C6472] outline-none focus:border-[#E2963C]/60'

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-medium text-[#8D95A3]">{children}</label>
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
  primary: 'bg-[#E2963C] text-[#12151B] hover:bg-[#eda458] font-semibold',
  secondary: 'border border-[#2A313D] bg-[#171C24] text-[#F2F0EA] hover:bg-[#1E2530]',
  ghost: 'text-[#8D95A3] hover:bg-[#171C24] hover:text-[#F2F0EA]',
  danger: 'border border-[#D9695F]/40 bg-[#D9695F]/10 text-[#D9695F] hover:bg-[#D9695F]/20',
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
