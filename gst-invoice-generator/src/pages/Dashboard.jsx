import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { INDIAN_STATES } from '../constants'

// --- PREMIUM POPUP COMPONENT ---
const Popup = ({ isOpen, onClose, title, message, type, actionLabel, onAction, cancelLabel }) => {
    if (!isOpen) return null;
    
    const colors = {
        success: { iconBg: 'bg-green-100', iconColor: 'text-green-600', btn: 'bg-green-600 hover:bg-green-700' },
        error: { iconBg: 'bg-red-100', iconColor: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
        warning: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700' },
        info: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' }
    }
    const style = colors[type] || colors.info;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-5 ${style.iconBg}`}>
                        {type === 'success' && (
                            <svg className={`h-8 w-8 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                        {type === 'error' && (
                            <svg className={`h-8 w-8 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        {type === 'warning' && (
                            <svg className={`h-8 w-8 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        )}
                        {type === 'info' && (
                            <svg className={`h-8 w-8 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">{title}</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">{message}</p>
                    
                    <div className="flex gap-3">
                        {cancelLabel && (
                            <button 
                                onClick={onClose}
                                className="flex-1 py-3.5 px-4 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                {cancelLabel}
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                if (onAction) onAction();
                                else onClose();
                            }}
                            className={`flex-1 py-3.5 px-4 rounded-xl text-white font-bold shadow-lg shadow-gray-200 transition-transform active:scale-95 ${style.btn}`}
                        >
                            {actionLabel || 'Continue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSig, setUploadingSig] = useState(false)
  const [savedLogo, setSavedLogo] = useState(null)
  const [savedSignature, setSavedSignature] = useState(null)
  const [invoices, setInvoices] = useState([]) 
  const [stats, setStats] = useState({ total: 0, revenue: 0 }) // Added Stats State
  
  // --- POPUP STATE ---
  const [popup, setPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    actionLabel: 'OK',
    cancelLabel: null,
    onAction: null
  })

  const navigate = useNavigate()
  const { register, handleSubmit, setValue } = useForm()

  const showPopup = (title, message, type = 'info', actionLabel = 'OK', onAction = null, cancelLabel = null) => {
      setPopup({ isOpen: true, title, message, type, actionLabel, onAction, cancelLabel })
  }

  const closePopup = () => {
      setPopup({ ...popup, isOpen: false })
  }

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
    if (data) {
        setInvoices(data)
        // Calculate Stats
        const totalRev = data.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
        setStats({ total: data.length, revenue: totalRev })
    }
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
          showPopup('Success', 'Logo updated successfully!', 'success')
      } else {
          setSavedSignature(publicUrl)
          showPopup('Success', 'Signature updated successfully!', 'success')
      }

    } catch (error) {
      showPopup('Upload Failed', error.message, 'error')
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
      showPopup('Saved', 'Business Profile Saved Successfully!', 'success')
    } catch (error) {
      showPopup('Error', error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (id, e) => {
    e.stopPropagation() 
    showPopup(
        'Delete Invoice?',
        'Are you sure you want to delete this invoice? This cannot be undone.',
        'warning',
        'Delete',
        () => confirmDelete(id),
        'Cancel'
    )
  }

  const confirmDelete = async (id) => {
    try {
        const { error } = await supabase.from('invoices').delete().eq('id', id)
        if (error) throw error
        
        const updatedInvoices = invoices.filter(inv => inv.id !== id)
        setInvoices(updatedInvoices)
        // Re-calc stats
        const totalRev = updatedInvoices.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
        setStats({ total: updatedInvoices.length, revenue: totalRev })

        closePopup() // Close the confirmation
        setTimeout(() => {
            showPopup('Deleted', 'Invoice removed successfully.', 'success')
        }, 300)
    } catch (error) {
        closePopup()
        setTimeout(() => {
            showPopup('Error', error.message, 'error')
        }, 300)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // --- INPUT HANDLERS ---
  const enforceLettersOnly = (e, fieldName) => {
    const val = e.target.value.replace(/[^A-Za-z\s]/g, '')
    setValue(fieldName, val)
  }

  const enforceNumbersOnly = (e, fieldName) => {
    const val = e.target.value.replace(/\D/g, '')
    setValue(fieldName, val)
  }

  const enforceUpperCase = (e, fieldName) => {
    const val = e.target.value.toUpperCase()
    setValue(fieldName, val)
  }

  const enforceCapitalLetters = (e, fieldName) => {
    const val = e.target.value.replace(/[^A-Za-z\s]/g, '').toUpperCase()
    setValue(fieldName, val)
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-20">
      
      {/* RENDER POPUP */}
      <Popup 
        isOpen={popup.isOpen}
        onClose={closePopup}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        actionLabel={popup.actionLabel}
        cancelLabel={popup.cancelLabel}
        onAction={popup.onAction}
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <button onClick={handleLogout} className="text-red-600 font-medium text-sm">Sign Out</button>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">₹{stats.revenue.toLocaleString('en-IN')}</p>
            </div>
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
                    
                    <div>
                        <input {...register('business_name')} placeholder="BUSINESS NAME" onChange={(e) => enforceLettersOnly(e, 'business_name')} className="w-full p-2 border rounded text-sm bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>

                    <div>
                        <input {...register('business_email')} placeholder="BUSINESS EMAIL" className="w-full p-2 border rounded text-sm bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>

                    <div>
                        <input {...register('business_phone')} placeholder="BUSINESS PHONE" onChange={(e) => enforceNumbersOnly(e, 'business_phone')} maxLength={10} className="w-full p-2 border rounded text-sm bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>

                    <div>
                        <input {...register('website')} placeholder="WEBSITE" className="w-full p-2 border rounded text-sm bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>

                    <div>
                        <input {...register('gstin')} placeholder="GSTIN" onChange={(e) => enforceUpperCase(e, 'gstin')} className="w-full p-2 border rounded text-sm bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>

                    <select {...register('state')} className="w-full p-2 border rounded text-sm bg-gray-50">
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <div className="pt-4 border-t mt-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bank Details</h3>
                        <div className="space-y-2">
                            <input {...register('bank_name')} placeholder="BANK NAME" onChange={(e) => enforceCapitalLetters(e, 'bank_name')} className="w-full p-2 border rounded text-sm bg-gray-50" />
                            <input {...register('account_number')} placeholder="ACCOUNT NUMBER" onChange={(e) => enforceNumbersOnly(e, 'account_number')} className="w-full p-2 border rounded text-sm bg-gray-50" />
                            <input {...register('ifsc_code')} placeholder="IFSC CODE" onChange={(e) => enforceUpperCase(e, 'ifsc_code')} className="w-full p-2 border rounded text-sm bg-gray-50" />
                            <input {...register('branch_name')} placeholder="BRANCH NAME" onChange={(e) => enforceCapitalLetters(e, 'branch_name')} className="w-full p-2 border rounded text-sm bg-gray-50" />
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
                                            <td className="px-5 py-3 text-right font-bold">₹{(inv.total_amount || 0).toLocaleString('en-IN')}</td>
                                            <td className="px-5 py-3 text-center">
                                                <button 
                                                    onClick={(e) => handleDeleteClick(inv.id, e)}
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
                                            <span className="text-gray-900 font-bold text-base">₹{(inv.total_amount || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        
                                        <button 
                                            onClick={(e) => handleDeleteClick(inv.id, e)}
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