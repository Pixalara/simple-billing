import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  
  // VIEW STATES
  const [view, setView] = useState('LOGIN')
  const [loading, setLoading] = useState(false)
  const [otpContext, setOtpContext] = useState('') 
  
  // Form Data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')

  // --- PREMIUM NOTIFICATION STATE ---
  const [toast, setToast] = useState(null) // { message, type: 'success' | 'error' }

  // Helper to show toast
  const showToast = (message, type = 'error') => {
    setToast({ message, type })
    // Auto-hide after 4 seconds
    setTimeout(() => setToast(null), 4000)
  }

  // --- HANDLERS ---

  // 1. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      
      showToast('Welcome back! Redirecting...', 'success')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 2. INITIATE SIGNUP
  const handleSignupStart = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) return showToast("Passwords do not match!", 'error')
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      
      setOtpContext('SIGNUP')
      setView('OTP_VERIFY')
      showToast('6-digit OTP sent to your email!', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 3. INITIATE FORGOT PASSWORD
  const handleForgotStart = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      
      setOtpContext('RECOVERY')
      setView('OTP_VERIFY')
      showToast('Recovery OTP sent to your email!', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 4. VERIFY OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })
      if (error) throw error

      if (otpContext === 'SIGNUP') {
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        
        showToast('Account created! Entering Dashboard...', 'success')
        setTimeout(() => navigate('/dashboard'), 2000)
      } else if (otpContext === 'RECOVERY') {
        setView('RESET_PASS')
        showToast('OTP Verified. Please set a new password.', 'success')
      }
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 5. RESET PASSWORD
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) return showToast("Passwords do not match!", 'error')
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      await supabase.auth.signOut() 
      
      showToast('Password updated! Please log in.', 'success')
      
      // Delay switch to give user time to read success message
      setTimeout(() => {
          setPassword('')
          setConfirmPassword('')
          setView('LOGIN') 
      }, 2000)
      
    } catch (error) {
      if (error.message.includes("different from the old password")) {
          await supabase.auth.signOut()
          showToast("New password cannot be the same as old. Redirecting...", 'error')
          setTimeout(() => {
            setPassword('')
            setConfirmPassword('')
            setView('LOGIN')
          }, 2000)
      } else {
          showToast(error.message, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative" 
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')" }}>
      
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-900/95"></div>

      {/* --- PREMIUM TOAST NOTIFICATION COMPONENT --- */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border animate-bounce-in transition-all duration-300 transform ${
            toast.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' 
            : 'bg-red-500/20 border-red-500/30 text-red-100'
        }`}>
            {/* Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {toast.type === 'success' ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                )}
            </div>
            
            {/* Message */}
            <div>
                <h4 className="font-bold text-sm">{toast.type === 'success' ? 'Success' : 'Error'}</h4>
                <p className="text-xs opacity-90">{toast.message}</p>
            </div>

            {/* Close Button */}
            <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md p-6">
        
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
            
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                    {view === 'LOGIN' && 'Welcome Back'}
                    {view === 'SIGNUP' && 'Create Account'}
                    {view === 'FORGOT_PASS' && 'Reset Password'}
                    {view === 'OTP_VERIFY' && 'Verify OTP'}
                    {view === 'RESET_PASS' && 'New Password'}
                </h2>
                <p className="text-slate-300 text-sm">
                    {view === 'LOGIN' && 'Enter your details to access your dashboard.'}
                    {view === 'SIGNUP' && 'Enter your email and create a password.'}
                    {view === 'FORGOT_PASS' && 'We will send a code to your email.'}
                    {view === 'OTP_VERIFY' && `Enter the code sent to ${email}`}
                    {view === 'RESET_PASS' && 'Create your new strong password.'}
                </p>
            </div>

            {/* --- VIEW: LOGIN --- */}
            {view === 'LOGIN' && (
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 ml-1">Email</label>
                        <input type="email" placeholder="name@company.com" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 ml-1">Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <div className="text-right mt-1">
                            <button type="button" onClick={() => setView('FORGOT_PASS')} className="text-xs text-blue-300 hover:text-white transition-colors">Forgot Password?</button>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] disabled:opacity-70 mt-2">
                        {loading ? 'Processing...' : 'Sign In'}
                    </button>
                    <div className="text-center pt-4">
                        <p className="text-slate-300 text-sm">Don't have an account? <button type="button" onClick={() => setView('SIGNUP')} className="text-blue-400 font-bold hover:underline ml-1">Sign Up</button></p>
                    </div>
                </form>
            )}

            {/* --- VIEW: SIGNUP --- */}
            {view === 'SIGNUP' && (
                <form onSubmit={handleSignupStart} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 ml-1">Email</label>
                        <input type="email" placeholder="name@company.com" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 ml-1">Create Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 ml-1">Re-enter Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] disabled:opacity-70 mt-2">
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                    <div className="text-center pt-4">
                        <p className="text-slate-300 text-sm">Already have an account? <button type="button" onClick={() => setView('LOGIN')} className="text-blue-400 font-bold hover:underline ml-1">Log In</button></p>
                    </div>
                </form>
            )}

            {/* --- VIEW: FORGOT PASSWORD --- */}
            {view === 'FORGOT_PASS' && (
                <form onSubmit={handleForgotStart} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 ml-1">Registered Email</label>
                        <input type="email" placeholder="name@company.com" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] disabled:opacity-70 mt-2">
                        {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                    <div className="text-center pt-4">
                        <button type="button" onClick={() => setView('LOGIN')} className="text-slate-400 text-sm hover:text-white">← Back to Login</button>
                    </div>
                </form>
            )}

            {/* --- VIEW: OTP VERIFY --- */}
            {view === 'OTP_VERIFY' && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 ml-1">One Time Password</label>
                        <input 
                            type="text" 
                            placeholder="000000" 
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none tracking-[0.5em] text-center text-2xl font-mono placeholder-slate-600"
                            value={otp} 
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 6) setOtp(val);
                            }} 
                            required 
                            maxLength={6}
                        />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] disabled:opacity-70 mt-2">
                        {loading ? 'Verifying...' : 'Verify & Proceed'}
                    </button>
                    <div className="text-center pt-4">
                        <button type="button" onClick={() => setView('LOGIN')} className="text-slate-400 text-sm hover:text-white">Cancel</button>
                    </div>
                </form>
            )}

            {/* --- VIEW: RESET PASSWORD --- */}
            {view === 'RESET_PASS' && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 ml-1">New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 ml-1">Confirm New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] disabled:opacity-70 mt-2">
                        {loading ? 'Updating...' : 'Set New Password'}
                    </button>
                    <div className="text-center pt-4">
                        <button type="button" onClick={() => { supabase.auth.signOut(); setView('LOGIN'); }} className="text-slate-400 text-sm hover:text-white">Cancel / Back to Login</button>
                    </div>
                </form>
            )}

        </div>
        
        <div className="w-full text-center z-20 py-4">
            <p className="text-[11px] text-slate-400 opacity-60">
                Powered by <a href="https://pixalara.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors underline">pixalara.com</a>
            </p>
        </div>

      </div>
    </div>
  )
}