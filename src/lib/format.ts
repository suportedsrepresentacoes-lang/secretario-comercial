export function currency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date: string): string {
  const d = new Date(date)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function daysAgo(date: string): number {
  const ms = Date.now() - new Date(date).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function isToday(date: string): boolean {
  return new Date(date).toDateString() === new Date().toDateString()
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
