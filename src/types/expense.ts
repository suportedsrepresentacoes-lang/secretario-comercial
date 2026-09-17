export type ExpenseCategory = 'combustivel' | 'pedagio' | 'estacionamento' | 'alimentacao' | 'hospedagem' | 'outros'

export interface Expense {
  id: string
  data: string
  categoria: ExpenseCategory
  valor: number
  descricao: string
  clientId?: string
}
