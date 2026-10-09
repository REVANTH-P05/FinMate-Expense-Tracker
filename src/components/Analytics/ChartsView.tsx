import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Transaction } from '../../types'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts'
import {
  TrendingUp,
  Loader2,
  DollarSign,
  Calendar,
  Wallet
} from 'lucide-react'

// Premium colors for Category slices
const COLORS = [
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#64748B'  // Slate
]

export const ChartsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    setError(null)
    const { data, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: true })

    if (txError) {
      console.error(txError)
      setError('Could not download analytics records')
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }

  const expenses = transactions.filter((t) => t.type === 'expense')
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0)
  
  const categoryData = Object.entries(
    expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const getDailyTrendData = () => {
    const dailyMap: Record<string, number> = {}
    
    expenses.forEach((tx) => {
      dailyMap[tx.date] = (dailyMap[tx.date] || 0) + tx.amount
    })

    return Object.entries(dailyMap)
      .map(([date, amount]) => ({
        date: date.substring(5),
        amount
      }))
      .slice(-15)
  }

  const dailyTrendData = getDailyTrendData()

  const getIncomeVsExpenseData = () => {
    const monthlyMap: Record<string, { income: number; expense: number }> = {}

    transactions.forEach((tx) => {
      const monthKey = tx.date.substring(0, 7)
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expense: 0 }
      }
      if (tx.type === 'income') {
        monthlyMap[monthKey].income += tx.amount
      } else {
        monthlyMap[monthKey].expense += tx.amount
      }
    })

    return Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense
    }))
  }

  const comparisonData = getIncomeVsExpenseData()

  const largestTx = expenses.length > 0 
    ? [...expenses].sort((a, b) => b.amount - a.amount)[0] 
    : null

  const getHighestSpendingCategory = () => {
    if (categoryData.length === 0) return 'N/A'
    return [...categoryData].sort((a, b) => b.value - a.value)[0].name
  }

  const getDailyAverage = () => {
    if (expenses.length === 0) return 0
    const uniqueDates = new Set(expenses.map((tx) => tx.date)).size
    return uniqueDates > 0 ? totalExpense / uniqueDates : 0
  }

  const getMostUsedPaymentMethod = () => {
    if (expenses.length === 0) return 'N/A'
    const counts = expenses.reduce((acc, curr) => {
      acc[curr.payment_method] = (acc[curr.payment_method] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-heading text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">Interactive visualizations of your university budget patterns</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Parsing financial datasets...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center">
          <p className="text-slate-500 dark:text-zinc-400 text-sm">Not enough data to calculate graphs.</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Please log income or expenses in the transactions tab first.</p>
        </div>
      ) : (
        <>
          {/* Key Analytics Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Top Category
              </span>
              <h4 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-2 truncate">
                {getHighestSpendingCategory()}
              </h4>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Daily Avg Expense
              </span>
              <h4 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-2">
                ₹{getDailyAverage().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h4>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Biggest Expense
              </span>
              <h4 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-2 truncate">
                {largestTx ? `₹${largestTx.amount.toLocaleString()} (${largestTx.category})` : 'N/A'}
              </h4>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" /> Main Payment Method
              </span>
              <h4 className="text-lg font-bold font-heading text-slate-900 dark:text-white mt-2 truncate">
                {getMostUsedPaymentMethod()}
              </h4>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category distribution (Pie Chart) */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-[400px]">
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">Expense Distribution</h3>
              <div className="flex-1 w-full relative">
                {categoryData.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 dark:text-zinc-400">
                    No expense data.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={85}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Daily trend area chart */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-[400px]">
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">Spending Velocity (Last 15 Days)</h3>
              <div className="flex-1 w-full mt-4">
                {dailyTrendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-zinc-400">
                    No expense history.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={dailyTrendData}>
                      <defs>
                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="amount" stroke="#10B981" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Income vs Expenses side-by-side comparison */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-[400px] lg:col-span-2">
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">Income vs Expense Comparison</h3>
              <div className="flex-1 w-full mt-4">
                {comparisonData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-zinc-400">
                    No cashflow compared yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Income" />
                      <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expense" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
