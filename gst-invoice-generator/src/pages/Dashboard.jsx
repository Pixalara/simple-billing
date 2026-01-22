import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { INDIAN_STATES } from '../constants'

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSig, setUploadingSig] = useState(false)
  const [savedLogo, setSavedLogo] = useState(null)
  const [savedSignature, setSavedSignature] = useState(null)
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
      
      setValue('bank_name', data.bank_name)
      setValue('account_number', data.account_number)
      setValue('ifsc_code', data.ifsc_code)
      setValue('branch_name', data.branch_name)

      if (data.logo_url) setSavedLogo(data.logo_url)
      if (data.signature_url) setSavedSignature(data.signature_url)
    }
    setLoading(false)
  }

  const fetchInvoices = async (userId) => {
    const { data } = await supabase.from('invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setInvoices(data)
  }

  const handleFileUpload = async (event, type) => {
    try {
      if (type === 'logo') setUploadingLogo(true)
      else setUploadingSig(true)

      const file = event.target.files[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}-${type}-${Math.random()}.${fileExt}`
      
      const { error } = await supabase.storage.from('logos').upload(fileName, file)
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName)
      
      const updateData = type === 'logo' ? { logo_url: publicUrl } : { signature_url: publicUrl }
      await supabase.from('users').update(updateData).eq('id', session.user.id)

      if (type === 'logo') {
          setSavedLogo(publicUrl)
          alert('Logo updated!')
      } else {
          setSavedSignature(publicUrl)
          alert('Signature updated!')
      }

    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setUploadingLogo(false)
      setUploadingSig(false)
    }
  }

  const updateProfile = async (formData) => {
    try {
      setLoading(true)
      const { error } = await supabase.from('users').upsert({ id: session.user.id, ...formData })
      if (error) throw error
      alert('Profile Saved Successfully!')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- DELETE FUNCTION ---
  const handleDeleteInvoice = async (id, e) => {
    e.stopPropagation() // Prevent triggering the row click (Edit)
    
    if (!window.confirm("Are you sure you want to delete this invoice? This cannot be undone.")) {
        return
    }

    try {
        const { error } = await supabase.from('invoices').delete().eq('id', id)
        if (error) throw error
        
        // Remove from local state instantly
        setInvoices(prev => prev.filter(inv => inv.id !== id))
    } catch (error) {
        alert('Error deleting: ' + error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <button onClick={handleLogout} className="text-red-600 font-medium text-sm">Sign Out</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Business Profile */}
            <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm h-fit">
                <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Business Profile</h2>
                
                <div className="flex gap-4 mb-6">
                    {/* LOGO */}
                    <div className="flex flex-col items-center w-1/2">
                        <div className="w-full h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-2">
                            {savedLogo ? <img src={savedLogo} alt="Logo" className="h-full w-full object-contain p-1" /> : <span className="text-gray-400 text-[10px]">No Logo</span>}
                        </div>
                        <label className="text-xs text-blue-600 font-bold cursor-pointer hover:underline text-center">
                            {uploadingLogo ? '...' : 'Upload Logo'}
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} disabled={uploadingLogo} className="hidden" />
                        </label>
                    </div>

                    {/* SIGNATURE */}
                    <div className="flex flex-col items-center w-1/2">
                        <div className="w-full h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-2">
                            {savedSignature ? <img src={savedSignature} alt="Sig" className="h-full w-full object-contain p-1" /> : <span className="text-gray-400 text-[10px]">No Sig</span>}
                        </div>
                        <label className="text-xs text-blue-600 font-bold cursor-pointer hover:underline text-center">
                            {uploadingSig ? '...' : 'Upload Sign'}
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} disabled={uploadingSig} className="hidden" />
                        </label>
                    </div>
                </div>

                <form onSubmit={handleSubmit(updateProfile)} className="space-y-3">
                    {['business_name', 'business_email', 'business_phone', 'website', 'gstin'].map(field => (
                        <div key={field}>
                            <input {...register(field)} placeholder={field.replace('_', ' ').toUpperCase()} className="w-full p-2 border rounded text-sm bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    ))}
                    <select {...register('state')} className="w-full p-2 border rounded text-sm bg-gray-50">
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <div className="pt-4 border-t mt-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bank Details</h3>
                        <div className="space-y-2">
                            <input {...register('bank_name')} placeholder="Bank Name" className="w-full p-2 border rounded text-sm bg-gray-50" />
                            <input {...register('account_number')} placeholder="Account Number" className="w-full p-2 border rounded text-sm bg-gray-50" />
                            <input {...register('ifsc_code')} placeholder="IFSC Code" className="w-full p-2 border rounded text-sm bg-gray-50" />
                            <input {...register('branch_name')} placeholder="Branch Name" className="w-full p-2 border rounded text-sm bg-gray-50" />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-700 mt-4">Save Profile</button>
                </form>
            </div>

            {/* Invoices List */}
            <div className="lg:col-span-2 space-y-4">
                <button onClick={() => navigate('/create-invoice')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                    <span>+</span> Create New Invoice
                </button>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b bg-gray-50">
                        <h3 className="font-bold text-gray-700 text-sm">Recent Invoices</h3>
                    </div>
                    
                    {invoices.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No invoices yet.</div>
                    ) : (
                        <>
                            {/* DESKTOP TABLE */}
                            <table className="hidden md:table w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs">
                                    <tr>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3">Invoice #</th>
                                        <th className="px-5 py-3">Customer</th>
                                        <th className="px-5 py-3 text-right">Amount</th>
                                        <th className="px-5 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoices.map((inv) => (
                                        <tr key={inv.id} onClick={() => navigate(`/edit-invoice/${inv.id}`)} className="hover:bg-blue-50 cursor-pointer group">
                                            <td className="px-5 py-3">{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                                            <td className="px-5 py-3 font-medium text-blue-600">{inv.invoice_no}</td>
                                            <td className="px-5 py-3">{inv.invoice_data?.buyer_name}</td>
                                            <td className="px-5 py-3 text-right font-bold">₹{inv.total_amount}</td>
                                            <td className="px-5 py-3 text-center">
                                                <button 
                                                    onClick={(e) => handleDeleteInvoice(inv.id, e)}
                                                    className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                                    title="Delete Invoice"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* MOBILE CARDS */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {invoices.map((inv) => (
                                    <div key={inv.id} onClick={() => navigate(`/edit-invoice/${inv.id}`)} className="p-4 active:bg-blue-50 relative">
                                        <div className="flex justify-between mb-1 pr-8">
                                            <span className="font-bold text-blue-600 text-sm">{inv.invoice_no}</span>
                                            <span className="text-gray-400 text-xs">{new Date(inv.created_at).toLocaleDateString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center pr-8">
                                            <span className="text-gray-800 font-medium text-sm">{inv.invoice_data?.buyer_name || 'No Name'}</span>
                                            <span className="text-gray-900 font-bold text-base">₹{inv.total_amount}</span>
                                        </div>
                                        
                                        {/* Mobile Delete Button (Absolute positioned) */}
                                        <button 
                                            onClick={(e) => handleDeleteInvoice(inv.id, e)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 p-2"
                                        >
                                            🗑️
                                        </button>
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