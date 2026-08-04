import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { INDIAN_STATES, BILLING_KINDS, normalizeBillingKind, isServiceKind } from '../constants'
import { EXPENSE_TYPE, getExpenseDate } from '../data/expenses'
import { formatCompactINR, fxToInr } from '../data/currency'
import BillingKindSelector from '../components/BillingKindSelector'
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Bar, Line, XAxis, YAxis, CartesianGrid, ComposedChart } from 'recharts'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import BrandingFooter from '../components/BrandingFooter'
import ModuleNav from '../components/ModuleNav'

/**
 * Record types stored in the `invoices` table that are NOT sales invoices.
 * 'receipt' is a billing document but not an invoice; the rest are ledgers.
 * Any new type added to this table must be registered here.
 */
const NON_BILLING_TYPES = ['receipt', 'customer', 'product', EXPENSE_TYPE]
/** Types excluded from the combined invoices + receipts view. */
const NON_BILLING_LEDGER_TYPES = ['customer', 'product', EXPENSE_TYPE]

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

/**
 * The single source of truth for a document's payment status.
 *
 * Receipts are proof of payment, so they are PAID unless explicitly refunded.
 * New receipts persist status: 'PAID' on insert, but ones saved before that
 * change have a null status — hence the fallback, which keeps existing data
 * reading correctly rather than showing up as Pending.
 *
 * Every consumer (table badges, status chart, Excel export, status cycling)
 * must go through this. Two of them previously disagreed: the table showed a
 * receipt as Paid while the chart counted the same receipt as Pending.
 */
const resolveDocStatus = (doc) => {
    if (doc?.status) return doc.status;
    return doc?.invoice_data?.type === 'receipt' ? 'PAID' : 'PENDING';
};

// --- ANALYTICS DATA PROCESSORS ---
const processStatusData = (invoices) => {
    const data = [
        { name: 'Paid', value: 0, color: '#10b981' },
        { name: 'Pending', value: 0, color: '#f59e0b' },
        { name: 'Overdue', value: 0, color: '#ef4444' },
        { name: 'Refunded', value: 0, color: '#6b7280' }
    ];

    invoices.forEach(inv => {
        const status = resolveDocStatus(inv);
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
    pincode: ''
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
        pincode: customerNode.invoice_data?.pincode || ''
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
          pincode: fields.pincode
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
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
        </div>
        
        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5">
          <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Customer ID (Auto-Generated)</label>
              <input 
                type="text" 
                value={fields.customer_id} 
                disabled 
                className="w-full p-2 border rounded text-sm bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed outline-none font-mono font-bold"
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
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Pincode *</label>
              <input 
                type="text" 
                value={fields.pincode} 
                onChange={e => setFields({...fields, pincode: e.target.value})} 
                placeholder="e.g. 390007"
                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                required 
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductFormModal({ productNode, onClose, onSave, allProducts }) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!productNode;
  // Master records are products/plans only. Service work is described per
  // document because its scope changes for every customer, so there is nothing
  // stable to save here.
  const [fields, setFields] = useState({
    product_id: '',
    name: '',
    price: '',
    hsn_sac: '',
    tax_rate: '18'
  })

  useEffect(() => {
    if (isEdit && productNode) {
      setFields({
        product_id: productNode.invoice_no,
        name: productNode.invoice_data?.name || '',
        price: productNode.invoice_data?.price || '',
        hsn_sac: productNode.invoice_data?.hsn_sac || '',
        tax_rate: productNode.invoice_data?.tax_rate || '18'
      })
    } else {
      // Auto-generate product ID
      const prefix = 'PROD-'
      let maxNum = 1000
      allProducts.forEach(prod => {
        const idStr = prod.invoice_no.replace(prefix, '')
        const num = parseInt(idStr, 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      })
      setFields(f => ({ ...f, product_id: `${prefix}${maxNum + 1}` }))
    }
  }, [productNode, isEdit, allProducts])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not logged in");

      const payload = {
        user_id: user.id,
        invoice_no: fields.product_id,
        invoice_data: {
          type: 'product',
          product_id: fields.product_id,
          name: fields.name,
          price: parseFloat(fields.price || 0),
          hsn_sac: fields.hsn_sac,
          tax_rate: parseFloat(fields.tax_rate || 18)
        },
        total_amount: parseFloat(fields.price || 0)
      }

      if (isEdit) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', productNode.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('invoices').insert(payload)
        if (error) throw error
      }
      onSave()
    } catch (err) {
      alert("Error saving product: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-5">
          <h3 className="text-lg font-bold text-gray-950">{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
        </div>
        
        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Product ID (Auto-Generated)</label>
              <input 
                type="text" 
                value={fields.product_id} 
                disabled 
                className="w-full p-2 border rounded text-sm bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed outline-none font-mono font-bold"
                required 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                Product Name *
              </label>
              <input 
                type="text" 
                value={fields.name} 
                onChange={e => setFields({...fields, name: e.target.value})} 
                placeholder="e.g. Pixalara Pro"
                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                  Price (INR) *
                </label>
                <input 
                  type="number" 
                  value={fields.price} 
                  onChange={e => setFields({...fields, price: e.target.value})} 
                  placeholder="e.g. 15000"
                  className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  required 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                  HSN/SAC Code
                </label>
                <input 
                  type="text" 
                  value={fields.hsn_sac} 
                  onChange={e => setFields({...fields, hsn_sac: e.target.value})} 
                  placeholder="e.g. 998311"
                  className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Default GST Tax Rate (%) *</label>
              <select
                value={fields.tax_rate}
                onChange={e => setFields({...fields, tax_rate: e.target.value})}
                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                required
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
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
            form="product-form"
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Product'}
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
    const defaults = {
      billingKind: BILLING_KINDS.SAAS,
      productName: '',
      planName: '',
      amount: '',
      planDuration: '1',
      planType: 'monthly',
      removeSignatureStamp: true,
      isSystemGenerated: true
    }
    const saved = localStorage.getItem('saas_receipt_settings')
    if (!saved) return defaults
    try {
      const parsed = JSON.parse(saved)
      return { ...defaults, ...parsed, billingKind: normalizeBillingKind(parsed.billingKind) }
    } catch {
      return defaults
    }
  })
  const saasIsService = isServiceKind(saasSettings.billingKind)
  
  const [invoices, setInvoices] = useState([]) 
  const [activeTab, setActiveTab] = useState('invoices') // 'invoices', 'receipts', 'customers', 'products'
  const [customerModal, setCustomerModal] = useState({ isOpen: false, customer: null }) // modal for customer create/edit
  const [productModal, setProductModal] = useState({ isOpen: false, product: null }) // modal for product create/edit
  
  // `allInvoices` and `billingDocuments` are NEGATIVE filters, so every
  // non-billing record type must be listed here or it gets counted as revenue.
  // Adding 'expense' without this would inflate invoice count, invoiced value,
  // tax collections, top clients and the Excel export.
  const allInvoices = useMemo(() => invoices.filter(inv => !NON_BILLING_TYPES.includes(inv.invoice_data?.type)), [invoices]);
  const allReceipts = useMemo(() => invoices.filter(inv => inv.invoice_data?.type === 'receipt'), [invoices]);
  const allCustomers = useMemo(() => invoices.filter(inv => inv.invoice_data?.type === 'customer'), [invoices]);
  const allProducts = useMemo(() => invoices.filter(inv => inv.invoice_data?.type === 'product'), [invoices]);
  const allExpenses = useMemo(() => invoices.filter(inv => inv.invoice_data?.type === EXPENSE_TYPE), [invoices]);
  const billingDocuments = useMemo(() => invoices.filter(inv => !NON_BILLING_LEDGER_TYPES.includes(inv.invoice_data?.type)), [invoices]);

  const invoicesStats = useMemo(() => {
    const count = allInvoices.length
    const totalAmount = allInvoices.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
    return { count, totalAmount }
  }, [allInvoices])

  // Expenses summary for the current financial year, surfaced on the dashboard
  // so spend is visible next to revenue rather than only inside the module.
  const expenseStats = useMemo(() => {
    const fyStart = new Date(
      new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1,
      3, 1
    )
    let fyTotal = 0
    let itc = 0
    let unpaid = 0
    allExpenses.forEach(e => {
      const amount = parseFloat(e.total_amount || 0)
      if (getExpenseDate(e) >= fyStart) fyTotal += amount
      if (e.invoice_data?.itcEligible) itc += parseFloat(e.invoice_data?.gstAmount || 0)
      if ((e.status || e.invoice_data?.paymentStatus) === 'PENDING') unpaid += amount
    })
    return { count: allExpenses.length, fyTotal, itc, unpaid }
  }, [allExpenses])

  const receiptsStats = useMemo(() => {
    const count = allReceipts.length
    const totalsByCurrency = {}
    allReceipts.forEach(r => {
      const currency = r.invoice_data?.currency || 'INR'
      const symbol = r.invoice_data?.currencySymbol || '₹'
      if (!totalsByCurrency[currency]) {
        totalsByCurrency[currency] = { symbol, amount: 0 }
      }
      totalsByCurrency[currency].amount += parseFloat(r.total_amount || 0)
    })
    return { count, totalsByCurrency }
  }, [allReceipts])

  const monthlyTrends = useMemo(() => {
    const map = {}
    
    allInvoices.forEach(inv => {
      const date = new Date(inv.created_at || new Date())
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!map[key]) {
        map[key] = { key, label, invoiceAmount: 0, invoiceCount: 0, receiptAmount: 0, receiptCount: 0 }
      }
      map[key].invoiceAmount += parseFloat(inv.total_amount || 0)
      map[key].invoiceCount += 1
    })

    allReceipts.forEach(rec => {
      const date = new Date(rec.created_at || new Date())
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!map[key]) {
        map[key] = { key, label, invoiceAmount: 0, invoiceCount: 0, receiptAmount: 0, receiptCount: 0 }
      }
      const currency = rec.invoice_data?.currency || 'INR'
      map[key].receiptAmount += parseFloat(rec.total_amount || 0) * fxToInr(currency)
      map[key].receiptCount += 1
    })

    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key))
  }, [allInvoices, allReceipts])

  // Revenue broken down by line item AND grouped by what was sold: a recurring
  // product/plan versus one-off service work. Products get a blue ramp and
  // services a violet ramp, so the donut reads as a split at a glance.
  //
  // Receipts saved before the SaaS/Service switch existed carry no billingKind
  // and fall back to Product, matching normalizeBillingKind elsewhere.
  const revenueSplit = useMemo(() => {
    const PRODUCT_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8']
    const SERVICE_COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#6d28d9']

    const groups = {
      [BILLING_KINDS.SAAS]: { kind: BILLING_KINDS.SAAS, label: 'Products', total: 0, items: {} },
      [BILLING_KINDS.SERVICE]: { kind: BILLING_KINDS.SERVICE, label: 'Services', total: 0, items: {} },
    }

    allReceipts.forEach(r => {
      const d = r.invoice_data || {}
      const kind = normalizeBillingKind(d.billingKind)
      const isSvc = kind === BILLING_KINDS.SERVICE
      const name = d.productName || (isSvc ? 'Other Service' : 'Other Product')
      const currency = d.currency || 'INR'
      const raw = parseFloat(r.total_amount || 0)
      const inr = raw * fxToInr(currency)

      const group = groups[kind]
      group.total += inr
      if (!group.items[name]) {
        group.items[name] = { name, kind, value: 0, displayByCurrency: {} }
      }
      group.items[name].value += inr
      group.items[name].displayByCurrency[currency] =
        (group.items[name].displayByCurrency[currency] || 0) + raw
    })

    // Largest first within each group, products before services.
    const build = (group, palette) =>
      Object.values(group.items)
        .sort((a, b) => b.value - a.value)
        .map((item, idx) => ({
          ...item,
          value: parseFloat(item.value.toFixed(2)),
          color: palette[idx % palette.length],
        }))

    const productItems = build(groups[BILLING_KINDS.SAAS], PRODUCT_COLORS)
    const serviceItems = build(groups[BILLING_KINDS.SERVICE], SERVICE_COLORS)
    const productTotal = parseFloat(groups[BILLING_KINDS.SAAS].total.toFixed(2))
    const serviceTotal = parseFloat(groups[BILLING_KINDS.SERVICE].total.toFixed(2))
    const total = productTotal + serviceTotal

    return {
      items: [...productItems, ...serviceItems],
      groups: [
        { label: 'Products', kind: BILLING_KINDS.SAAS, total: productTotal, items: productItems, accent: '#2563eb' },
        { label: 'Services', kind: BILLING_KINDS.SERVICE, total: serviceTotal, items: serviceItems, accent: '#7c3aed' },
      ],
      productTotal,
      serviceTotal,
      total,
      productShare: total > 0 ? (productTotal / total) * 100 : 0,
    }
  }, [allReceipts])

  const taxCollectionData = useMemo(() => {
    let cgst = 0, sgst = 0, igst = 0, saasTax = 0
    allInvoices.forEach(inv => {
      const t = inv.invoice_data?.totals || {}
      cgst += parseFloat(t.cgst || 0)
      sgst += parseFloat(t.sgst || 0)
      igst += parseFloat(t.igst || 0)
    })
    allReceipts.forEach(rec => {
      const taxAmt = parseFloat(rec.invoice_data?.taxAmount || 0)
      const currency = rec.invoice_data?.currency || 'INR'
      saasTax += taxAmt * fxToInr(currency)
    })

    const data = [
      { name: 'CGST (Invoices)', value: parseFloat(cgst.toFixed(2)), color: '#3b82f6' },
      { name: 'SGST (Invoices)', value: parseFloat(sgst.toFixed(2)), color: '#60a5fa' },
      { name: 'IGST (Invoices)', value: parseFloat(igst.toFixed(2)), color: '#1d4ed8' }
    ]

    if (saasTax > 0) {
      data.push({ name: 'Receipt Tax (Receipts)', value: parseFloat(saasTax.toFixed(2)), color: '#10b981' })
    }

    return data.filter(item => item.value > 0)
  }, [allInvoices, allReceipts])

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
  
  const statusData = useMemo(() => processStatusData(billingDocuments), [billingDocuments]);
  const topClients = useMemo(() => processTopClients(billingDocuments), [billingDocuments]);

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
      const currentStatus = resolveDocStatus(invoice);
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
    const listToFilter = 
        activeTab === 'invoices' ? allInvoices : 
        activeTab === 'receipts' ? allReceipts : 
        activeTab === 'customers' ? allCustomers : 
        allProducts;
    return listToFilter.filter(inv => {
        const searchLower = searchTerm.toLowerCase().trim()
        if (activeTab === 'customers') {
            const c = inv.invoice_data || {};
            const matchesSearch = 
                !searchLower ||
                (inv.invoice_no || '').toLowerCase().includes(searchLower) ||
                (c.name || '').toLowerCase().includes(searchLower) ||
                (c.email || '').toLowerCase().includes(searchLower) ||
                (c.phone || '').toLowerCase().includes(searchLower);
            return matchesSearch;
        }
        if (activeTab === 'products') {
            const p = inv.invoice_data || {};
            const matchesSearch = 
                !searchLower ||
                (inv.invoice_no || '').toLowerCase().includes(searchLower) ||
                (p.name || '').toLowerCase().includes(searchLower) ||
                (p.hsn_sac || '').toLowerCase().includes(searchLower);
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
            status: resolveDocStatus(inv)
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
    <div className="min-h-screen bg-slate-50/50 p-3 sm:p-4 md:p-6 pb-20 relative overflow-hidden">
      {/* Premium background decorative glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-200/15 to-purple-200/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-200/10 to-teal-200/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] left-[45%] w-[500px] h-[500px] rounded-full bg-amber-200/10 blur-[100px] pointer-events-none z-0"></div>
      
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

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">Dashboard</h1>
            {/* Same module switcher as Expenses and Analytics, so the three
                modules are reachable from each other without a detour. */}
            <ModuleNav current="dashboard" />
          </div>
          <div className="flex flex-row items-center gap-3 justify-end">
            <button 
              onClick={() => setCustomerModal({ isOpen: true, customer: null })}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-5 py-3 rounded-xl shadow-md hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 text-sm md:text-base shrink-0 border border-indigo-500/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Customer
            </button>
            <button 
              onClick={handleLogout} 
              className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 text-sm md:text-base shrink-0 border border-red-500/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {/* Total Invoices Card */}
            <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-lg hover:shadow-indigo-500/5 border border-gray-100/80 flex flex-row items-center justify-between transition-all duration-300 hover:-translate-y-1 group border-l-4 border-l-indigo-500">
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Total Invoices</p>
                        <p className="text-3xl font-extrabold text-gray-950 mt-2 tracking-tight group-hover:text-indigo-600 transition-colors duration-200">{invoicesStats.count}</p>
                    </div>
                    <div className="mt-4 text-[11px] text-gray-400 font-semibold flex items-center gap-1.5">
                        <span className="text-[10px] bg-indigo-50/70 text-indigo-600 px-2 py-0.5 rounded-full font-bold border border-indigo-100/50">INR</span>
                        <span>GST Invoices</span>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
            </div>
            
            {/* Total Invoiced Amount Card */}
            <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-lg hover:shadow-blue-500/5 border border-gray-100/80 flex flex-row items-center justify-between transition-all duration-300 hover:-translate-y-1 group border-l-4 border-l-blue-500">
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Invoiced Value</p>
                        <p className="text-2xl font-extrabold text-blue-600 mt-2 tracking-tight">₹{invoicesStats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="mt-4 text-[11px] text-gray-400 font-semibold flex items-center gap-1.5">
                        <span className="text-[10px] bg-blue-50/70 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100/50">GST</span>
                        <span>Total Billings</span>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/50 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
            
            {/* Total Receipts Card */}
            <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-lg hover:shadow-emerald-500/5 border border-gray-100/80 flex flex-row items-center justify-between transition-all duration-300 hover:-translate-y-1 group border-l-4 border-l-emerald-500">
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Total Receipts</p>
                        <p className="text-3xl font-extrabold text-gray-950 mt-2 tracking-tight group-hover:text-emerald-600 transition-colors duration-200">{receiptsStats.count}</p>
                    </div>
                    <div className="mt-4 text-[11px] text-gray-400 font-semibold flex items-center gap-1.5">
                        <span className="text-[10px] bg-emerald-50/70 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100/50">Receipt</span>
                        <span>Paid Ledgers</span>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                </div>
            </div>
            
            {/* Realized Revenue Card */}
            <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-lg hover:shadow-teal-500/5 border border-gray-100/80 flex flex-row items-center justify-between transition-all duration-300 hover:-translate-y-1 group border-l-4 border-l-teal-500">
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Realized Revenue</p>
                        <div className="mt-2 flex flex-col gap-0.5">
                            {Object.keys(receiptsStats.totalsByCurrency).length === 0 ? (
                                <p className="text-2xl font-extrabold text-emerald-600">₹0.00</p>
                            ) : (
                                Object.entries(receiptsStats.totalsByCurrency).map(([currency, data]) => (
                                    <p key={currency} className="text-2xl font-extrabold text-emerald-600 leading-tight">
                                        {data.symbol}{data.amount.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        <span className="text-[10px] text-gray-400 font-normal ml-1">({currency})</span>
                                    </p>
                                ))
                             )}
                        </div>
                    </div>
                    <div className="mt-4 text-[11px] text-gray-400 font-semibold flex items-center gap-1.5">
                        <span className="text-[10px] bg-emerald-50/70 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100/50">Income</span>
                        <span>Cleared Income</span>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
            </div>
        </div>

        {/* Expenses summary strip — spend sits next to revenue instead of being
            hidden inside the module. Links straight into Expenses Manager. */}
        <button
            onClick={() => navigate('/expenses')}
            className="group w-full mb-6 text-left bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg border border-white/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <span className="w-11 h-11 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <rect x="3" y="6" width="18" height="13" rx="2.5" />
                            <path d="M3 10.5h18" strokeLinecap="round" />
                            <circle cx="16.5" cy="14.5" r="1.2" />
                        </svg>
                    </span>
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Expenses Manager</p>
                        <p className="text-sm font-bold text-white">
                            {expenseStats.count === 0
                                ? 'Start tracking what your business spends'
                                : `${expenseStats.count} ${expenseStats.count === 1 ? 'expense' : 'expenses'} recorded`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-5 sm:gap-7">
                    <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Spent this FY</p>
                        <p className="text-lg font-extrabold text-white tnum">{formatCompactINR(expenseStats.fyTotal)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">ITC claimable</p>
                        <p className="text-lg font-extrabold text-emerald-400 tnum">{formatCompactINR(expenseStats.itc)}</p>
                    </div>
                    {expenseStats.unpaid > 0 && (
                        <div className="hidden xs:block">
                            <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Unpaid</p>
                            <p className="text-lg font-extrabold text-amber-400 tnum">{formatCompactINR(expenseStats.unpaid)}</p>
                        </div>
                    )}
                    <span className="shrink-0 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h15m-5.5-5.5L20 12l-6.5 5.5" />
                        </svg>
                    </span>
                </div>
            </div>
        </button>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            
            {/* Chart 1: Invoices Volume & Value Trend */}
            <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80 flex flex-col h-[350px] transition-all duration-300 hover:shadow-md">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">GST Invoices Monthly Trend</h3>
                {monthlyTrends.length > 0 ? (
                    <div className="w-full flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#e5e7eb" />
                                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#3b82f6' }} stroke="#3b82f6" label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' } }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#6b7280" label={{ value: 'Count', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 10, fontWeight: 'bold' } }} />
                                <Tooltip formatter={(value, name) => [name === 'invoiceAmount' ? `₹${value.toLocaleString('en-IN')}` : value, name === 'invoiceAmount' ? 'Total Amount' : 'Invoice Count']} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar yAxisId="left" dataKey="invoiceAmount" name="Total Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} barSize={30} />
                                <Line yAxisId="right" type="monotone" dataKey="invoiceCount" name="Invoice Count" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                        <p className="text-xs font-medium">No invoice data available</p>
                    </div>
                )}
            </div>

            {/* Chart 2: Revenue split by Product vs Service, then by line item */}
            <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80 flex flex-col h-[350px] transition-all duration-300 hover:shadow-md">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Product vs Service Revenue (INR Equiv.)</h3>

                {revenueSplit.items.length > 0 ? (
                    <>
                        {/* Split summary: two totals and a proportional bar */}
                        <div className="mb-3 shrink-0">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className="text-[9px] uppercase font-bold tracking-widest text-blue-600">Products</p>
                                    <p className="text-base font-extrabold text-gray-900 leading-tight">
                                        ₹{revenueSplit.productTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] uppercase font-bold tracking-widest text-violet-600">Services</p>
                                    <p className="text-base font-extrabold text-gray-900 leading-tight">
                                        ₹{revenueSplit.serviceTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            </div>
                            <div
                                className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
                                role="img"
                                aria-label={`Products ${Math.round(revenueSplit.productShare)} percent, services ${100 - Math.round(revenueSplit.productShare)} percent of revenue`}
                            >
                                <div className="bg-blue-500 transition-all duration-500" style={{ width: `${revenueSplit.productShare}%` }} />
                                <div className="bg-violet-500 flex-1" />
                            </div>
                        </div>

                        <div className="w-full flex-1 min-h-0 flex flex-row items-center">
                            <div className="w-[42%] h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={revenueSplit.items} cx="50%" cy="50%" innerRadius={40} outerRadius={58} paddingAngle={4} dataKey="value" cornerRadius={4}>
                                            {revenueSplit.items.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                        </Pie>
                                        <Tooltip formatter={(value, name, props) => {
                                            const originalBreakdown = props.payload.displayByCurrency || {};
                                            const breakdownText = Object.entries(originalBreakdown)
                                                .map(([cur, amt]) => `${cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₹'}${amt.toLocaleString()}`)
                                                .join(', ');
                                            const kindLabel = props.payload.kind === BILLING_KINDS.SERVICE ? 'Service' : 'Product';
                                            return [`₹${value.toLocaleString('en-IN')} (${breakdownText})`, `${props.payload.name} · ${kindLabel}`];
                                        }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Legend grouped by kind, so the split is readable as text too */}
                            <div className="w-[58%] max-h-full overflow-y-auto pl-1 pr-2 space-y-2 custom-scrollbar">
                                {revenueSplit.groups.filter(g => g.items.length > 0).map(group => (
                                    <div key={group.kind}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="h-2 w-0.5 rounded-full" style={{ backgroundColor: group.accent }} />
                                            <span className="text-[9px] uppercase font-bold tracking-widest" style={{ color: group.accent }}>
                                                {group.label}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-400">
                                                {group.items.length}
                                            </span>
                                        </div>
                                        <div className="space-y-1 pl-2">
                                            {group.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs">
                                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                                    <span className="font-semibold text-gray-700 truncate flex-1">{item.name}</span>
                                                    <span className="font-bold text-gray-900 shrink-0">₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                        <p className="text-xs font-medium">No receipt data available</p>
                    </div>
                )}
            </div>

            {/* Chart 3: Tax Collection Breakdown */}
            <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80 flex flex-col h-[350px] transition-all duration-300 hover:shadow-md">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Tax Collections Breakdown (INR Equiv.)</h3>
                {taxCollectionData.length > 0 ? (
                    <div className="w-full flex-1 min-h-0 flex flex-row items-center">
                        <div className="w-1/2 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={taxCollectionData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" cornerRadius={4}>
                                        {taxCollectionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Tax Amount']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 max-h-full overflow-y-auto px-2 space-y-1.5 custom-scrollbar">
                            {taxCollectionData.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                    <span className="font-semibold text-gray-700 truncate flex-1">{item.name}</span>
                                    <span className="font-bold text-gray-900 shrink-0">₹{item.value.toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                        <p className="text-xs font-medium">No tax data available</p>
                    </div>
                )}
            </div>

            {/* Chart 4: Payment Status (Existing status chart) */}
            <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80 flex flex-col relative h-[350px] transition-all duration-300 hover:shadow-md">
                {/* Covers invoices and receipts, so not "Invoice" status. */}
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Payment Status</h3>
                {statusData.length > 0 ? (
                    <div className="w-full flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" cornerRadius={4}>
                                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs font-medium text-gray-600 ml-1">{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                        <p className="text-xs font-medium">No payment status data available</p>
                    </div>
                )}
            </div>

            {/* Chart 5: Top Clients by Revenue (Existing list) */}
            <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80 flex flex-col lg:col-span-2 min-h-[250px] transition-all duration-300 hover:shadow-md">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Top Clients by Revenue</p>
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
            
            <div className="lg:col-span-1 bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80 h-fit transition-all duration-300 hover:shadow-md">
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
                        Receipt Defaults
                    </button>
                </div>

                {settingsTab === 'saas' ? (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        // A service default must never carry subscription fields.
                        const toSave = saasIsService
                            ? { ...saasSettings, planName: '', planDuration: '', planType: '' }
                            : saasSettings;
                        localStorage.setItem('saas_receipt_settings', JSON.stringify(toSave));
                        showPopup('Saved', 'Receipt Defaults saved successfully!', 'success');
                    }} className="space-y-3">
                        <BillingKindSelector
                            name="saas-defaults-kind"
                            value={saasSettings.billingKind}
                            onChange={(billingKind) => setSaasSettings({ ...saasSettings, billingKind })}
                            legend="Default Billing Type"
                        />
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                                {saasIsService ? 'Service Name' : 'Product Name'}
                            </label>
                            <input 
                                type="text" 
                                value={saasSettings.productName} 
                                onChange={(e) => setSaasSettings({...saasSettings, productName: e.target.value})} 
                                placeholder={saasIsService ? 'e.g. Web Design and Development' : 'e.g. Pixalara'} 
                                className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                                required 
                            />
                        </div>
                        {!saasIsService && (
                        <>
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
                        </>
                        )}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                                {saasIsService ? 'Default Service Fee' : 'Default Amount'}
                            </label>
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
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-700 mt-4">Save Receipt Defaults</button>
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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <button onClick={() => navigate('/create-invoice')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all text-xs">
                        <span className="text-lg">+</span> Create Invoice
                    </button>
                    <button onClick={() => navigate('/create-receipt')} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all text-xs">
                        <span className="text-lg">+</span> Create Receipt
                    </button>
                    <button onClick={() => setCustomerModal({ isOpen: true, customer: null })} className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all text-xs">
                        <span className="text-lg">+</span> Create Customer
                    </button>
                    <button onClick={() => setProductModal({ isOpen: true, product: null })} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all text-xs">
                        <span className="text-lg">+</span> Add Product
                    </button>
                </div>
                
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/80 relative transition-all duration-300 hover:shadow-md">
                                  <div className="p-4 border-b bg-gray-50/50 space-y-3 rounded-t-xl">
                        {/* Tab Selector */}
                        <div className="flex border-b border-gray-200 gap-2 mb-2 overflow-x-auto">
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
                                Receipts ({allReceipts.length})
                            </button>
                            <button 
                                onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
                                className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'customers' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                Customers ({allCustomers.length})
                            </button>
                            <button 
                                onClick={() => { setActiveTab('products'); setSearchTerm(''); }}
                                className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'products' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                Products ({allProducts.length})
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                            <h3 className="font-bold text-gray-700 text-sm">
                                {activeTab === 'invoices' ? 'All Invoices' : activeTab === 'receipts' ? 'All Receipts' : activeTab === 'customers' ? 'All Customers' : 'All Products'} ({filteredInvoices.length})
                            </h3>
                            <div className="flex gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input 
                                        type="text" 
                                        placeholder={activeTab === 'customers' ? "Search Name, Email, ID..." : activeTab === 'products' ? "Search Name, HSN..." : "Search Customer or Doc #"} 
                                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {activeTab !== 'customers' && activeTab !== 'products' && (
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
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow transition-colors flex items-center gap-1 active:scale-95 transform"
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
                                                    <td className="px-5 py-3 text-gray-600">{c.phone || '-'}</td>
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
                                                                className="text-red-600 hover:text-red-600 p-1 px-2.5 hover:bg-red-50 rounded transition-all font-semibold text-xs border"
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
                            ) : activeTab === 'products' ? (
                                <table className="hidden md:table w-full text-left text-sm rounded-b-xl overflow-hidden">
                                    <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs border-b border-gray-100">
                                        <tr>
                                            <th className="px-5 py-3">ID</th>
                                            <th className="px-5 py-3">Name</th>
                                            <th className="px-5 py-3 text-right">Price (₹)</th>
                                            <th className="px-5 py-3 text-center">HSN/SAC</th>
                                            <th className="px-5 py-3 text-center">Tax Rate</th>
                                            <th className="px-5 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredInvoices.map((inv) => {
                                            const p = inv.invoice_data || {};
                                            return (
                                                <tr key={inv.id} className="hover:bg-amber-50 transition-colors">
                                                    <td className="px-5 py-3 font-bold text-amber-600 font-mono">{inv.invoice_no}</td>
                                                    <td className="px-5 py-3 font-bold text-gray-800">{p.name}</td>
                                                    <td className="px-5 py-3 text-right font-bold text-gray-900">₹{p.price?.toFixed(2)}</td>
                                                    <td className="px-5 py-3 text-center text-gray-600 font-mono">{p.hsn_sac || '-'}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
                                                            {p.tax_rate}%
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); setProductModal({ isOpen: true, product: inv }); }} 
                                                                className="text-gray-500 hover:text-amber-600 p-1 px-2.5 hover:bg-amber-50 rounded transition-all font-semibold text-xs border"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(inv.id, e); }} 
                                                                className="text-red-600 hover:text-red-600 p-1 px-2.5 hover:bg-red-50 rounded transition-all font-semibold text-xs border"
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
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide transition-all active:scale-95 ${getStatusBadgeStyles(resolveDocStatus(inv))}`}
                                                    >
                                                        {resolveDocStatus(inv)}
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
                                                    <span className="font-bold text-purple-600 text-sm font-mono">{inv.invoice_no}</span>
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
                                                            className="text-red-600 hover:underline p-1 text-xs font-bold"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : activeTab === 'products' ? (
                                <div className="md:hidden divide-y divide-gray-100 rounded-b-xl overflow-hidden">
                                    {filteredInvoices.map((inv) => {
                                        const p = inv.invoice_data || {};
                                        return (
                                            <div key={inv.id} className="p-4 hover:bg-amber-50 transition-colors">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-amber-600 text-sm font-mono">{inv.invoice_no}</span>
                                                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
                                                        Tax: {p.tax_rate}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-bold text-gray-800">{p.name}</span>
                                                        <span className="text-xs text-gray-900 font-bold">₹{p.price?.toFixed(2)}</span>
                                                        {p.hsn_sac && <span className="text-[10px] text-gray-500 font-mono mt-0.5">HSN/SAC: {p.hsn_sac}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setProductModal({ isOpen: true, product: inv }); }} 
                                                            className="text-blue-600 hover:underline p-1 text-xs font-bold"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(inv.id, e); }} 
                                                            className="text-red-600 hover:underline p-1 text-xs font-bold"
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
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadgeStyles(resolveDocStatus(inv))}`}
                                                >
                                                    {resolveDocStatus(inv)}
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

        {/* PRODUCT FORM MODAL */}
        {productModal.isOpen && (
            <ProductFormModal 
                productNode={productModal.product} 
                onClose={() => setProductModal({ isOpen: false, product: null })}
                onSave={() => {
                    setProductModal({ isOpen: false, product: null });
                    supabase.auth.getUser().then(({ data: { user } }) => {
                        if (user) fetchInvoices(user.id);
                    });
                }}
                allProducts={allProducts}
            />
        )}
      </div>
      
      <BrandingFooter />

    </div>
  )
}