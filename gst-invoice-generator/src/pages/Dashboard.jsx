import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  // Setup the form
  const { register, handleSubmit, setValue } = useForm()

  useEffect(() => {
    // 1. Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) navigate('/login')
      else fetchProfile(session.user.id)
      setLoading(false)
    })
  }, [])

  // 2. Fetch existing profile data
  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) {
      setValue('business_name', data.business_name)
      setValue('state', data.state)
      setValue('gstin', data.gstin)
    }
  }

  // 3. Save profile updates
  const updateProfile = async (formData) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          ...formData,
          email: session.user.email
        })

      if (error) throw error
      alert('Business details saved!')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium">
            Sign Out
          </button>
        </div>

        {/* Business Profile Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Business Settings</h2>
          <form onSubmit={handleSubmit(updateProfile)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Business Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Business Name *</label>
              <input 
                {...register('business_name', { required: true })}
                className="mt-1 w-full p-2 border rounded"
                placeholder="e.g., Pixalara Traders"
              />
            </div>

            {/* State Selection (Critical for GST) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">State *</label>
              <select {...register('state', { required: true })} className="mt-1 w-full p-2 border rounded">
                <option value="">Select State</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                {/* Add more states as needed */}
              </select>
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700">GSTIN (Optional)</label>
              <input 
                {...register('gstin')}
                className="mt-1 w-full p-2 border rounded"
                placeholder="29ABCDE1234F1Z5"
              />
            </div>

            <div className="col-span-2 mt-4">
              <button 
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full md:w-auto"
              >
                Save Business Details
              </button>
            </div>
          </form>
        </div>

        {/* Invoice Actions */}
        <div className="bg-white p-6 rounded-lg shadow text-center">
            <h2 className="text-xl font-semibold mb-4">Invoices</h2>
            <p className="text-gray-500 mb-6">You haven't created any invoices yet.</p>
            <button 
  onClick={() => navigate('/create-invoice')} 
  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold"
>
    + Create New Invoice
</button>
        </div>
      </div>
    </div>
  )
}