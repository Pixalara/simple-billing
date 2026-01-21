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
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
        alert('Account created! You are now logged in.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
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
    // Updated main container layout
    <div className="min-h-[100dvh] w-full flex flex-col justify-between bg-cover bg-center relative" 
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')" }}>
      
      {/* Dark Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-900/95"></div>

      {/* Main Content Container - Added flex-grow and py-8 for spacing */}
      <div className="relative z-10 w-full max-w-6xl p-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center flex-grow py-8">
        
        {/* LEFT SIDE: Brand & Value Prop */}
        <div className="text-white text-center md:text-left space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wide uppercase mb-2 backdrop-blur-md">
                🚀 #1 GST Billing Platform
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Professional Invoices</span> <br/> in Seconds.
            </h1>
            
            <p className="text-lg text-slate-300 max-w-xl mx-auto md:mx-0 leading-relaxed">
                Join thousands of businesses who trust <strong>Pixalara</strong> for GST billing and automated WhatsApp sharing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4 text-sm font-medium text-slate-300">
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">✓</span> 
                    100% GST Compliant
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">✓</span> 
                    Secure Cloud Storage
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">✓</span> 
                    Mobile & Desktop Ready
                </div>
            </div>
        </div>

        {/* RIGHT SIDE: Premium Login Card */}
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {isSignUp ? 'Get Started' : 'Welcome Back'}
                    </h2>
                    <p className="text-slate-300 text-sm">
                        {isSignUp ? 'Create your free account today.' : 'Enter your details to access your dashboard.'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Business Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="name@company.com"
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Create Free Account' : 'Sign In to Dashboard')}
                    </button>
                </form>

                {/* Footer Toggle */}
                <div className="mt-8 text-center pt-6 border-t border-white/10">
                    <p className="text-slate-300 text-sm">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        <button 
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-blue-400 hover:text-blue-300 font-bold hover:underline transition-colors"
                        >
                            {isSignUp ? 'Log In' : 'Sign Up Free'}
                        </button>
                    </p>
                </div>
            </div>
            
            {/* Trust Badge */}
            <div className="mt-6 text-center">
                <p className="text-xs text-slate-500 font-medium opacity-60">🔒 256-bit SSL Encrypted • Trusted by 10,000+ Businesses</p>
            </div>
        </div>
      </div>

      {/* --- UPDATED FOOTER --- */}
      {/* Removed absolute positioning, added padding */}
      <div className="w-full text-center z-20 py-4">
          <p className="text-[11px] text-slate-400 opacity-60">
              Powered by <a href="https://pixalara.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors underline">pixalara.com</a>
          </p>
      </div>

    </div>
  )
}