import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Settings, User, Moon, Sun, Save, Loader2 } from 'lucide-react'

const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' }
]

export const Preferences: React.FC = () => {
  const { user } = useAuth()
  const [fullName, setFullName] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })
  
  // Notification states
  const [notifyWeekly, setNotifyWeekly] = useState(true)
  const [notifyBudget, setNotifyBudget] = useState(true)
  const [notifyStreak, setNotifyStreak] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchProfileData()
  }, [user])

  const fetchProfileData = async () => {
    if (!user) return
    setLoading(true)
    setErrorMsg(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error(error)
        setErrorMsg('Failed to load profile settings.')
      } else if (data) {
        setFullName(data.full_name || user.user_metadata?.full_name || '')
        setCurrency(data.currency || 'INR')
      } else {
        // Auto-create missing profile row
        const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
        setFullName(defaultName)
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: defaultName,
          currency: 'INR'
        })
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    // 1. Upsert Profile Table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        currency: currency
      })

    // 2. Update User Metadata
    const { error: metaError } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    })

    if (profileError || metaError) {
      setErrorMsg(profileError?.message || metaError?.message || 'Failed to update preferences')
    } else {
      setSuccessMsg('Preferences saved successfully!')
      fetchProfileData()
    }
    setSaving(false)
  }

  // Toggle Dark Mode natively
  const toggleTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setTheme('dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setTheme('light')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-heading text-slate-900 dark:text-white">Preferences & Settings</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Manage display theme, preferred currency symbol, and account details</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Loading settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Account & Profile Details */}
            <div className="glass-panel p-6 rounded-2xl space-y-5">
              <h3 className="text-base font-bold flex items-center gap-2 font-heading text-slate-900 dark:text-white">
                <User className="w-5 h-5 text-emerald-500" /> Account Profile
              </h3>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Arjun Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl outline-none glass-input text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                      Preferred Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl outline-none glass-input text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {c.symbol} — {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-2.5 rounded-xl text-slate-500 dark:text-zinc-400 outline-none bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-5 rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Preferences
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Email Notifications triggers */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2 font-heading text-slate-900 dark:text-white">
                <Settings className="w-5 h-5 text-emerald-500" /> Email Notifications
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer border border-slate-200 dark:border-white/5">
                  <input
                    type="checkbox"
                    checked={notifyWeekly}
                    onChange={(e) => setNotifyWeekly(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Weekly Summary Report</h5>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">Receive a weekly breakdown of spent amounts vs allowance</p>
                  </div>
                </label>

                <label className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer border border-slate-200 dark:border-white/5">
                  <input
                    type="checkbox"
                    checked={notifyBudget}
                    onChange={(e) => setNotifyBudget(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Monthly Budget Alert</h5>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">Get notified when hitting 75% or exceeding budget targets</p>
                  </div>
                </label>

                <label className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer border border-slate-200 dark:border-white/5">
                  <input
                    type="checkbox"
                    checked={notifyStreak}
                    onChange={(e) => setNotifyStreak(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Logging Streak Milestones</h5>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">Unlock custom achievement badges for daily check-ins</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Theme controls sidebar */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">Display Theme</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Choose your preferred visual appearance.</p>
              
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => toggleTheme('light')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold transition-all ${
                    theme === 'light'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Sun className="w-6 h-6 mb-2 text-amber-500" />
                  Light Mode
                </button>

                <button
                  type="button"
                  onClick={() => toggleTheme('dark')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold transition-all ${
                    theme === 'dark'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Moon className="w-6 h-6 mb-2 text-indigo-500 dark:text-indigo-400" />
                  Dark Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
