import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData((prev) => ({...prev, [e.target.name]: e.target.value}))
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp(formData)
        if (error) throw error
        alert('Account created! You are now logged in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword(formData)
        if (error) throw error
      }
      navigate('/dashboard')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col justify-between bg-cover bg-center relative" 
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')" }}>
      
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-900/95"></div>

      {/* COMPACT PADDING & GAP FOR MOBILE */}
      <div className="relative z-10 w-full max-w-6xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center flex-grow">
        
        {/* LEFT SIDE: Compact Text for Mobile */}
        <div className="text-white text-center md:text-left space-y-4 md:space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] md:text-xs font-bold tracking-wide uppercase backdrop-blur-md">
                🚀 #1 GST Billing Platform
            </div>
            
            {/* Responsive Text Size: 4xl on mobile, 6xl on desktop */}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Professional Invoices</span> <br/> in Seconds.
            </h1>
            
            <p className="text-sm md:text-lg text-slate-300 max-w-xl mx-auto md:mx-0 leading-relaxed">
                Join thousands of businesses who trust <strong>Pixalara</strong> for GST billing and automated WhatsApp sharing.
            </p>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2 text-xs md:text-sm font-medium text-slate-300">
                <div className="flex items-center gap-1.5"><span className="text-green-400">✓</span> GST Compliant</div>
                <div className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Cloud Storage</div>
                <div className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Mobile Ready</div>
            </div>
        </div>

        {/* RIGHT SIDE: Compact Login Card */}
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                        {isSignUp ? 'Get Started' : 'Welcome Back'}
                    </h2>
                    <p className="text-slate-300 text-xs md:text-sm">
                        {isSignUp ? 'Create your free account today.' : 'Enter details to access dashboard.'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 ml-1">Email</label>
                        <input name="email" type="email" placeholder="name@company.com" className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" onChange={handleChange} required />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 ml-1">Password</label>
                        <input name="password" type="password" placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" onChange={handleChange} required minLength={6} />
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-70 mt-2 text-sm md:text-base">
                        {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div className="mt-6 text-center pt-4 border-t border-white/10">
                    <p className="text-slate-300 text-xs">
                        {isSignUp ? 'Have an account?' : "New here?"}
                        <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-blue-400 font-bold hover:underline">
                            {isSignUp ? 'Log In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
      </div>

      <div className="w-full text-center z-20 py-4 bg-slate-900/50 backdrop-blur-sm md:bg-transparent">
          <p className="text-[10px] text-slate-400 opacity-80">
              Powered by <a href="https://pixalara.com" target="_blank" rel="noreferrer" className="hover:text-white underline">pixalara.com</a>
          </p>
      </div>
    </div>
  )
}