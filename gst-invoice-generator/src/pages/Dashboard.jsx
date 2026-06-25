import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { INDIAN_STATES } from '../constants'
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import BrandingFooter from '../components/BrandingFooter'

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

// --- ANALYTICS DATA PROCESSORS ---
const processStatusData = (invoices) => {
    const data = [
        { name: 'Paid', value: 0, color: '#10b981' },
        { name: 'Pending', value: 0, color: '#f59e0b' },
        { name: 'Overdue', value: 0, color: '#ef4444' },
        { name: 'Refunded', value: 0, color: '#6b7280' }
    ];

    invoices.forEach(inv => {
        const status = inv.status || 'PENDING';
        const amount = inv.total_amount || 0;
        
        if (status === 'PAID') data[0].value += amount;
        else if (status === 'OVERDUE') data[2].value += amount;
        else if (status === 'REFUNDED') data[3].value += amount;
        else data[1].value += amount;
    });

    return data.filter(item => item.value > 0);
};

const processTopClients = (invoices) => {
    const clients = {};
    invoices.forEach(inv => {
        const name = inv.invoice_data?.buyer_name || 'Unknown';
        if (!clients[name]) clients[name] = 0;
        clients[name] += (inv.total_amount || 0);
    });
    
    return Object.entries(clients)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }}></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{payload[0].name}</p>
                </div>
                <p className="text-lg font-bold text-gray-800">
                    ₹{payload[0].value.toLocaleString('en-IN')}
                </p>
            </div>
        );
    }
    return null;
};

// --- CUSTOMER FORM MODAL COMPONENT ---
function CustomerFormModal({ customerNode, onClose, onSave, allCustomers }) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!customerNode;
  const [fields, setFields] = useState({
    customer_id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    product: ''
  })
  
  useEffect(() => {
    if (isEdit && customerNode) {
      setFields({
        customer_id: customerNode.invoice_no,
        name: customerNode.invoice_data?.name || '',
        email: customerNode.invoice_data?.email || '',
        phone: customerNode.invoice_data?.phone || '',
        address: customerNode.invoice_data?.address || '',
        city: customerNode.invoice_data?.city || '',
        state: customerNode.invoice_data?.state || '',
        product: customerNode.invoice_data?.product || ''
      })
    } else {
      // Auto-generate customer ID
      const prefix = 'CUST-'
      let maxNum = 1000
      allCustomers.forEach(cust => {
        const idStr = cust.invoice_no.replace(prefix, '')
        const num = parseInt(idStr, 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      })
      setFields(f => ({ ...f, customer_id: `${prefix}${maxNum + 1}` }))
    }
  }, [customerNode, isEdit, allCustomers])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not logged in");

      const payload = {
        user_id: user.id,
        invoice_no: fields.customer_id,
        invoice_data: {
          type: 'customer',
          customer_id: fields.customer_id,
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          address: fields.address,
          city: fields.city,
          state: fields.state,
          product: fields.product
        },
        total_amount: 0
      }

      if (isEdit) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', customerNode.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('invoices').insert(payload)
        if (error) throw error
      }
      onSave()
    } catch (err) {
      alert("Error saving customer: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-5">
          <h3 className="text-lg font-bold text-gray-950">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-650 font-bold text-lg">×</button>
        </div>
        
        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5">
          <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Customer ID *</label>
              <input 
                type="text" 
                value={fields.customer_id} 
                onChange={e => setFields({...fields, customer_id: e.target.value})} 
                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none font-mono"
                required 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Name *</label>
              <input 
                type="text" 
                value={fields.name} 
                onChange={e => setFields({...fields, name: e.target.value})} 
                placeholder="e.g. Acme Corporation"
                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Email *</label>
                <input 
                  type="email" 
                  value={fields.email} 
                  onChange={e => setFields({...fields, email: e.target.value})} 
                  placeholder="e.g. info@acme.com"
                  className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  required 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Phone *</label>
                <input 
                  type="text" 
                  value={fields.phone} 
                  onChange={e => setFields({...fields, phone: e.target.value})} 
                  placeholder="e.g. 9876543210"
                  className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Billing Address *</label>
              <textarea 
                value={fields.address} 
                onChange={e => setFields({...fields, address: e.target.value})} 
                placeholder="Street Address..."
                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                rows="2"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">City *</label>
                <input 
                  type="text" 
                  value={fields.city} 
                  onChange={e => setFields({...fields, city: e.target.value})} 
                  placeholder="e.g. Vadodara"
                  className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  required 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">State *</label>
                <select
                  value={fields.state}
                  onChange={e => setFields({...fields, state: e.target.value})}
                  className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Product / Subscription Plan</label>
              <input 
                type="text" 
                value={fields.product} 
                onChange={e => setFields({...fields, product: e.target.value})} 
                placeholder="e.g. SaaS Premium Plan"
                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer (Sticky) */}
        <div className="flex gap-2 justify-end p-5 border-t bg-gray-50 rounded-b-xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 bg-white"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="customer-form"
            disabled={loading}
            className="px-4 py-2 bg-purple-650 text-white rounded-lg text-xs font-bold hover:bg-purple-750 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Customer'}
          </button>
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
  
  // Profile lock/unlock state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [settingsTab, setSettingsTab] = useState('business')
  const [saasSettings, setSaasSettings] = useState(() => {
    const saved = localStorage.getItem('saas_receipt_settings')
    return saved ? JSON.parse(saved) : {
      productName: '',
      planName: '',
      amount: '',
      planDuration: '1',
      planType: 'monthly',
      removeSignatureStamp: true,
      isSystemGenerated: true
    }
  })
  
  const [invoices, setInvoices] = useState([]) 
  const [stats, setStats] = useState({ total: 0, revenue: 0 })
  const [activeTab, setActiveTab] = useState('invoices') // 'invoices', 'receipts', 'customers'
  const [customerModal, setCustomerModal] = useState({ isOpen: false, customer: null }) // modal for customer create/edit
  
  const allInvoices = useMemo(() => invoices.filter(inv => inv.invoice_data?.type !== 'receipt' && inv.invoice_data?.type !== 'customer'), [invoices]);
  const allReceipts = useMemo(() => invoices.filter(inv => inv.invoice_data?.type === 'receipt'), [invoices]);
  const allCustomers = useMemo(() => invoices.filter(inv => inv.invoice_data?.type === 'customer'), [invoices]);

  const getCustomerInvoiceCount = (customer) => {
    return allInvoices.filter(inv => 
        inv.invoice_data?.buyer_email === customer.email || 
        inv.invoice_data?.buyer_name === customer.name ||
        inv.invoice_data?.customerId === customer.customer_id
    ).length;
  }

  const getCustomerReceiptCount = (customer) => {
    return allReceipts.filter(rec => 
        rec.invoice_data?.buyer_email === customer.email || 
        rec.invoice_data?.buyer_name === customer.name ||
        rec.invoice_data?.customerId === customer.customer_id
    ).length;
  }
  
  const statusData = useMemo(() => processStatusData(invoices), [invoices]);
  const topClients = useMemo(() => processTopClients(invoices), [invoices]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single()
    if (data) {
      setValue('business_name', data.business_name)
      setValue('business_address', localStorage.getItem('business_address') || '')
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
      
      // Lock profile if data exists, unlock if new user
      setIsEditingProfile(!data.business_name)
    } else {
        setIsEditingProfile(true)
    }
    setLoading(false)
  }

  const fetchInvoices = async (userId) => {
    const { data } = await supabase.from('invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) {
        setInvoices(data)
        const docs = data.filter(inv => inv.invoice_data?.type !== 'customer')
        const totalRev = docs.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
        setStats({ total: docs.length, revenue: totalRev })
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
      const { business_address, ...dbData } = formData
      localStorage.setItem('business_address', business_address || '')
      const { error } = await supabase.from('users').upsert({ id: session.user.id, ...dbData })
      if (error) throw error
      showPopup('Saved', 'Business Profile Saved Successfully!', 'success')
      setIsEditingProfile(false) // Lock after save
    } catch (error) {
      showPopup('Error', error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const cycleStatus = async (e, invoice) => {
      e.stopPropagation();
      
      const isReceipt = invoice.invoice_data?.type === 'receipt';
      const statusOrder = isReceipt ? ['PAID', 'REFUNDED'] : ['PENDING', 'PAID', 'OVERDUE'];
      const currentStatus = invoice.status || (isReceipt ? 'PAID' : 'PENDING');
      const nextStatus = statusOrder[(statusOrder.indexOf(currentStatus) + 1) % statusOrder.length];

      try {
          setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, status: nextStatus } : inv));
          const { error } = await supabase.from('invoices').update({ status: nextStatus }).eq('id', invoice.id);
          if (error) throw error;
      } catch {
          setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, status: currentStatus } : inv));
          showPopup('Error', 'Failed to update status', 'error');
      }
  }

  const getStatusBadgeStyles = (status) => {
      switch(status) {
          case 'PAID': return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
          case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200';
          case 'REFUNDED': return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
          default: return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200';
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

  const getFilteredInvoices = () => {
    const listToFilter = activeTab === 'invoices' ? allInvoices : activeTab === 'receipts' ? allReceipts : allCustomers;
    return listToFilter.filter(inv => {
        const searchLower = searchTerm.toLowerCase().trim()
        if (activeTab === 'customers') {
            const c = inv.invoice_data || {};
            const matchesSearch = 
                !searchLower ||
                (inv.invoice_no || '').toLowerCase().includes(searchLower) ||
                (c.name || '').toLowerCase().includes(searchLower) ||
                (c.email || '').toLowerCase().includes(searchLower) ||
                (c.phone || '').toLowerCase().includes(searchLower) ||
                (c.product || '').toLowerCase().includes(searchLower);
            return matchesSearch;
        }

        const matchesSearch = 
            !searchLower ||
            inv.invoice_no.toLowerCase().includes(searchLower) ||
            (inv.invoice_data?.buyer_name || '').toLowerCase().includes(searchLower)

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

        let matchesAmount = true
        const amount = inv.total_amount || 0
        if (filters.minAmount && amount < parseFloat(filters.minAmount)) matchesAmount = false
        if (filters.maxAmount && matchesAmount && amount > parseFloat(filters.maxAmount)) matchesAmount = false

        return matchesSearch && matchesDate && matchesAmount
    })
  }

  const filteredInvoices = getFilteredInvoices()
  const activeFilterCount = (filters.startDate ? 1 : 0) + (filters.endDate ? 1 : 0) + (filters.minAmount ? 1 : 0) + (filters.maxAmount ? 1 : 0)

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('GSTR-1 Report');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Invoice No', key: 'invoice_no', width: 15 },
      { header: 'Customer Name', key: 'customer', width: 30 },
      { header: 'GSTIN', key: 'gstin', width: 20 },
      { header: 'Taxable Value', key: 'taxable', width: 15 },
      { header: 'IGST', key: 'igst', width: 12 },
      { header: 'CGST', key: 'cgst', width: 12 },
      { header: 'SGST', key: 'sgst', width: 12 },
      { header: 'Total Amount', key: 'total', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    headerRow.height = 30;

    filteredInvoices.filter(inv => inv.invoice_data?.type !== 'receipt').forEach(inv => {
        const d = inv.invoice_data || {};
        const t = d.totals || { subtotal: 0, igst: 0, cgst: 0, sgst: 0 };
        
        const row = worksheet.addRow({
            date: new Date(inv.created_at).toLocaleDateString('en-GB'),
            invoice_no: inv.invoice_no,
            customer: d.buyer_name,
            gstin: d.buyer_gstin || '-',
            taxable: parseFloat(t.subtotal || 0),
            igst: parseFloat(t.igst || 0),
            cgst: parseFloat(t.cgst || 0),
            sgst: parseFloat(t.sgst || 0),
            total: parseFloat(inv.total_amount || 0),
            status: inv.status || 'PENDING'
        });

        row.eachCell((cell, colNumber) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { vertical: 'middle', horizontal: colNumber > 4 ? 'right' : 'left' };
            
            if (colNumber >= 5 && colNumber <= 9) {
                cell.numFmt = '₹ #,##0.00';
            }
        });

        const statusCell = row.getCell(10);
        statusCell.font = { bold: true };
        statusCell.alignment = { horizontal: 'center' };
        
        if (statusCell.value === 'PAID') {
            statusCell.font.color = { argb: 'FF166534' };
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        } else if (statusCell.value === 'OVERDUE') {
            statusCell.font.color = { argb: 'FF991B1B' };
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        } else {
            statusCell.font.color = { argb: 'FF92400E' };
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `GSTR1_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 pb-20">
      
      <style>{`
        .react-datepicker-wrapper { width: 100%; }
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

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <button 
            onClick={handleLogout} 
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2 text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">₹{stats.revenue.toLocaleString('en-IN')}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative min-h-[300px]">
                <h3 className="absolute top-4 sm:top-5 left-4 sm:left-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Status</h3>
                
                {statusData.length > 0 ? (
                    <div className="w-full h-56 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" cornerRadius={5}>
                                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs font-medium text-gray-600 ml-1">{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center opacity-40">
                        <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                        <p className="text-xs font-medium">No data available</p>
                    </div>
                )}
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Top Clients by Revenue</p>
                <div className="flex-1 flex flex-col justify-center space-y-3">
                    {topClients.length === 0 ? (
                        <div className="text-center opacity-40">
                            <p className="text-xs font-medium">No clients yet.</p>
                        </div>
                    ) : (
                        topClients.map((client, idx) => (
                            <div key={idx} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3 w-3/5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : idx === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>{idx + 1}</div>
                                    <span className="font-semibold text-sm text-gray-700 truncate">{client.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-sm text-gray-900">₹{client.value.toLocaleString('en-IN')}</span>
                                    <div className="w-24 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden ml-auto">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(client.value / topClients[0].value) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            
            <div className="lg:col-span-1 bg-white p-4 sm:p-5 rounded-xl shadow-sm h-fit">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-800">
                            {settingsTab === 'business' ? 'Business Profile' : 'Receipt Defaults'}
                        </h2>
                        {settingsTab === 'business' && !isEditingProfile && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">LOCKED</span>
                        )}
                    </div>
                    {settingsTab === 'business' && (
                        !isEditingProfile ? (
                            <button 
                                onClick={() => setIsEditingProfile(true)} 
                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <button 
                                onClick={() => setIsEditingProfile(false)} 
                                className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        )
                    )}
                </div>

                <div className="flex border-b mb-4 gap-2">
                    <button 
                        onClick={() => setSettingsTab('business')} 
                        className={`flex-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-center border-b-2 transition-all ${settingsTab === 'business' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Business Profile
                    </button>
                    <button 
                        onClick={() => setSettingsTab('saas')} 
                        className={`flex-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-center border-b-2 transition-all ${settingsTab === 'saas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        SaaS Receipts
                    </button>
                </div>

                {settingsTab === 'saas' ? (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        localStorage.setItem('saas_receipt_settings', JSON.stringify(saasSettings));
                        showPopup('Saved', 'SaaS Receipt Defaults saved successfully!', 'success');
                    }} className="space-y-3">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Product Name</label>
                            <input 
                                type="text" 
                                value={saasSettings.productName} 
                                onChange={(e) => setSaasSettings({...saasSettings, productName: e.target.value})} 
                                placeholder="e.g. Pixalara" 
                                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Plan Name</label>
                            <input 
                                type="text" 
                                value={saasSettings.planName} 
                                onChange={(e) => setSaasSettings({...saasSettings, planName: e.target.value})} 
                                placeholder="e.g. Premium Plan" 
                                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Duration</label>
                                <input 
                                    type="number" 
                                    value={saasSettings.planDuration} 
                                    onChange={(e) => setSaasSettings({...saasSettings, planDuration: e.target.value})} 
                                    placeholder="e.g. 1" 
                                    className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                                    min="1" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Billing Cycle</label>
                                <select 
                                    value={saasSettings.planType} 
                                    onChange={(e) => setSaasSettings({...saasSettings, planType: e.target.value})} 
                                    className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Default Amount</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                value={saasSettings.amount} 
                                onChange={(e) => setSaasSettings({...saasSettings, amount: e.target.value})} 
                                placeholder="e.g. 4999.00" 
                                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                                required 
                            />
                        </div>
                        <div className="pt-2 space-y-2 border-t mt-2">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="remove_sig_stamp" 
                                    checked={saasSettings.removeSignatureStamp} 
                                    onChange={(e) => setSaasSettings({...saasSettings, removeSignatureStamp: e.target.checked})} 
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer" 
                                />
                                <label htmlFor="remove_sig_stamp" className="text-xs font-bold text-gray-700 cursor-pointer">Remove Signature & Stamp</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="is_sys_gen" 
                                    checked={saasSettings.isSystemGenerated} 
                                    onChange={(e) => setSaasSettings({...saasSettings, isSystemGenerated: e.target.checked})} 
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer" 
                                />
                                <label htmlFor="is_sys_gen" className="text-xs font-bold text-gray-700 cursor-pointer">Show "System Generated" Notice</label>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-700 mt-4">Save SaaS Defaults</button>
                    </form>
                ) : (
                    <>
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
                            <input {...register('business_name')} disabled={!isEditingProfile} placeholder="BUSINESS NAME" onChange={(e) => enforceLettersOnly(e, 'business_name')} className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`} />
                            <textarea {...register('business_address')} disabled={!isEditingProfile} placeholder="BUSINESS ADDRESS" className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`} rows="2" />
                            <input {...register('business_email')} disabled={!isEditingProfile} placeholder="BUSINESS EMAIL" className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`} />
                            <input {...register('business_phone')} disabled={!isEditingProfile} placeholder="BUSINESS PHONE" onChange={(e) => enforceNumbersOnly(e, 'business_phone')} maxLength={10} className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`} />
                            <input {...register('website')} disabled={!isEditingProfile} placeholder="WEBSITE" className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`} />
                            <input {...register('gstin')} disabled={!isEditingProfile} placeholder="GSTIN" onChange={(e) => enforceUpperCase(e, 'gstin')} className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`} />
                            <select {...register('state')} disabled={!isEditingProfile} className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`}><option value="">Select State</option>{INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select>

                            <div className="pt-4 border-t mt-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bank Details</h3>
                                <div className="space-y-2">
                                    <input {...register('bank_name')} disabled={!isEditingProfile} placeholder="BANK NAME" onChange={(e) => enforceCapitalLetters(e, 'bank_name')} className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`} />
                                    <input {...register('account_number')} disabled={!isEditingProfile} placeholder="ACCOUNT NUMBER" onChange={(e) => enforceNumbersOnly(e, 'account_number')} className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`} />
                                    <input {...register('ifsc_code')} disabled={!isEditingProfile} placeholder="IFSC CODE" onChange={(e) => enforceUpperCase(e, 'ifsc_code')} className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`} />
                                    <input {...register('branch_name')} disabled={!isEditingProfile} placeholder="BRANCH NAME" onChange={(e) => enforceCapitalLetters(e, 'branch_name')} className={`w-full p-2 border rounded text-sm ${!isEditingProfile ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`} />
                                </div>
                            </div>

                            <div className="pt-4 border-t mt-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" {...register('print_duplicates')} disabled={!isEditingProfile} id="print_dup" className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                                    <label htmlFor="print_dup" className="text-xs font-bold text-gray-700 cursor-pointer">Generate Original & Duplicate?</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" {...register('print_triplicates')} disabled={!isEditingProfile} id="print_trip" className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                                    <label htmlFor="print_trip" className="text-xs font-bold text-gray-700 cursor-pointer">Generate Triplicate Copy?</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" {...register('enable_manual_invoice_no')} disabled={!isEditingProfile} id="manual_inv" className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                                    <label htmlFor="manual_inv" className="text-xs font-bold text-gray-700 cursor-pointer">Enable Manual Invoice Number Entry?</label>
                                </div>
                            </div>

                            {isEditingProfile && (
                                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-700 mt-4">Save Profile</button>
                            )}
                        </form>
                    </>
                )}
            </div>

            <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => navigate('/create-invoice')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                        <span className="text-xl">+</span> Create GST Invoice
                    </button>
                    <button onClick={() => navigate('/create-receipt')} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                        <span className="text-xl">+</span> Generate SaaS Receipt
                    </button>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 relative">
                                  <div className="p-4 border-b bg-gray-50/50 space-y-3 rounded-t-xl">
                        {/* Tab Selector */}
                        <div className="flex border-b border-gray-200 gap-2 mb-2">
                            <button 
                                onClick={() => { setActiveTab('invoices'); setSearchTerm(''); }}
                                className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'invoices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                GST Invoices ({allInvoices.length})
                            </button>
                            <button 
                                onClick={() => { setActiveTab('receipts'); setSearchTerm(''); }}
                                className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'receipts' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                SaaS Receipts ({allReceipts.length})
                            </button>
                            <button 
                                onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
                                className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'customers' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                Customers ({allCustomers.length})
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                            <h3 className="font-bold text-gray-700 text-sm">
                                {activeTab === 'invoices' ? 'All Invoices' : activeTab === 'receipts' ? 'All Receipts' : 'All Customers'} ({filteredInvoices.length})
                            </h3>
                            <div className="flex gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input 
                                        type="text" 
                                        placeholder={activeTab === 'customers' ? "Search Name, Email, ID..." : "Search Customer or Doc #"} 
                                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {activeTab !== 'customers' && (
                                    <>
                                        <button 
                                            onClick={handleExport}
                                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium flex items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Export
                                        </button>
                                        <button 
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                            Filters {activeFilterCount > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
                                        </button>
                                    </>
                                )}
                                {activeTab === 'customers' && (
                                    <button 
                                        type="button"
                                        onClick={() => setCustomerModal({ isOpen: true, customer: null })}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-750 text-white rounded-lg text-sm font-bold shadow transition-colors flex items-center gap-1 active:scale-95 transform"
                                    >
                                        <span>+</span> Add Customer
                                    </button>
                                )}
                            </div>
                        </div>

                        {activeTab !== 'customers' && showFilters && (
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

                    {filteredInvoices.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center opacity-60">
                            <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="text-gray-500 text-sm font-medium">No documents found matching your search.</p>
                            <button onClick={() => { setSearchTerm(''); setFilters({ startDate: null, endDate: null, minAmount: '', maxAmount: '' }) }} className="mt-2 text-blue-600 text-xs font-bold hover:underline">Reset Filters</button>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'customers' ? (
                                <table className="hidden md:table w-full text-left text-sm rounded-b-xl overflow-hidden">
                                    <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs border-b border-gray-100">
                                        <tr>
                                            <th className="px-5 py-3">ID</th>
                                            <th className="px-5 py-3">Name</th>
                                            <th className="px-5 py-3">Email</th>
                                            <th className="px-5 py-3">Phone</th>
                                            <th className="px-5 py-3 text-center">Plan</th>
                                            <th className="px-5 py-3 text-center">Invoices</th>
                                            <th className="px-5 py-3 text-center">Receipts</th>
                                            <th className="px-5 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredInvoices.map((inv) => {
                                            const c = inv.invoice_data || {};
                                            return (
                                                <tr key={inv.id} className="hover:bg-purple-50 transition-colors">
                                                    <td className="px-5 py-3 font-bold text-purple-600 font-mono">{inv.invoice_no}</td>
                                                    <td className="px-5 py-3 font-bold text-gray-800">{c.name}</td>
                                                    <td className="px-5 py-3 text-gray-600">{c.email}</td>
                                                    <td className="px-5 py-3 text-gray-650">{c.phone || '-'}</td>
                                                    <td className="px-5 py-3 text-center font-medium text-gray-700">{c.product || '-'}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                                                            {getCustomerInvoiceCount(c)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                                                            {getCustomerReceiptCount(c)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); setCustomerModal({ isOpen: true, customer: inv }); }} 
                                                                className="text-gray-500 hover:text-blue-600 p-1 px-2.5 hover:bg-blue-50 rounded transition-all font-semibold text-xs border"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(inv.id, e); }} 
                                                                className="text-gray-505 hover:text-red-600 p-1 px-2.5 hover:bg-red-50 rounded transition-all font-semibold text-xs border"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="hidden md:table w-full text-left text-sm rounded-b-xl overflow-hidden">
                                    <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs border-b">
                                        <tr>
                                            <th className="px-5 py-3">Date</th>
                                            <th className="px-5 py-3">Doc #</th>
                                            <th className="px-5 py-3">Customer</th>
                                            <th className="px-5 py-3 text-center">Status</th>
                                            <th className="px-5 py-3 text-right">Amount</th>
                                            <th className="px-5 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredInvoices.map((inv) => (
                                            <tr key={inv.id} onClick={() => navigate(inv.invoice_data?.type === 'receipt' ? `/edit-receipt/${inv.id}` : `/edit-invoice/${inv.id}`)} className="hover:bg-blue-50 cursor-pointer group transition-colors">
                                                <td className="px-5 py-3 text-gray-600">{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                                                <td className="px-5 py-3 font-bold text-blue-600 group-hover:underline">
                                                    <div className="flex items-center gap-2">
                                                        <span>{inv.invoice_no}</span>
                                                        {inv.invoice_data?.type === 'receipt' ? (
                                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold border border-emerald-200">RECEIPT</span>
                                                        ) : (
                                                            <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold border border-blue-200">INVOICE</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 font-medium text-gray-800">{inv.invoice_data?.buyer_name}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <button 
                                                        onClick={(e) => cycleStatus(e, inv)}
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide transition-all active:scale-95 ${getStatusBadgeStyles(inv.status || (inv.invoice_data?.type === 'receipt' ? 'PAID' : 'PENDING'))}`}
                                                    >
                                                        {inv.status || (inv.invoice_data?.type === 'receipt' ? 'PAID' : 'PENDING')}
                                                    </button>
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-gray-900">
                                                    {inv.invoice_data?.type === 'receipt' ? (inv.invoice_data?.currencySymbol || '$') : '₹'}
                                                    {inv.total_amount}
                                                </td>
                                                <td className="px-5 py-3 text-center"><button onClick={(e) => handleDeleteClick(inv.id, e)} className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-all">🗑️</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {activeTab === 'customers' ? (
                                <div className="md:hidden divide-y divide-gray-100 rounded-b-xl overflow-hidden">
                                    {filteredInvoices.map((inv) => {
                                        const c = inv.invoice_data || {};
                                        return (
                                            <div key={inv.id} className="p-4 hover:bg-purple-50 transition-colors">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-purple-650 text-sm font-mono">{inv.invoice_no}</span>
                                                    <div className="flex gap-2">
                                                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                                                            Inv: {getCustomerInvoiceCount(c)}
                                                        </span>
                                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                                                            Rec: {getCustomerReceiptCount(c)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-bold text-gray-800">{c.name}</span>
                                                        <span className="text-xs text-gray-500">{c.email} {c.phone && `• ${c.phone}`}</span>
                                                        {c.product && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-1">{c.product}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setCustomerModal({ isOpen: true, customer: inv }); }} 
                                                            className="text-blue-600 hover:underline p-1 text-xs font-bold"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(inv.id, e); }} 
                                                            className="text-red-650 hover:underline p-1 text-xs font-bold"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="md:hidden divide-y divide-gray-100 rounded-b-xl overflow-hidden">
                                    {filteredInvoices.map((inv) => (
                                        <div key={inv.id} onClick={() => navigate(inv.invoice_data?.type === 'receipt' ? `/edit-receipt/${inv.id}` : `/edit-invoice/${inv.id}`)} className="p-4 active:bg-blue-50 transition-colors cursor-pointer">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-blue-600 text-sm">#{inv.invoice_no}</span>
                                                    {inv.invoice_data?.type === 'receipt' ? (
                                                        <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1 py-0.5 rounded font-bold border border-emerald-200">RECEIPT</span>
                                                    ) : (
                                                        <span className="bg-blue-100 text-blue-800 text-[9px] px-1 py-0.5 rounded font-bold border border-blue-200">INVOICE</span>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={(e) => cycleStatus(e, inv)}
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadgeStyles(inv.status || (inv.invoice_data?.type === 'receipt' ? 'PAID' : 'PENDING'))}`}
                                                >
                                                    {inv.status || (inv.invoice_data?.type === 'receipt' ? 'PAID' : 'PENDING')}
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-semibold text-gray-800">{inv.invoice_data?.buyer_name}</span>
                                                    <span className="text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString('en-IN')}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-gray-900 text-base">
                                                        {inv.invoice_data?.type === 'receipt' ? (inv.invoice_data?.currencySymbol || '$') : '₹'}
                                                        {inv.total_amount}
                                                    </span>
                                                    <button onClick={(e) => handleDeleteClick(inv.id, e)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* CUSTOMER FORM MODAL */}
        {customerModal.isOpen && (
            <CustomerFormModal 
                customerNode={customerModal.customer} 
                onClose={() => setCustomerModal({ isOpen: false, customer: null })}
                onSave={() => {
                    setCustomerModal({ isOpen: false, customer: null });
                    supabase.auth.getUser().then(({ data: { user } }) => {
                        if (user) fetchInvoices(user.id);
                    });
                }}
                allCustomers={allCustomers}
            />
        )}
      </div>
      
      <BrandingFooter />

    </div>
  )
}