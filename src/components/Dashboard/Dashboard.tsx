import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Transaction, Budget } from '../../types'
import { TRANSACTION_CATEGORIES } from '../../types'
import { AddTransactionDialog } from '../Transactions/AddTransactionDialog'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Award,
  Sparkles,
  Plus,
  ArrowRight,
  Clipboard,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Link } from 'react-router-dom'

export const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  
  // SMS Parser state
  const [smsText, setSmsText] = useState('')
  const [parseSuccess, setParseSuccess] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch transactions
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })

    // Fetch budgets for current month
    const d = new Date()
    const currentMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
    
    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', currentMonth)

    setTransactions(txData || [])
    setBudgets(budgetData || [])
    setLoading(false)
  }

  // Aggregate Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const balance = totalIncome - totalExpense

  // Calculate Streak
  const calculateStreak = () => {
    if (transactions.length === 0) return 0
    
    const dates = Array.from(new Set(transactions.map((t) => t.date))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )

    const todayStr = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const hasLoggedToday = dates[0] === todayStr
    const hasLoggedYesterday = dates[0] === yesterdayStr || dates[1] === yesterdayStr
    
    if (!hasLoggedToday && !hasLoggedYesterday) return 0

    let streak = 1
    let currentDate = new Date(dates[0])

    for (let i = 1; i < dates.length; i++) {
      const nextDate = new Date(dates[i])
      const diffTime = Math.abs(currentDate.getTime() - nextDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        streak++
        currentDate = nextDate
      } else if (diffDays > 1) {
        break
      }
    }

    return streak
  }

  const streak = calculateStreak()

  // rule-based Client-Side Insights Engine
  const generateInsights = () => {
    const list: string[] = []
    const d = new Date()
    const currentMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`

    const startDate = `${currentMonth}-01`
    const thisMonthExpenses = transactions
      .filter((t) => t.type === 'expense' && t.date >= startDate)
      .reduce((acc, curr) => acc + curr.amount, 0)

    const overallBudget = budgets.find((b) => b.category === null)
    if (overallBudget) {
      const percentUsed = (thisMonthExpenses / overallBudget.limit_amount) * 100
      if (percentUsed >= 90) {
        list.push(`Critical: You have consumed ${percentUsed.toFixed(0)}% of your monthly budget (₹${thisMonthExpenses.toLocaleString()} / ₹${overallBudget.limit_amount.toLocaleString()}). Stop non-essential shopping!`)
      } else if (percentUsed >= 75) {
        list.push(`Warning: You have used ${percentUsed.toFixed(0)}% of your total budget. ${overallBudget.limit_amount - thisMonthExpenses} remaining.`)
      }
    }

    budgets
      .filter((b) => b.category !== null)
      .forEach((cb) => {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.category === cb.category && t.date >= startDate)
          .reduce((acc, curr) => acc + curr.amount, 0)
        
        const pct = (spent / cb.limit_amount) * 100
        if (pct >= 90) {
          list.push(`Alert: Category "${cb.category}" has reached limit: ₹${spent} / ₹${cb.limit_amount}.`)
        }
      })

    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100
      if (savingsRate > 30) {
        list.push(`Great job! You have saved ${savingsRate.toFixed(0)}% of your stipend/allowance this period. Keep it up!`)
      } else if (savingsRate < 10 && savingsRate >= 0) {
        list.push(`Caution: Your savings rate is low (${savingsRate.toFixed(0)}%). Consider cutting down on eating out or shopping.`)
      } else if (savingsRate < 0) {
        list.push(`Warning: You spent more than you earned by ₹${Math.abs(totalIncome - totalExpense).toLocaleString()}. Check your budgets!`)
      }
    }

    if (streak >= 7) {
      list.push(`Award: Incredible! You are on a ${streak}-day tracking streak. You are building highly disciplined habits.`)
    } else if (streak > 0 && streak < 7) {
      list.push(`Keep it going: You have a ${streak}-day logging streak. Log tomorrow to unlock your weekly streak badge!`)
    } else {
      list.push(`Tip: Log your first transaction today to start your tracking streak!`)
    }

    return list.slice(0, 3)
  }

  const insights = generateInsights()

  // UPI SMS Text Parser
  const handleParseSMS = async (e: React.FormEvent) => {
    e.preventDefault()
    setParseError(null)
    setParseSuccess(null)
    setParsing(true)

    if (!smsText.trim()) {
      setParseError('Please paste some text first')
      setParsing(false)
      return
    }

    const amountRegex = /(?:rs\.?|inr|amt|debited|spent|value)\s*([\d,]+(?:\.\d{2})?)/i
    const merchantRegex = /(?:to|at|transfer\s+to|spent\s+at)\s+([a-z0-9\s&._-]+?)(?:\s+on|\s+ref|\s+via|\s+date|\s+using|\.|$)/i
    
    let type: 'income' | 'expense' = 'expense'
    if (
      smsText.toLowerCase().includes('credited') ||
      smsText.toLowerCase().includes('received') ||
      smsText.toLowerCase().includes('added')
    ) {
      type = 'income'
    }

    const amtMatch = smsText.match(amountRegex)
    const merchantMatch = smsText.match(merchantRegex)

    const parsedAmount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null
    let parsedMerchant = merchantMatch ? merchantMatch[1].trim() : 'UPI Payment'
    
    if (parsedMerchant.length > 30) parsedMerchant = parsedMerchant.substring(0, 30) + '...'

    if (!parsedAmount || isNaN(parsedAmount)) {
      setParseError('Could not auto-extract amount. Please log manually.')
      setParsing(false)
      return
    }

    let category = type === 'income' ? TRANSACTION_CATEGORIES.income[0] : TRANSACTION_CATEGORIES.expense[0]
    const textLower = smsText.toLowerCase()
    
    if (type === 'expense') {
      if (textLower.includes('food') || textLower.includes('restaurant') || textLower.includes('canteen') || textLower.includes('zomato') || textLower.includes('swiggy') || textLower.includes('cafe')) {
        category = 'Food & Drinks'
      } else if (textLower.includes('metro') || textLower.includes('uber') || textLower.includes('ola') || textLower.includes('fuel') || textLower.includes('petrol') || textLower.includes('cab')) {
        category = 'Transport/Fuel'
      } else if (textLower.includes('hostel') || textLower.includes('rent') || textLower.includes('pg')) {
        category = 'Hostel/Rent'
      } else if (textLower.includes('jio') || textLower.includes('airtel') || textLower.includes('recharge') || textLower.includes('internet') || textLower.includes('wifi')) {
        category = 'Mobile Recharge/Internet'
      } else if (textLower.includes('movie') || textLower.includes('netflix') || textLower.includes('ticket') || textLower.includes('show')) {
        category = 'Entertainment & Movies'
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setParseError('Authentication required')
      setParsing(false)
      return
    }

    const { data, error: writeError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          type,
          category,
          amount: parsedAmount,
          date: new Date().toISOString().split('T')[0],
          merchant: parsedMerchant,
          payment_method: 'UPI (Google Pay/PhonePe/Paytm)',
          notes: 'Auto-parsed from SMS alert: "' + smsText.substring(0, 40) + '..."'
        }
      ])
      .select()

    if (writeError) {
      setParseError(writeError.message)
    } else if (data && data[0]) {
      setParseSuccess(`Successfully logged ${type === 'income' ? 'Income' : 'Expense'} of ₹${parsedAmount} at "${parsedMerchant}" under "${category}"!`)
      setSmsText('')
      fetchDashboardData()
    }
    setParsing(false)
  }

  const recentTxs = transactions.slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">Here's your real-time financial snapshot.</p>
        </div>
        <button
          onClick={() => setQuickAddOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          Quick Add Expense
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Loading dashboard statistics...</p>
        </div>
      ) : (
        <>
          {/* Streak Indicator Alert */}
          {streak > 0 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">You have a {streak}-Day Logging Streak!</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">Keep logging daily to build responsible habits and earn student badges.</p>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Net Balance</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className={`text-3xl font-extrabold mt-3 font-heading ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2">All recorded income minus expenses</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500">
              <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Income</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-3xl font-extrabold mt-3 text-slate-900 dark:text-white font-heading">
                ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2">Scholarships, stipends & allowances</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-rose-500">
              <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Expenses</span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-3xl font-extrabold mt-3 text-slate-900 dark:text-white font-heading">
                ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2">Food, hostel, transit, entertainment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Insights & SMS Parser */}
            <div className="lg:col-span-2 space-y-6">
              {/* Rule-Based Insights Card */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  Financial Insights
                </h3>
                {insights.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-zinc-400">No comparative spend metrics computed. Log transactions to enable.</p>
                ) : (
                  <div className="space-y-3">
                    {insights.map((insight, idx) => {
                      const isAlert = insight.startsWith('Alert') || insight.startsWith('Critical')
                      const isWarning = insight.startsWith('Warning') || insight.startsWith('Caution')
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                            isAlert
                              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
                              : isWarning
                              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isAlert || isWarning ? (
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          ) : (
                            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                          )}
                          <p>{insight}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* UPI Copy-Paste Parser Card */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                    <Clipboard className="w-5 h-5 text-emerald-500" />
                    UPI / SMS Fast Logger
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    Paste your debited/credited SMS text alert here to log transactions instantly.
                  </p>
                </div>

                {parseError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    {parseError}
                  </div>
                )}

                {parseSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {parseSuccess}
                  </div>
                )}

                <form onSubmit={handleParseSMS} className="space-y-3">
                  <textarea
                    rows={2}
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    placeholder="e.g. Paid Rs.120 to Canteen via UPI Ref 623912..."
                    className="w-full px-4 py-3 rounded-xl outline-none glass-input text-xs resize-none"
                  />
                  <button
                    type="submit"
                    disabled={parsing}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    {parsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Logging...
                      </>
                    ) : (
                      'Extract & Log Transaction'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Recent Activity Sidebar */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col h-fit">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 font-heading">Recent Activity</h3>
              {recentTxs.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 dark:text-zinc-400 flex-1">
                  No transaction activity logged.
                </div>
              ) : (
                <div className="space-y-3.5 flex-1">
                  {recentTxs.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center text-xs py-1">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{tx.category}</p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">{tx.date}</p>
                      </div>
                      <span
                        className={`font-black ${
                          tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-zinc-200'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} ₹
                        {tx.amount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  ))}

                  <Link
                    to="/transactions"
                    className="pt-4 border-t border-slate-200 dark:border-white/5 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center justify-center gap-1"
                  >
                    View All Transactions <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Transaction Dialog Modal */}
      <AddTransactionDialog
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          setQuickAddOpen(false)
          fetchDashboardData()
        }}
      />
    </div>
  )
}
