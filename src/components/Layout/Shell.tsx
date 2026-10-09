import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  ArrowUpDown,
  PieChart,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  FileText,
  DollarSign,
  Plus,
  Sparkles
} from 'lucide-react'

interface ShellProps {
  children: React.ReactNode
  onQuickAddOpen?: () => void
}

export const Shell: React.FC<ShellProps> = ({ children, onQuickAddOpen }) => {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowUpDown },
    { name: 'Budgets', href: '/budgets', icon: DollarSign },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getInitials = () => {
    const fullName = user?.user_metadata?.full_name || ''
    if (!fullName) return user?.email?.substring(0, 2).toUpperCase() || 'U'
    return fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-zinc-100 flex flex-col md:flex-row relative transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-200 dark:border-white/5 h-screen sticky top-0 p-6 z-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white font-heading">FinMate</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 -mt-1">Student Hub</span>
          </div>
        </div>

        {/* Quick Add Button */}
        {onQuickAddOpen && (
          <button
            onClick={onQuickAddOpen}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2 mb-6 hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <Plus className="w-4 h-4" />
            Quick Add Log
          </button>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User profile details and Signout */}
        <div className="border-t border-slate-200 dark:border-white/5 pt-6 mt-auto">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
            <div className="w-9 h-9 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center text-xs font-bold border border-emerald-500/30">
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-900 dark:text-white">
                {user?.user_metadata?.full_name || 'FinMate User'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 glass-panel border-b border-slate-200 dark:border-white/5 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-slate-950" />
          </div>
          <span className="font-extrabold text-lg text-slate-900 dark:text-white font-heading">FinMate</span>
        </div>
        <div className="flex items-center gap-3">
          {onQuickAddOpen && (
            <button
              onClick={onQuickAddOpen}
              className="bg-emerald-500 hover:bg-emerald-600 p-2 rounded-lg text-slate-950 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] bg-slate-50/95 dark:bg-[#07090e]/95 backdrop-blur-xl z-20 flex flex-col p-6">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-slate-200 dark:border-white/5 pt-6 mt-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm font-bold">
                {getInitials()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {user?.user_metadata?.full_name || 'FinMate User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto h-[calc(100vh-65px)] md:h-screen">
        {children}
      </main>
    </div>
  )
}
