export type TransactionType = 'income' | 'expense'

export interface Profile {
  id: string
  full_name: string
  avatar_url: string
  currency: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  category: string
  amount: number
  date: string
  merchant?: string
  notes?: string
  payment_method: string
  tags?: string[]
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  month: string // YYYY-MM
  category: string | null // null means overall budget
  limit_amount: number
  created_at: string
}

export const TRANSACTION_CATEGORIES = {
  income: ['Allowance/Pocket Money', 'Internship Stipend', 'Scholarship', 'Freelancing', 'Part-time Job', 'Gifts', 'Others'],
  expense: ['Food & Drinks', 'Hostel/Rent', 'Transport/Fuel', 'College Fees & Supplies', 'Shopping & Apparel', 'Entertainment & Movies', 'Mobile Recharge/Internet', 'Medical & Health', 'Others']
}

export const PAYMENT_METHODS = ['Cash', 'UPI (Google Pay/PhonePe/Paytm)', 'Debit Card', 'Net Banking', 'Others']
