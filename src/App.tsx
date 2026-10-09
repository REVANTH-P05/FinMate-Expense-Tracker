import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './components/Auth/Login'
import { Register } from './components/Auth/Register'
import { ForgotPassword } from './components/Auth/ForgotPassword'
import { ResetPassword } from './components/Auth/ResetPassword'
import { Verify } from './components/Auth/Verify'
import { Shell } from './components/Layout/Shell'
import { TransactionList } from './components/Transactions/TransactionList'
import { BudgetPlanner } from './components/Budgets/BudgetPlanner'
import { Dashboard } from './components/Dashboard/Dashboard'
import { ChartsView } from './components/Analytics/ChartsView'
import { ExportPanel } from './components/Reports/ExportPanel'
import { Preferences } from './components/Settings/Preferences'
import { ArrowRight, Sparkles, TrendingUp, Shield, Smartphone, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-xs font-medium tracking-wide">Securing session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Modern Public Landing Page
const LandingPage = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col relative overflow-hidden bg-mesh-pattern">
      {/* Background Lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white font-heading">FinMate</span>
        </div>
        <div>
          {user ? (
            <Link
              to="/dashboard"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs tracking-wide transition-all inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/15"
            >
              Go to Dashboard <ArrowUpRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-zinc-300 hover:text-white font-semibold text-xs px-4 py-2.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Built for College Students
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-white font-heading">
          Take full control of your <br className="hidden sm:inline" />
          <span className="text-gradient-emerald">student monthly allowance</span>
        </h1>
        <p className="text-zinc-400 text-base md:text-lg mt-6 max-w-2xl leading-relaxed">
          FinMate helps college students track daily expenses, manage category budgets, copy-paste transaction SMS, and build smart financial discipline.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
          <Link
            to={user ? "/dashboard" : "/register"}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-7 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm flex items-center justify-center gap-2"
          >
            Start Tracking Free <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-semibold py-3.5 px-7 rounded-xl transition-all text-sm flex items-center justify-center"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 py-20 relative z-10 border-t border-white/5">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white font-heading">Everything college finance demands</h2>
          <p className="text-zinc-400 text-sm mt-2">Zero bloated corporate features. Pure student focus.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-7 rounded-2xl space-y-3.5 transition-all">
            <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-heading">Smart Budget Caps</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">Set monthly limits for food, books, transport, and outings. Get alerts before exceeding limits.</p>
          </div>
          <div className="glass-card p-7 rounded-2xl space-y-3.5 transition-all">
            <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-heading">UPI / SMS Auto Parser</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">Copy bank debited SMS text and paste into FinMate to log amount, vendor, and date in one click.</p>
          </div>
          <div className="glass-card p-7 rounded-2xl space-y-3.5 transition-all">
            <div className="w-11 h-11 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-heading">Row-Level Security</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">Encrypted Supabase auth ensuring only your account reads your financial data. No third-party data tracking.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-500 mt-auto">
        <p>&copy; {new Date().getFullYear()} FinMate. Made with care for students everywhere.</p>
      </footer>
    </div>
  )
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/auth/callback" element={<Verify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Dashboard/App Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Shell>
                  <Dashboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Shell>
                  <TransactionList />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/budgets"
            element={
              <ProtectedRoute>
                <Shell>
                  <BudgetPlanner />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Shell>
                  <ChartsView />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Shell>
                  <ExportPanel />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Shell>
                  <Preferences />
                </Shell>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
