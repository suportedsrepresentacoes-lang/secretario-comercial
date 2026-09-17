import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const baseClass =
  'w-full rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#0F2A44] placeholder:text-[#93A5BC] outline-none focus:border-[#3B82F6]/60'

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">{children}</label>
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseClass} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${baseClass} resize-none ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseClass} ${props.className ?? ''}`} />
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
