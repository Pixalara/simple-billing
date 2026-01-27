import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

// --- COMPONENTS MOVED OUTSIDE TO FIX TYPING BUG ---

const CheckItem = ({ text }) => (
  <div className="flex items-center gap-3 mb-2">
      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50 shrink-0">
          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
      <span className="text-slate-300 text-base font-medium tracking-wide text-left">{text}</span>
  </div>
)

const InputField = ({ label, type, placeholder, value, onChange, className, ...props }) => (
  <div className="mb-5">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
      <input 
          type={type} 
          placeholder={placeholder}
          className={className || "w-full bg-[#1e293b]/80 border border-slate-700/50 rounded-xl px-5 py-4 text-white text-lg placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:bg-[#1e293b] outline-none transition-all duration-200 shadow-inner"}
          value={value} 
          onChange={onChange} 
          {...props}
      />
  </div>
)

export default function Login() {
  const navigate = useNavigate()
  const [view, setView] = useState('LOGIN')
  const [loading, setLoading] = useState(false)
  const [otpContext, setOtpContext] = useState('') 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [toast, setToast] = useState(null) 

  const showToast = (message, type = 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error; showToast('Welcome back!', 'success'); setTimeout(() => navigate('/dashboard'), 1000)
    } catch (error) { showToast(error.message, 'error') } finally { setLoading(false) }
  }

  const handleSignupStart = async (e) => {
    e.preventDefault(); if (password !== confirmPassword) return showToast("Passwords do not match!", 'error'); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email }); if (error) throw error;
      setOtpContext('SIGNUP'); setView('OTP_VERIFY'); showToast('OTP sent to email!', 'success')
    } catch (error) { showToast(error.message, 'error') } finally { setLoading(false) }
  }

  const handleForgotStart = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email }); if (error) throw error;
      setOtpContext('RECOVERY'); setView('OTP_VERIFY'); showToast('Recovery OTP sent!', 'success')
    } catch (error) { showToast(error.message, 'error') } finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' }); if (error) throw error;
      if (otpContext === 'SIGNUP') {
        const { error: updateError } = await supabase.auth.updateUser({ password }); if (updateError) throw updateError;
        showToast('Account created!', 'success'); setTimeout(() => navigate('/dashboard'), 1500)
      } else if (otpContext === 'RECOVERY') { setView('RESET_PASS') }
    } catch (error) { showToast(error.message, 'error') } finally { setLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault(); if (password !== confirmPassword) return showToast("Passwords do not match!", 'error'); setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password }); if (error) throw error;
      await supabase.auth.signOut(); showToast('Password updated! Please log in.', 'success');
      setTimeout(() => { setPassword(''); setConfirmPassword(''); setView('LOGIN') }, 2000)
    } catch (error) {
      if (error.message.includes("different from the old password")) {
          await supabase.auth.signOut(); showToast("Same as old password. Redirecting to login...", 'success');
          setTimeout(() => { setPassword(''); setConfirmPassword(''); setView('LOGIN') }, 2000)
      } else { showToast(error.message, 'error') }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop" className="w-full h-full object-cover opacity-20" alt="Office" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b]/90 to-[#0f172a]"></div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border animate-bounce-in ${toast.type === 'success' ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-100' : 'bg-red-900/80 border-red-500/30 text-red-100'}`}>
            <span className="font-bold">{toast.message}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto p-4 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
        
        {/* LEFT SIDE: Marketing Info */}
        <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6"> {/* Alignment Fix: Removed mt-16 to center vertically with right card */}
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 backdrop-blur-md mx-auto lg:mx-0">
                <span className="text-xs font-bold text-cyan-300 tracking-widest uppercase">Free GST Invoice Generator for Indian Businesses</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
                Professional GST Invoicing. <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">Zero Cost.</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                Create unlimited tax invoices with no trial period, no hidden fees, and no credit card required.
            </p>

            {/* Feature Bullets */}
            <div className="pt-2 flex flex-col gap-2 w-fit mx-auto lg:mx-0 items-start opacity-90">
                <CheckItem text="100% GST compliant formats" />
                <CheckItem text="Instant WhatsApp PDF sharing" />
                <CheckItem text="Secure, encrypted data storage" />
            </div>

            {/* --- NEW POSITION: MISSION STATEMENT --- */}
            {/* Placed here to sit naturally below the bullets */}
            <div className="pt-8 border-t border-white/10 mt-8 w-fit mx-auto lg:mx-0">
                <p className="text-slate-400 font-medium text-sm leading-relaxed tracking-wide">
                    Built by <span className="text-white font-bold">Pixalara</span> to support small traders and freelancers - <span className="text-cyan-400 font-semibold">at zero cost</span>
                </p>
            </div>
        </div>

        {/* RIGHT SIDE: Auth Card */}
        <div className="w-full max-w-[480px] mx-auto lg:mx-0">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700"></div>

                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {view === 'LOGIN' && 'Welcome Back'}
                        {view === 'SIGNUP' && 'Get Started Free'}
                        {view === 'FORGOT_PASS' && 'Reset Password'}
                        {view === 'OTP_VERIFY' && 'Verify It\'s You'}
                        {view === 'RESET_PASS' && 'New Password'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {view === 'LOGIN' && 'Enter your details to access your dashboard.'}
                        {view === 'SIGNUP' && 'Create your account in 30 seconds.'}
                        {view === 'FORGOT_PASS' && 'We\'ll send a code to your email.'}
                        {view === 'OTP_VERIFY' && `Code sent to ${email}`}
                        {view === 'RESET_PASS' && 'Secure your account with a new password.'}
                    </p>
                </div>

                {view === 'LOGIN' && (
                    <form onSubmit={handleLogin}>
                        <InputField label="Business Email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <InputField label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <div className="text-right -mt-3 mb-8"><button type="button" onClick={() => setView('FORGOT_PASS')} className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</button></div>
                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/20 transform transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">{loading ? 'Signing In...' : 'Sign In to Dashboard'}</button>
                        <div className="mt-8 pt-6 border-t border-white/10 text-center"><p className="text-sm text-slate-400">Don't have an account? <button type="button" onClick={() => setView('SIGNUP')} className="text-blue-400 font-bold hover:text-blue-300 ml-1">Sign Up Free</button></p></div>
                    </form>
                )}

                {view === 'SIGNUP' && (
                    <form onSubmit={handleSignupStart}>
                        <InputField label="Business Email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <InputField label="Create Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                        <InputField label="Confirm Password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/20 transform transition active:scale-[0.98] mt-4">{loading ? 'Processing...' : 'Create Free Account'}</button>
                        <div className="mt-8 pt-6 border-t border-white/10 text-center"><p className="text-sm text-slate-400">Already have an account? <button type="button" onClick={() => setView('LOGIN')} className="text-blue-400 font-bold hover:text-blue-300 ml-1">Sign In</button></p></div>
                    </form>
                )}

                {view === 'FORGOT_PASS' && (
                    <form onSubmit={handleForgotStart}>
                        <InputField label="Registered Email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/20 transform transition active:scale-[0.98] mt-4">{loading ? 'Sending Code...' : 'Send Verification Code'}</button>
                        <div className="mt-8 text-center"><button type="button" onClick={() => setView('LOGIN')} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">← Back to Login</button></div>
                    </form>
                )}

                {view === 'OTP_VERIFY' && (
                    <form onSubmit={handleVerifyOtp}>
                        <InputField label="6-Digit Code" type="text" placeholder="000000" value={otp} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); if(val.length <= 6) setOtp(val); }} maxLength={6} required className="w-full bg-[#1e293b]/80 border border-slate-700/50 rounded-xl px-4 py-4 text-white text-center text-3xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner" />
                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/20 transform transition active:scale-[0.98] mt-6">{loading ? 'Verifying...' : 'Verify & Continue'}</button>
                        <div className="mt-8 text-center"><button type="button" onClick={() => setView('LOGIN')} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button></div>
                    </form>
                )}

                {view === 'RESET_PASS' && (
                    <form onSubmit={handleResetPassword}>
                        <InputField label="New Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                        <InputField label="Confirm New Password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/20 transform transition active:scale-[0.98] mt-4">{loading ? 'Updating...' : 'Set New Password'}</button>
                        <div className="mt-8 text-center"><button type="button" onClick={() => { supabase.auth.signOut(); setView('LOGIN'); }} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button></div>
                    </form>
                )}

                <div className="mt-8 flex items-center justify-center gap-2 opacity-50">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    <span className="text-[11px] text-slate-400 font-medium tracking-wide">256-bit SSL Encrypted • Trusted by 10,000+ Businesses</span>
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-12 text-center relative z-10">
                <p className="text-sm font-semibold text-slate-400 tracking-wide">
                    Powered by <a href="https://pixalara.com" target="_blank" rel="noreferrer" className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:from-white hover:via-white hover:to-white transition-all duration-300 ml-1">pixalara.com</a>
                </p>
            </div>
        </div>
      </div>
    </div>
  )
}