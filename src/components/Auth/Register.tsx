import React, { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { User, Mail, Lock, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured) {
      setError("Supabase URL and Anon Key are missing or invalid. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`,
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) {
        if (error.message.toLowerCase().includes('failed to fetch')) {
          setError("Failed to connect to Supabase. Please verify your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.")
        } else {
          setError(error.message)
        }
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setFullName('')
      }
    } catch (err: any) {
      setError("Failed to connect to Supabase backend. Please check your internet connection or .env configuration.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#07090e] text-zinc-100 relative overflow-hidden bg-mesh-pattern">
      {/* Dynamic ambient lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 border border-white/10 shadow-2xl transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
            <Sparkles className="text-slate-950 w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-heading">Create Account</h2>
          <p className="text-xs font-medium text-zinc-400 mt-1">Join FinMate to master student finances</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white font-heading">Check your email!</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              We've sent a verification link to your email address. Please open your inbox and click the verification link to complete your signup and enter FinMate.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
              >
                Go to Sign In page
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder="Arjun Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none glass-input text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  type="email"
                  required
                  placeholder="arjun@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none glass-input text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Password
              </label>
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

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none glass-input text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
