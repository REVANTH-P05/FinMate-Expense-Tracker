import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Lock, Mail, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if user arrived via email verification redirect
    const searchParams = new URLSearchParams(location.search)
    const isVerified = searchParams.get('verified') === 'true'
    const isHashVerified = location.hash.includes('access_token') || location.hash.includes('type=signup') || location.hash.includes('type=email_verification')

    if (isVerified || isHashVerified) {
      setVerificationSuccess(true)
    }
  }, [location])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Your email address is not verified yet. Please check your Gmail inbox and click the verification link before signing in.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      const user = data?.user
      if (user && user.email_confirmed_at === null && user.app_metadata?.provider === 'email') {
        await supabase.auth.signOut()
        setError('Please verify your email address via the link sent to your inbox before logging in.')
        setLoading(false)
        return
      }
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#07090e] text-zinc-100 relative overflow-hidden bg-mesh-pattern">
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 border border-white/10 shadow-2xl transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
            <Sparkles className="text-slate-950 w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-heading">Welcome Back</h2>
          <p className="text-xs font-medium text-zinc-400 mt-1">Sign in to track & manage your student budget</p>
        </div>

        {verificationSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2.5 leading-relaxed">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>Email verified successfully! You can now sign in to your FinMate account.</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="email"
                required
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none glass-input text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none glass-input text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
