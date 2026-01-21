import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false) // Toggle between Login/Register
  
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
        // Handle Registration
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
        alert('Account created! You are now logged in.')
      } else {
        // Handle Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
      }
      // If successful, redirect to dashboard
      navigate('/dashboard')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-center text-gray-500 mb-6">
          {isSignUp ? 'Sign up to create invoices' : 'Login to manage your business'}
        </p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              placeholder="name@company.com"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 font-semibold disabled:bg-blue-400"
          >
            {loading 
              ? 'Processing...' 
              : (isSignUp ? 'Sign Up' : 'Sign In')
            }
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-2 text-blue-600 hover:text-blue-800 font-semibold hover:underline"
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  )
}