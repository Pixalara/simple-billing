import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { INDIAN_STATES } from '../constants'

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [savedLogo, setSavedLogo] = useState(null)
  const [invoices, setInvoices] = useState([]) 
  const navigate = useNavigate()
  
  const { register, handleSubmit, setValue } = useForm()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) navigate('/login')
      else {
        fetchProfile(session.user.id)
        fetchInvoices(session.user.id)
      }
    })
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single()
    if (data) {
      setValue('business_name', data.business_name)
      setValue('state', data.state)
      setValue('gstin', data.gstin)
      setValue('business_email', data.business_email)
      setValue('business_phone', data.business_phone)
      setValue('website', data.website)
      if (data.logo_url) setSavedLogo(data.logo_url)
    }
    setLoading(false)
  }

  const fetchInvoices = async (userId) => {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setInvoices(data)
  }

  const handleLogoUpload = async (event) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName)
      await supabase.from('users').update({ logo_url: publicUrl }).eq('id', session.user.id)
      setSavedLogo(publicUrl)
      alert('Logo uploaded successfully!')
    } catch (error) {
      alert('Error uploading logo: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const updateProfile = async (formData) => {
    try {
      setLoading(true)
      const { error } = await supabase.from('users').upsert({
        id: session.user.id,
        ...formData
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium text-sm md:text-base">
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Business Profile (Collapsible on mobile via details tag usually, but stacked here) */}
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg h-fit">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Business Profile</h2>
                
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-3 relative group">
                        {savedLogo ? (
                            <img src={savedLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                            <span className="text-gray-400 text-xs">No Logo</span>
                        )}
                    </div>
                    <label className="text-sm text-blue-600 cursor-pointer hover:underline">
                        {uploading ? 'Uploading...' : 'Change Logo'}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
                    </label>
                </div>

                <form onSubmit={handleSubmit(updateProfile)} className="space-y-3">
                    {/* Inputs with responsive adjustments */}
                    {['business_name', 'business_email', 'business_phone', 'website', 'gstin'].map(field => (
                        <div key={field}>
                            <label className="text-xs font-bold text-gray-500 capitalize">{field.replace('_', ' ')}</label>
                            <input {...register(field)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    ))}
                    <div>
                        <label className="text-xs font-bold text-gray-500">State</label>
                        <select {...register('state')} className="w-full p-2 border rounded text-sm bg-white">
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold text-sm mt-2 shadow">
                        Save Profile
                    </button>
                </form>
            </div>

            {/* Invoices List */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Create New Action */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-lg shadow-lg text-white flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <div>
                        <h2 className="text-2xl font-bold">Invoices</h2>
                        <p className="opacity-90 text-sm">Manage and create GST bills</p>
                    </div>
                    <button 
                        onClick={() => navigate('/create-invoice')} 
                        className="bg-white text-blue-700 px-6 py-3 rounded-lg font-bold shadow hover:bg-gray-100 transition transform active:scale-95 w-full md:w-auto"
                    >
                        + Create New
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h3 className="font-bold text-gray-700">Recent Invoices</h3>
                    </div>
                    
                    {invoices.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No invoices found. Create your first one!</div>
                    ) : (
                        <>
                            {/* Desktop View: Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-600 uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Invoice #</th>
                                            <th className="px-6 py-3">Customer</th>
                                            <th className="px-6 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {invoices.map((inv) => (
                                            <tr 
                                                key={inv.id} 
                                                onClick={() => navigate(`/edit-invoice/${inv.id}`)} 
                                                className="hover:bg-blue-50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4">{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                                                <td className="px-6 py-4 font-medium text-blue-600">{inv.invoice_no}</td>
                                                <td className="px-6 py-4">{inv.invoice_data?.buyer_name || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-800">₹{inv.total_amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View: Cards */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {invoices.map((inv) => (
                                    <div 
                                        key={inv.id} 
                                        onClick={() => navigate(`/edit-invoice/${inv.id}`)}
                                        className="p-4 active:bg-gray-50 cursor-pointer"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-blue-600">{inv.invoice_no}</span>
                                            <span className="text-gray-500 text-xs">{new Date(inv.created_at).toLocaleDateString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 font-medium">{inv.invoice_data?.buyer_name || 'Unknown'}</span>
                                            <span className="text-gray-900 font-bold">₹{inv.total_amount}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}