import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Transaction, TransactionType } from '../../types'
import { TRANSACTION_CATEGORIES, PAYMENT_METHODS } from '../../types'
import { X, Loader2 } from 'lucide-react'

interface AddTransactionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newTx: Transaction, isUndo?: boolean) => void
  editingTransaction?: Transaction | null
}

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingTransaction
}) => {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [merchant, setMerchant] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[1]) // Default to UPI
  const [notes, setNotes] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type)
      setAmount(editingTransaction.amount.toString())
      setCategory(editingTransaction.category)
      setDate(editingTransaction.date)
      setMerchant(editingTransaction.merchant || '')
      setPaymentMethod(editingTransaction.payment_method)
      setNotes(editingTransaction.notes || '')
      setTagsInput(editingTransaction.tags?.join(', ') || '')
    } else {
      setType('expense')
      setAmount('')
      setCategory(TRANSACTION_CATEGORIES.expense[0])
      setDate(new Date().toISOString().split('T')[0])
      setMerchant('')
      setPaymentMethod(PAYMENT_METHODS[1])
      setNotes('')
      setTagsInput('')
    }
  }, [editingTransaction, isOpen])

  useEffect(() => {
    if (!editingTransaction) {
      setCategory(TRANSACTION_CATEGORIES[type][0])
    }
  }, [type, editingTransaction])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to record transactions')
      setLoading(false)
      return
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const transactionData = {
      user_id: user.id,
      type,
      amount: numAmount,
      category,
      date,
      merchant: merchant || null,
      payment_method: paymentMethod,
      notes: notes || null,
      tags
    }

    let query
    if (editingTransaction) {
      query = supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', editingTransaction.id)
        .select()
    } else {
      query = supabase
        .from('transactions')
        .insert([transactionData])
        .select()
    }

    const { data, error: submitError } = await query

    if (submitError) {
      setError(submitError.message)
      setLoading(false)
    } else if (data && data[0]) {
      onSuccess(data[0] as Transaction)
      setLoading(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white p-6 rounded-2xl shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-extrabold font-heading mb-6 text-slate-900 dark:text-white">
          {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggle Type */}
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:border-emerald-500 transition-all"
              >
                {TRANSACTION_CATEGORIES[type].map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:border-emerald-500 transition-all"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Merchant */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                Merchant / Payee
              </label>
              <input
                type="text"
                placeholder="e.g. Campus Canteen"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. food, college, treat"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Add optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs resize-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 text-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              editingTransaction ? 'Update Transaction' : 'Add Transaction'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
