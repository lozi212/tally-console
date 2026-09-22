export const STATUSES = [
  'succeeded',
  'pending',
  'failed',
  'partially_refunded',
  'refunded',
] as const

export const METHODS = ['card', 'wallet', 'bank_transfer'] as const

export type Status = (typeof STATUSES)[number]
export type Method = (typeof METHODS)[number]

export interface LineItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface Customer {
  name: string
  email: string
}

export interface Transaction {
  id: string
  reference: string
  customer: Customer
  amount: number
  refundedAmount: number
  currency: 'ETB'
  status: Status
  method: Method
  createdAt: string
  /** Detail endpoint only — the list endpoint strips this field. */
  items?: LineItem[]
}

/** A row as returned by GET /api/transactions, which never includes `items`. */
export type TransactionListRow = Omit<Transaction, 'items'>

export interface User {
  id: string
  name: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ApiErrorBody {
  message: string
}

/** Statuses the server will accept a refund against (see mocks/handlers.js). */
export const REFUNDABLE_STATUSES: readonly Status[] = ['succeeded', 'partially_refunded']

export function isRefundable(status: Status): boolean {
  return REFUNDABLE_STATUSES.includes(status)
}
