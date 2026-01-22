import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  
  // VIEW STATES: 'LOGIN', 'SIGNUP', 'FORGOT_PASS', 'OTP_VERIFY', 'RESET_PASS'
  const [view, setView] = useState('LOGIN')
  const [loading, setLoading] = useState(false)
  const [otpContext, setOtpContext] = useState('') // 'SIGNUP' or 'RECOVERY'
  
  // Form Data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')

  // --- HANDLERS ---

  // 1. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/dashboard')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. INITIATE SIGNUP (Send OTP)
  const handleSignupStart = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) return alert("Passwords do not match!")
    
    setLoading(true)
    try {
      // We use signInWithOtp to verify email existence/ownership first
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      
      setOtpContext('SIGNUP')
      setView('OTP_VERIFY')
      alert('OTP sent to your email!')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // 3. INITIATE FORGOT PASSWORD (Send OTP)
  const handleForgotStart = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      
      setOtpContext('RECOVERY')
      setView('OTP_VERIFY')
      alert('OTP sent to your email!')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // 4. VERIFY OTP (Common for Signup & Recovery)
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email' // 'email' type works for magic link/code logins
      })
      if (error) throw error

      // If successful, user is now logged in.
      if (otpContext === 'SIGNUP') {
        // Set the password immediately for the new account
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        
        alert('Account created successfully!')
        navigate('/dashboard')
      } else if (otpContext === 'RECOVERY') {
        // Move to Reset Password Screen
        setView('RESET_PASS')
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // 5. RESET PASSWORD (Final Step of Recovery)
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) return alert("Passwords do not match!")
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      alert('Password updated! Redirecting to Dashboard...')
      navigate('/dashboard')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative" 
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')" }}>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-900/95"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md p-6">
        
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
            
            {/* Header Text Dynamic */}
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

            {/* --- VIEW: FORGOT PASSWORD (Enter Email) --- */}
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
                        <input type="text" placeholder="Enter OTP code" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none tracking-widest text-center text-xl font-mono"
                            value={otp} onChange={(e) => setOtp(e.target.value)} required />
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
                </form>
            )}

        </div>
        
        {/* Footer */}
        <div className="w-full text-center z-20 py-4">
            <p className="text-[11px] text-slate-400 opacity-60">
                Powered by <a href="https://pixalara.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors underline">pixalara.com</a>
            </p>
        </div>

      </div>
    </div>
  )
}