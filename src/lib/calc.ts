import type { Order } from '../types'

export function orderTotal(order: Order): number {
  return order.itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0)
}

export function orderCommission(order: Order): number {
  return orderTotal(order) * (order.comissaoPercentual / 100)
}

export function isSameMonth(date: string | Date, ref: Date = new Date()): boolean {
  const d = new Date(date)
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
}
