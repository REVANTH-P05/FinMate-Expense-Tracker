import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Transaction } from '../../types'
import { FileText, Download, Loader2, Calendar, DollarSign } from 'lucide-react'

export const ExportPanel: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selection States
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [selectedPeriod, setSelectedPeriod] = useState('')

  useEffect(() => {
    fetchReportTransactions()
  }, [])

  useEffect(() => {
    const d = new Date()
    if (reportType === 'monthly') {
      setSelectedPeriod(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`)
    } else if (reportType === 'yearly') {
      setSelectedPeriod(`${d.getFullYear()}`)
    } else {
      const first = d.getDate() - d.getDay()
      const start = new Date(d.setDate(first))
      setSelectedPeriod(start.toISOString().split('T')[0])
    }
  }, [reportType])

  const fetchReportTransactions = async () => {
    setLoading(true)
    setError(null)
    const { data, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })

    if (txError) {
      console.error(txError)
      setError('Could not fetch report transactions')
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }

  const getFilteredTransactions = () => {
    if (!selectedPeriod) return []

    return transactions.filter((tx) => {
      if (reportType === 'monthly') {
        return tx.date.startsWith(selectedPeriod)
      } else if (reportType === 'yearly') {
        return tx.date.startsWith(selectedPeriod)
      } else {
        const startDate = new Date(selectedPeriod)
        const endDate = new Date(selectedPeriod)
        endDate.setDate(endDate.getDate() + 7)
        const txDate = new Date(tx.date)
        return txDate >= startDate && txDate < endDate
      }
    })
  }

  const reportTxs = getFilteredTransactions()

  const incomeSum = reportTxs
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const expenseSum = reportTxs
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const savings = incomeSum - expenseSum

  const categorySummaryMap = reportTxs.reduce((acc, tx) => {
    const key = `${tx.type}-${tx.category}`
    if (!acc[key]) {
      acc[key] = { category: tx.category, type: tx.type, amount: 0, count: 0 }
    }
    acc[key].amount += tx.amount
    acc[key].count += 1
    return acc
  }, {} as Record<string, { category: string; type: string; amount: number; count: number }>)

  const categorySummaryList = Object.values(categorySummaryMap).sort((a, b) => b.amount - a.amount)

  const handleExportCSV = () => {
    if (reportTxs.length === 0) return

    const headers = ['Date', 'Type', 'Category', 'Amount (INR)', 'Merchant', 'Payment Method', 'Notes', 'Tags']
    
    const rows = reportTxs.map((tx) => [
      tx.date,
      tx.type,
      tx.category,
      tx.amount,
      tx.merchant || '',
      tx.payment_method,
      tx.notes || '',
      tx.tags ? tx.tags.join(';') : ''
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `FinMate_${reportType}_report_${selectedPeriod}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading text-slate-900 dark:text-white">Reports</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">Export spreadsheets and inspect cashflow breakdowns</p>
        </div>

        {reportTxs.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Report Controls Panel */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl shrink-0 border border-slate-200 dark:border-white/10">
          {(['weekly', 'monthly', 'yearly'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setReportType(type)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                reportType === type
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-500 shrink-0" />
          {reportType === 'weekly' && (
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider">Start Week Date</label>
              <input
                type="date"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full max-w-xs px-4 py-2 rounded-xl outline-none glass-input text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          )}
          {reportType === 'monthly' && (
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider">Month</label>
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full max-w-xs px-4 py-2 rounded-xl outline-none glass-input text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          )}
          {reportType === 'yearly' && (
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider">Year</label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full max-w-xs px-4 py-2 rounded-xl outline-none glass-input text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Collating ledger entries...</p>
        </div>
      ) : reportTxs.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center">
          <p className="text-slate-500 dark:text-zinc-400 text-sm">No transactions recorded for the selected period.</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Try selecting a different week, month, or year.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Summary Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Net Savings
              </span>
              <h3 className={`text-3xl font-extrabold font-heading mt-3 ${savings >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                ₹{savings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2">Income minus expenses in range</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider block">Period Income</span>
              <h3 className="text-2xl font-extrabold font-heading mt-2 text-emerald-600 dark:text-emerald-400">
                + ₹{incomeSum.toLocaleString('en-IN')}
              </h3>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider block">Period Expenses</span>
              <h3 className="text-2xl font-extrabold font-heading mt-2 text-slate-900 dark:text-white">
                - ₹{expenseSum.toLocaleString('en-IN')}
              </h3>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              Category Breakdown Table
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 font-bold uppercase">
                    <th className="pb-3 text-left">Category</th>
                    <th className="pb-3 text-center">Type</th>
                    <th className="pb-3 text-center">Transactions</th>
                    <th className="pb-3 text-right">Sum</th>
                  </tr>
                </thead>
                <tbody>
                  {categorySummaryList.map((item, index) => (
                    <tr key={index} className="border-b border-slate-200 dark:border-white/5 last:border-b-0 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{item.category}</td>
                      <td className="py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          item.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 text-center text-slate-500 dark:text-zinc-400 font-semibold">{item.count}</td>
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
