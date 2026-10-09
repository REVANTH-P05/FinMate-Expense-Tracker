import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Budget, Transaction } from '../../types'
import { TRANSACTION_CATEGORIES } from '../../types'
import { Trash2, Loader2, Sparkles, AlertTriangle } from 'lucide-react'

export const BudgetPlanner: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Forms State
  const [totalLimitInput, setTotalLimitInput] = useState('')
  const [categoryLimitInput, setCategoryLimitInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(TRANSACTION_CATEGORIES.expense[0])

  useEffect(() => {
    fetchBudgetData()
  }, [selectedMonth])

  const fetchBudgetData = async () => {
    setLoading(true)
    setError(null)

    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', selectedMonth)

    const startDate = `${selectedMonth}-01`
    const [year, month] = selectedMonth.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${selectedMonth}-${lastDay.toString().padStart(2, '0')}`

    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate)

    if (budgetError || txError) {
      console.error(budgetError || txError)
      setError('Failed to fetch budget metrics')
    } else {
      setBudgets(budgetData || [])
      setTransactions(txData || [])

      const overall = budgetData?.find((b: Budget) => b.category === null)
      setTotalLimitInput(overall ? overall.limit_amount.toString() : '')
    }
    setLoading(false)
  }

  const getSpentForCategory = (catName: string | null) => {
    if (catName === null) {
      return transactions.reduce((acc, curr) => acc + curr.amount, 0)
    }
    return transactions
      .filter((tx) => tx.category === catName)
      .reduce((acc, curr) => acc + curr.amount, 0)
  }

  const handleSetTotalBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const amount = parseFloat(totalLimitInput)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid budget amount')
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Authentication required')
      setSaving(true)
      return
    }

    const existingOverall = budgets.find((b) => b.category === null)
    let query

    if (existingOverall) {
      query = supabase
        .from('budgets')
        .update({ limit_amount: amount })
        .eq('id', existingOverall.id)
        .select()
    } else {
      query = supabase
        .from('budgets')
        .insert([{ user_id: user.id, month: selectedMonth, category: null, limit_amount: amount }])
        .select()
    }

    const { data, error: submitError } = await query
    if (submitError) {
      setError(submitError.message)
    } else if (data && data[0]) {
      setBudgets((prev) => {
        const filtered = prev.filter((b) => b.category !== null)
        return [data[0] as Budget, ...filtered]
      })
    }
    setSaving(false)
  }

  const handleAddCategoryBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const amount = parseFloat(categoryLimitInput)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid category budget limit')
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Authentication required')
      setSaving(false)
      return
    }

    const overall = budgets.find((b) => b.category === null)
    if (overall && amount > overall.limit_amount) {
      setError('Category budget limit cannot exceed the total monthly budget')
      setSaving(false)
      return
    }

    const existingCat = budgets.find((b) => b.category === selectedCategory)
    let query

    if (existingCat) {
      query = supabase
        .from('budgets')
        .update({ limit_amount: amount })
        .eq('id', existingCat.id)
        .select()
    } else {
      query = supabase
        .from('budgets')
        .insert([{ user_id: user.id, month: selectedMonth, category: selectedCategory, limit_amount: amount }])
        .select()
    }

    const { data, error: submitError } = await query
    if (submitError) {
      setError(submitError.message)
    } else if (data && data[0]) {
      setBudgets((prev) => {
        const filtered = prev.filter((b) => b.category !== selectedCategory)
        return [...filtered, data[0] as Budget]
      })
      setCategoryLimitInput('')
    }
    setSaving(false)
  }

  const handleDeleteBudget = async (id: string) => {
    const { error: delError } = await supabase.from('budgets').delete().eq('id', id)
    if (delError) {
      setError(delError.message)
    } else {
      setBudgets((prev) => prev.filter((b) => b.id !== id))
    }
  }

  const totalBudget = budgets.find((b) => b.category === null)
  const totalSpent = getSpentForCategory(null)
  const totalRemaining = totalBudget ? totalBudget.limit_amount - totalSpent : 0
  const totalPercent = totalBudget ? Math.min((totalSpent / totalBudget.limit_amount) * 100, 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading text-slate-900 dark:text-white">Budgets</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">Set spending thresholds and manage allowance caps</p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2.5 rounded-xl outline-none glass-input text-xs font-semibold cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Calculating budget summaries...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-20 h-20 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">Total Monthly Budget ({selectedMonth})</h3>

              {totalBudget ? (
                <div className="mt-4 space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block tracking-wider">Spent</span>
                      <span className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
                        ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block tracking-wider">Limit</span>
                      <span className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
                        ₹{totalBudget.limit_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          totalPercent > 90
                            ? 'bg-rose-500'
                            : totalPercent > 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${totalPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      <span>{totalPercent.toFixed(0)}% used</span>
                      <span className={totalRemaining < 0 ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                        {totalRemaining < 0
                          ? `Over budget by ₹${Math.abs(totalRemaining).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : `₹${totalRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })} remaining`}
                      </span>
                    </div>
                  </div>

                  {totalPercent > 90 && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Warning: You have used over 90% of your total budget for this month!
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteBudget(totalBudget.id)}
                    className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1.5 pt-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Budget Limit
                  </button>
                </div>
              ) : (
                <div className="mt-4 py-8 text-center space-y-4">
                  <p className="text-xs text-slate-500 dark:text-zinc-400">No monthly budget limit has been configured for {selectedMonth}.</p>
                  <form onSubmit={handleSetTotalBudget} className="flex gap-3 max-w-sm mx-auto">
                    <input
                      type="number"
                      required
                      placeholder="Enter limit, e.g. 10000"
                      value={totalLimitInput}
                      onChange={(e) => setTotalLimitInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl outline-none glass-input text-xs"
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-emerald-500 hover:bg-emerald-600 px-5 rounded-xl text-slate-950 font-bold text-xs shadow transition-colors flex items-center gap-1"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />} Set Budget
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Category Limits</h3>
              {budgets.filter((b) => b.category !== null).length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl text-center text-xs text-slate-500 dark:text-zinc-400">
                  No category budget caps configured. Use the form to set caps.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budgets
                    .filter((b) => b.category !== null)
                    .map((cb) => {
                      const spent = getSpentForCategory(cb.category)
                      const percent = Math.min((spent / cb.limit_amount) * 100, 100)
                      const remaining = cb.limit_amount - spent

                      return (
                        <div key={cb.id} className="glass-panel p-5 rounded-2xl space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white">{cb.category}</h4>
                              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block mt-0.5">
                                Spent: ₹{spent.toLocaleString('en-IN')} / ₹{cb.limit_amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteBudget(cb.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  percent > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                              <span>{percent.toFixed(0)}% used</span>
                              <span className={remaining < 0 ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                                {remaining < 0 ? 'Exceeded' : `₹${remaining} left`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {totalBudget && (
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">Adjust Total Budget</h3>
                <form onSubmit={handleSetTotalBudget} className="space-y-3">
                  <input
                    type="number"
                    required
                    placeholder="Enter limit, e.g. 15000"
                    value={totalLimitInput}
                    onChange={(e) => setTotalLimitInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl outline-none glass-input text-xs"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />} Update Limit
                  </button>
                </form>
              </div>
            )}

            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">Add Category Budget</h3>
              <form onSubmit={handleAddCategoryBudget} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl outline-none glass-input text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {TRANSACTION_CATEGORIES.expense.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Limit (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3000"
                    value={categoryLimitInput}
                    onChange={(e) => setCategoryLimitInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl outline-none glass-input text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1.5 pt-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Set Limit
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
