import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import type { Transaction } from '../../types'
import { TRANSACTION_CATEGORIES, PAYMENT_METHODS } from '../../types'
import { AddTransactionDialog } from './AddTransactionDialog'
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Undo2,
  Calendar,
  CreditCard,
  Plus,
  Loader2
} from 'lucide-react'

export const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date-desc')

  // Client-side Undo Delete state
  const [deletedTx, setDeletedTx] = useState<Transaction | null>(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const deleteTimeoutRef = useRef<any>(null)

  useEffect(() => {
    fetchTransactions()
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    applyFiltersAndSorting()
  }, [transactions, searchQuery, typeFilter, categoryFilter, paymentFilter, sortBy])

  const fetchTransactions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching transactions:', error)
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }

  const applyFiltersAndSorting = () => {
    let result = [...transactions]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (tx) =>
          tx.category.toLowerCase().includes(q) ||
          (tx.merchant && tx.merchant.toLowerCase().includes(q)) ||
          (tx.notes && tx.notes.toLowerCase().includes(q)) ||
          tx.amount.toString().includes(q) ||
          (tx.tags && tx.tags.some((t) => t.toLowerCase().includes(q)))
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter((tx) => tx.type === typeFilter)
    }

    if (categoryFilter !== 'all') {
      result = result.filter((tx) => tx.category === categoryFilter)
    }

    if (paymentFilter !== 'all') {
      result = result.filter((tx) => tx.payment_method === paymentFilter)
    }

    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === 'amount-desc') {
        return b.amount - a.amount
      } else if (sortBy === 'amount-asc') {
        return a.amount - b.amount
      }
      return 0
    })

    setFilteredTransactions(result)
  }

  const handleAddOrEditSuccess = (updatedTx: Transaction) => {
    if (editingTx) {
      setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)))
    } else {
      setTransactions((prev) => [updatedTx, ...prev])
    }
    setEditingTx(null)
  }

  const handleDeleteClick = (tx: Transaction) => {
    if (deletedTx) {
      executePermanentDelete(deletedTx.id)
    }

    setTransactions((prev) => prev.filter((t) => t.id !== tx.id))
    setDeletedTx(tx)
    setShowUndoToast(true)

    deleteTimeoutRef.current = setTimeout(() => {
      executePermanentDelete(tx.id)
      setShowUndoToast(false)
      setDeletedTx(null)
    }, 5000)
  }

  const executePermanentDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      console.error('Failed to permanently delete transaction:', error.message)
      fetchTransactions()
    }
  }

  const handleUndoDelete = () => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current)
    }
    if (deletedTx) {
      setTransactions((prev) => [deletedTx, ...prev])
    }
    setShowUndoToast(false)
    setDeletedTx(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">Review, log, and filter your daily cashflow</p>
        </div>
        <button
          onClick={() => {
            setEditingTx(null)
            setDialogOpen(true)
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search category, merchant, tag, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl outline-none glass-input text-xs"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none glass-input text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none glass-input text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="date-desc">Newest Date</option>
              <option value="date-asc">Oldest Date</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-xl outline-none glass-input text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              <optgroup label="Expenses">
                {TRANSACTION_CATEGORIES.expense.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
              <optgroup label="Income">
                {TRANSACTION_CATEGORIES.income.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Payment Method</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-xl outline-none glass-input text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Undo Toast Alert */}
      {showUndoToast && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel bg-emerald-500/10 border border-emerald-500/30 px-6 py-4 rounded-xl flex items-center justify-between gap-6 shadow-2xl">
          <div className="text-xs font-semibold text-slate-900 dark:text-white">
            Transaction deleted. Permanent in 5 seconds...
          </div>
          <button
            onClick={handleUndoDelete}
            className="flex items-center gap-1 bg-emerald-500 text-slate-950 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-emerald-600 transition-colors uppercase tracking-wider"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
        </div>
      )}

      {/* Transaction List Cards */}
      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Retrieving cashflow logs...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center">
          <p className="text-slate-500 dark:text-zinc-400 text-sm">No records found matching filters.</p>
          <button
            onClick={() => {
              setEditingTx(null)
              setDialogOpen(true)
            }}
            className="mt-4 inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:underline"
          >
            Add your first transaction <Plus className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className={`glass-panel p-5 rounded-2xl border-l-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:scale-[1.002] transition-transform ${
                tx.type === 'income' ? 'border-l-emerald-500' : 'border-l-rose-500'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{tx.category}</span>
                  {tx.merchant && (
                    <span className="text-xs text-slate-500 dark:text-zinc-400">@ {tx.merchant}</span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 font-semibold inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {tx.date}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 font-semibold inline-flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> {tx.payment_method}
                  </span>
                </div>
                {tx.notes && <p className="text-xs text-slate-500 dark:text-zinc-400">{tx.notes}</p>}
                {tx.tags && tx.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tx.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <span
                  className={`text-lg font-extrabold font-heading ${
                    tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'} ₹
                  {tx.amount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTx(tx)
                      setDialogOpen(true)
                    }}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(tx)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog Modal */}
      <AddTransactionDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingTx(null)
        }}
        onSuccess={handleAddOrEditSuccess}
        editingTransaction={editingTx}
      />
    </div>
  )
}
