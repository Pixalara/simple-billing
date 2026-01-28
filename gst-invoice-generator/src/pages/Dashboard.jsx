import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { INDIAN_STATES } from '../constants'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
                        {type === 'success' && <svg className={`h-8 w-8 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        {type === 'error' && <svg className={`h-8 w-8 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                        {type === 'warning' && <svg className={`h-8 w-8 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                        {type === 'info' && <svg className={`h-8 w-8 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">{title}</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">{message}</p>
                    <div className="flex gap-3">
                        {cancelLabel && <button onClick={onClose} className="flex-1 py-3.5 px-4 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition-colors">{cancelLabel}</button>}
                        <button onClick={() => { if (onAction) onAction(); else onClose(); }} className={`flex-1 py-3.5 px-4 rounded-xl text-white font-bold shadow-lg shadow-gray-200 transition-transform active:scale-95 ${style.btn}`}>{actionLabel || 'Continue'}</button>
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
  const [uploadingStamp, setUploadingStamp] = useState(false)
  
  const [savedLogo, setSavedLogo] = useState(null)
  const [savedSignature, setSavedSignature] = useState(null)
  const [savedStamp, setSavedStamp] = useState(null)
  
  const [invoices, setInvoices] = useState([]) 
  const [stats, setStats] = useState({ total: 0, revenue: 0 })
  
  // --- FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ startDate: null, endDate: null, minAmount: '', maxAmount: '' })

  const [popup, setPopup] = useState({ isOpen: false, title: '', message: '', type: 'info', actionLabel: 'OK', cancelLabel: null, onAction: null })

  const navigate = useNavigate()
  const { register, handleSubmit, setValue } = useForm()

  const showPopup = (title, message, type = 'info', actionLabel = 'OK', onAction = null, cancelLabel = null) => {
      setPopup({ isOpen: true, title, message, type, actionLabel, onAction, cancelLabel })
  }
  const closePopup = () => setPopup({ ...popup, isOpen: false })

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
      
      setValue('print_duplicates', data.print_duplicates)
      setValue('print_triplicates', data.print_triplicates) 
      setValue('enable_manual_invoice_no', data.enable_manual_invoice_no)

      if (data.logo_url) setSavedLogo(data.logo_url)
      if (data.signature_url) setSavedSignature(data.signature_url)
      if (data.stamp_url) setSavedStamp(data.stamp_url)
    }
    setLoading(false)
  }

  const fetchInvoices = async (userId) => {
    const { data } = await supabase.from('invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) {
        setInvoices(data)
        const totalRev = data.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
        setStats({ total: data.length, revenue: totalRev })
    }
  }

  const handleFileUpload = async (event, type) => {
    try {
      if (type === 'logo') setUploadingLogo(true)
      else if (type === 'signature') setUploadingSig(true)
      else setUploadingStamp(true)

      const file = event.target.files[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}-${type}-${Math.random()}.${fileExt}`
      
      const { error } = await supabase.storage.from('logos').upload(fileName, file)
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName)
      
      const updateData = {}
      if (type === 'logo') updateData.logo_url = publicUrl
      else if (type === 'signature') updateData.signature_url = publicUrl
      else updateData.stamp_url = publicUrl

      await supabase.from('users').update(updateData).eq('id', session.user.id)

      if (type === 'logo') { setSavedLogo(publicUrl); showPopup('Success', 'Logo updated!', 'success') }
      else if (type === 'signature') { setSavedSignature(publicUrl); showPopup('Success', 'Signature updated!', 'success') }
      else { setSavedStamp(publicUrl); showPopup('Success', 'Stamp updated!', 'success') }

    } catch (error) {
      showPopup('Upload Failed', error.message, 'error')
    } finally {
      setUploadingLogo(false); setUploadingSig(false); setUploadingStamp(false)
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
    showPopup('Delete Invoice?', 'Are you sure?', 'warning', 'Delete', () => confirmDelete(id), 'Cancel')
  }

  const confirmDelete = async (id) => {
    try {
        const { error } = await supabase.from('invoices').delete().eq('id', id)
        if (error) throw error
        const updatedInvoices = invoices.filter(inv => inv.id !== id)
        setInvoices(updatedInvoices)
        const totalRev = updatedInvoices.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
        setStats({ total: updatedInvoices.length, revenue: totalRev })
        
        closePopup()
        setTimeout(() => showPopup('Deleted', 'Invoice removed.', 'success'), 300)
    } catch (error) {
        closePopup(); setTimeout(() => showPopup('Error', error.message, 'error'), 300)
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login') }

  const enforceLettersOnly = (e, f) => setValue(f, e.target.value.replace(/[^A-Za-z\s]/g, ''))
  const enforceNumbersOnly = (e, f) => setValue(f, e.target.value.replace(/\D/g, ''))
  const enforceUpperCase = (e, f) => setValue(f, e.target.value.toUpperCase())
  const enforceCapitalLetters = (e, f) => setValue(f, e.target.value.replace(/[^A-Za-z\s]/g, '').toUpperCase())

  // --- FILTERING LOGIC ---
  const getFilteredInvoices = () => {
    return invoices.filter(inv => {
        // 1. Search Text
        const searchLower = searchTerm.toLowerCase().trim()
        const matchesSearch = 
            !searchLower ||
            inv.invoice_no.toLowerCase().includes(searchLower) ||
            (inv.invoice_data?.buyer_name || '').toLowerCase().includes(searchLower)

        // 2. Date Range
        const invDate = new Date(inv.created_at)
        let matchesDate = true
        if (filters.startDate) {
            const start = new Date(filters.startDate); start.setHours(0,0,0,0)
            if (invDate < start) matchesDate = false
        }
        if (filters.endDate && matchesDate) {
            const end = new Date(filters.endDate); end.setHours(23,59,59,999)
            if (invDate > end) matchesDate = false
        }

        // 3. Amount Range
        let matchesAmount = true
        const amount = inv.total_amount || 0
        if (filters.minAmount && amount < parseFloat(filters.minAmount)) matchesAmount = false
        if (filters.maxAmount && matchesAmount && amount > parseFloat(filters.maxAmount)) matchesAmount = false

        return matchesSearch && matchesDate && matchesAmount
    })
  }

  const filteredInvoices = getFilteredInvoices()
  const activeFilterCount = (filters.startDate ? 1 : 0) + (filters.endDate ? 1 : 0) + (filters.minAmount ? 1 : 0) + (filters.maxAmount ? 1 : 0)

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-20">
      
      {/* CUSTOM CSS FOR PREMIUM CALENDAR LOOK */}
      <style>{`
        .react-datepicker-wrapper { width: 100%; }
        /* Fix for clipping: ensure calendar is on top */
        .react-datepicker-popper { z-index: 9999 !important; }
        
        .react-datepicker {
            border: none !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
            border-radius: 16px !important;
            font-family: inherit !important;
            border: 1px solid #f3f4f6 !important;
        }
        .react-datepicker__header {
            background-color: white !important;
            border-bottom: 1px solid #f3f4f6 !important;
            padding-top: 15px !important;
            border-top-left-radius: 16px !important;
            border-top-right-radius: 16px !important;
        }
        .react-datepicker__current-month {
            color: #1f2937 !important;
            font-weight: 700 !important;
            margin-bottom: 10px !important;
        }
        .react-datepicker__day-name {
            color: #9ca3af !important;
            font-weight: 600 !important;
            width: 2.2rem !important;
        }
        .react-datepicker__day {
            color: #4b5563 !important;
            width: 2.2rem !important;
            line-height: 2.2rem !important;
            margin: 0.1rem !important;
            border-radius: 9999px !important;
        }
        .react-datepicker__day:hover {
            background-color: #eff6ff !important;
            color: #2563eb !important;
        }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
            background-color: #2563eb !important;
            color: white !important;
            font-weight: bold !important;
        }
        .react-datepicker__navigation {
            top: 15px !important;
        }
        .react-datepicker__triangle { display: none !important; }
      `}</style>

      <Popup isOpen={popup.isOpen} onClose={closePopup} title={popup.title} message={popup.message} type={popup.type} actionLabel={popup.actionLabel} cancelLabel={popup.cancelLabel} onAction={popup.onAction} />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <button onClick={handleLogout} className="text-red-600 font-medium text-sm hover:underline">Sign Out</button>
        </div>

        {/* Stats Cards */}
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
            
            {/* Left Col: Profile & Settings */}
            <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm h-fit">
                <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Business Profile</h2>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {['logo', 'signature', 'stamp'].map(type => (
                        <div key={type} className="flex flex-col items-center">
                            <div className="w-full h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-2 relative group hover:border-blue-400 transition-colors">
                                {type === 'logo' && savedLogo ? <img src={savedLogo} alt="Logo" className="h-full w-full object-contain p-1" /> : 
                                 type === 'signature' && savedSignature ? <img src={savedSignature} alt="Sig" className="h-full w-full object-contain p-1" /> :
                                 type === 'stamp' && savedStamp ? <img src={savedStamp} alt="Stamp" className="h-full w-full object-contain p-1" /> :
                                 <span className="text-gray-400 text-[10px] capitalize">{type}</span>}
                            </div>
                            <label className="text-[10px] text-blue-600 font-bold cursor-pointer hover:underline text-center capitalize">
                                {(type === 'logo' ? uploadingLogo : type === 'signature' ? uploadingSig : uploadingStamp) ? '...' : 'Upload'}
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, type)} className="hidden" />
                            </label>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit(updateProfile)} className="space-y-3">
                    <input {...register('business_name')} placeholder="BUSINESS NAME" onChange={(e) => enforceLettersOnly(e, 'business_name')} className="w-full p-2 border rounded text-sm bg-gray-50" />
                    <input {...register('business_email')} placeholder="BUSINESS EMAIL" className="w-full p-2 border rounded text-sm bg-gray-50" />
                    <input {...register('business_phone')} placeholder="BUSINESS PHONE" onChange={(e) => enforceNumbersOnly(e, 'business_phone')} maxLength={10} className="w-full p-2 border rounded text-sm bg-gray-50" />
                    <input {...register('website')} placeholder="WEBSITE" className="w-full p-2 border rounded text-sm bg-gray-50" />
                    <input {...register('gstin')} placeholder="GSTIN" onChange={(e) => enforceUpperCase(e, 'gstin')} className="w-full p-2 border rounded text-sm bg-gray-50" />
                    <select {...register('state')} className="w-full p-2 border rounded text-sm bg-gray-50"><option value="">Select State</option>{INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select>

                    <div className="pt-4 border-t mt-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bank Details</h3>
                        <div className="space-y-2">
                            <input {...register('bank_name')} placeholder="BANK NAME" onChange={(e) => enforceCapitalLetters(e, 'bank_name')} className="w-full p-2 border rounded text-sm bg-gray-50" />
                            <input {...register('account_number')} placeholder="ACCOUNT NUMBER" onChange={(e) => enforceNumbersOnly(e, 'account_number')} className="w-full p-2 border rounded text-sm bg-gray-50" />
                            <input {...register('ifsc_code')} placeholder="IFSC CODE" onChange={(e) => enforceUpperCase(e, 'ifsc_code')} className="w-full p-2 border rounded text-sm bg-gray-50" />
                            <input {...register('branch_name')} placeholder="BRANCH NAME" onChange={(e) => enforceCapitalLetters(e, 'branch_name')} className="w-full p-2 border rounded text-sm bg-gray-50" />
                        </div>
                    </div>

                    <div className="pt-4 border-t mt-4 space-y-2">
                        {/* Settings Toggles */}
                        <div className="flex items-center gap-2">
                            <input type="checkbox" {...register('print_duplicates')} id="print_dup" className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                            <label htmlFor="print_dup" className="text-xs font-bold text-gray-700 cursor-pointer">Generate Original & Duplicate?</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" {...register('print_triplicates')} id="print_trip" className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                            <label htmlFor="print_trip" className="text-xs font-bold text-gray-700 cursor-pointer">Generate Triplicate Copy?</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" {...register('enable_manual_invoice_no')} id="manual_inv" className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                            <label htmlFor="manual_inv" className="text-xs font-bold text-gray-700 cursor-pointer">Enable Manual Invoice Numbering?</label>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-700 mt-4">Save Profile</button>
                </form>
            </div>

            {/* Right Col: Actions & List */}
            <div className="lg:col-span-2 space-y-4">
                <button onClick={() => navigate('/create-invoice')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                    <span className="text-xl">+</span> Create New Invoice
                </button>
                
                {/* --- MAIN CONTAINER FIXED: Removed overflow-hidden so DatePicker can fly out --- */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 relative">
                    
                    {/* Header & Filter Bar - Rounded Top */}
                    <div className="p-4 border-b bg-gray-50/50 space-y-3 rounded-t-xl">
                        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                            <h3 className="font-bold text-gray-700 text-sm">All Invoices ({invoices.length})</h3>
                            <div className="flex gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input 
                                        type="text" 
                                        placeholder="Search Customer or Invoice #" 
                                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                    Filters {activeFilterCount > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Filters */}
                        {showFilters && (
                            <div className="pt-3 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 relative z-50">
                                <div className="relative">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">From Date</label>
                                    <DatePicker 
                                        selected={filters.startDate} 
                                        onChange={(date) => setFilters({...filters, startDate: date})}
                                        className="w-full p-2 text-xs border rounded bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                                        placeholderText="Select Start Date"
                                        dateFormat="dd/MM/yyyy"
                                    />
                                    <svg className="w-3 h-3 absolute right-2 bottom-3 pointer-events-none text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="relative">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">To Date</label>
                                    <DatePicker 
                                        selected={filters.endDate} 
                                        onChange={(date) => setFilters({...filters, endDate: date})}
                                        className="w-full p-2 text-xs border rounded bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                                        placeholderText="Select End Date"
                                        dateFormat="dd/MM/yyyy"
                                        minDate={filters.startDate}
                                    />
                                    <svg className="w-3 h-3 absolute right-2 bottom-3 pointer-events-none text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Min Amount</label>
                                    <input type="number" placeholder="0" className="w-full p-2 text-xs border rounded bg-white focus:ring-2 focus:ring-blue-100 outline-none" value={filters.minAmount} onChange={e => setFilters({...filters, minAmount: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Max Amount</label>
                                    <input type="number" placeholder="∞" className="w-full p-2 text-xs border rounded bg-white focus:ring-2 focus:ring-blue-100 outline-none" value={filters.maxAmount} onChange={e => setFilters({...filters, maxAmount: e.target.value})} />
                                </div>
                                <div className="col-span-2 md:col-span-4 flex justify-end">
                                    <button onClick={() => { setSearchTerm(''); setFilters({ startDate: null, endDate: null, minAmount: '', maxAmount: '' }) }} className="text-xs text-red-500 font-bold hover:underline">Clear All Filters</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Invoice List */}
                    {filteredInvoices.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center opacity-60">
                            <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="text-gray-500 text-sm font-medium">No invoices found matching your filters.</p>
                            <button onClick={() => { setSearchTerm(''); setFilters({ startDate: null, endDate: null, minAmount: '', maxAmount: '' }) }} className="mt-2 text-blue-600 text-xs font-bold hover:underline">Reset Filters</button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View - Rounded Bottom */}
                            <table className="hidden md:table w-full text-left text-sm rounded-b-xl overflow-hidden">
                                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs border-b">
                                    <tr>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3">Invoice #</th>
                                        <th className="px-5 py-3">Customer</th>
                                        <th className="px-5 py-3 text-right">Amount</th>
                                        <th className="px-5 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredInvoices.map((inv) => (
                                        <tr key={inv.id} onClick={() => navigate(`/edit-invoice/${inv.id}`)} className="hover:bg-blue-50 cursor-pointer group transition-colors">
                                            <td className="px-5 py-3 text-gray-600">{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                                            <td className="px-5 py-3 font-bold text-blue-600 group-hover:underline">{inv.invoice_no}</td>
                                            <td className="px-5 py-3 font-medium text-gray-800">{inv.invoice_data?.buyer_name}</td>
                                            <td className="px-5 py-3 text-right font-bold text-gray-900">₹{inv.total_amount}</td>
                                            <td className="px-5 py-3 text-center"><button onClick={(e) => handleDeleteClick(inv.id, e)} className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-all">🗑️</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile List View - Rounded Bottom */}
                            <div className="md:hidden divide-y divide-gray-100 rounded-b-xl overflow-hidden">
                                {filteredInvoices.map((inv) => (
                                    <div key={inv.id} onClick={() => navigate(`/edit-invoice/${inv.id}`)} className="p-4 active:bg-blue-50 transition-colors cursor-pointer">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-blue-600 text-sm">#{inv.invoice_no}</span>
                                            <span className="font-bold text-gray-900 text-base">₹{inv.total_amount}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-semibold text-gray-800">{inv.invoice_data?.buyer_name}</span>
                                                <span className="text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString('en-IN')}</span>
                                            </div>
                                            <button onClick={(e) => handleDeleteClick(inv.id, e)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50">
                                                🗑️
                                            </button>
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