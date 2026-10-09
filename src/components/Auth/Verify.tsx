import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CheckCircle2, Sparkles, ArrowRight, Loader2 } from 'lucide-react'

export const Verify: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Check hash or search params for errors or tokens
        const hash = location.hash
        const search = location.search
        const params = new URLSearchParams(search)

        if (hash.includes('error=') || search.includes('error=')) {
          const errorDesc = params.get('error_description') || 'Verification link expired or invalid.'
          setErrorMessage(decodeURIComponent(errorDesc))
          setVerifying(false)
          return
        }

        // Supabase auto-exchanges hash token or code on session init
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setErrorMessage(error.message)
          setVerifying(false)
          return
        }

        // Verify succeeded or user is logged in
        setSuccess(true)
        setVerifying(false)

        // Auto redirect after 3.5 seconds
        const timer = setTimeout(() => {
          if (session?.user) {
            navigate('/dashboard', { replace: true })
          } else {
            navigate('/login?verified=true', { replace: true })
          }
        }, 3500)

        return () => clearTimeout(timer)
      } catch (err: any) {
        setErrorMessage(err?.message || 'Verification process encountered an unexpected issue.')
        setVerifying(false)
      }
    }

    handleVerification()
  }, [location, navigate])

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#07090e] text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 text-center border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-bounce">
            <Sparkles className="text-white w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">FinMate Email Verification</h2>
          <p className="text-sm text-zinc-400 mt-1">Confirming your account details...</p>
        </div>

        {verifying ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm font-medium text-zinc-300">Validating verification link...</p>
          </div>
        ) : success ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center justify-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>Email verified successfully! Welcome to FinMate.</span>
            </div>

            <p className="text-xs text-zinc-400">
              You will be automatically redirected in a few seconds...
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <Link
                to="/dashboard"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold py-3 px-4 rounded-xl transition-all text-sm"
              >
                Sign In to Account
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
              {errorMessage || 'Verification failed. The link may have expired or already been used.'}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Link
                to="/login"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                Return to Login <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold py-3 px-4 rounded-xl transition-all text-sm"
              >
                Create New Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
