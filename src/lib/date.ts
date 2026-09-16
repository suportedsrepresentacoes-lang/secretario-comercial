export function todayISO(): string {
  return new Date().toISOString()
}

export function addDays(date: Date | string, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function daysAgo(date: Date | string): number {
  return daysBetween(date, new Date())
}

export function isToday(date: Date | string): boolean {
  const d = new Date(date)
  const t = new Date()
  return d.toDateString() === t.toDateString()
}

export function isPast(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now()
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export function formatLongDate(date: Date | string = new Date()): string {
  const d = new Date(date)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR')
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatRelativeDay(date: Date | string): string {
  const d = new Date(date)
  const today = new Date()
  if (isSameDay(d, today)) return `Hoje, ${formatTime(d)}`
  const tomorrow = addDays(today, 1)
  if (isSameDay(d, tomorrow)) return `Amanhã, ${formatTime(d)}`
  const yesterday = addDays(today, -1)
  if (isSameDay(d, yesterday)) return `Ontem, ${formatTime(d)}`
  return formatDateTime(d)
}

export function monthLabel(date: Date | string): string {
  const d = new Date(date)
  return `${MONTHS[d.getMonth()].slice(0, 3)}`
}

export function currency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
