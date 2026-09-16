import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes } from 'react'

const base =
  'w-full rounded-[6px] border border-[#E4DCC8] bg-[#F3EEE3] px-3 py-2 text-[13px] text-[#2B2620] placeholder:text-[#A69E8E] outline-none focus:border-[#E2963C]/60'

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-medium text-[#8F8676]">{children}</label>
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
  primary: 'bg-[#E2963C] text-[#2B2620] hover:bg-[#CB8636] font-semibold',
  secondary: 'border border-[#E4DCC8] bg-[#F3EEE3] text-[#2B2620] hover:bg-[#ECE3D2]',
  ghost: 'text-[#8F8676] hover:bg-[#F3EEE3] hover:text-[#2B2620]',
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
