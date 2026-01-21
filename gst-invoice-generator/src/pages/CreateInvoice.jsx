import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'
import { INDIAN_STATES, HSN_CODES } from '../constants' // <--- Import HSN_CODES
import SearchableSelect from '../components/SearchableSelect' // <--- Import the new component
import html2pdf from 'html2pdf.js'

const THEMES = [
  { name: 'Blue', hex: '#2563eb', text: 'white' },
  { name: 'Green', hex: '#16a34a', text: 'white' },
  { name: 'Red', hex: '#dc2626', text: 'white' },
  { name: 'Black', hex: '#1f2937', text: 'white' },
  { name: 'Orange', hex: '#ea580c', text: 'white' },
]

export default function CreateInvoice() {
  const navigate = useNavigate()
  const { id } = useParams()
  const invoiceRef = useRef()
  const [loading, setLoading] = useState(false)
  const [sellerProfile, setSellerProfile] = useState(null)
  
  const [theme, setTheme] = useState(THEMES[0])
  const [signaturePreview, setSignaturePreview] = useState(null)
  const [existingInvoiceNo, setExistingInvoiceNo] = useState(null)

  const { register, control, handleSubmit, setValue, reset } = useForm({
    defaultValues: {
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [{ description: '', hsn: '', quantity: 1, price: 0, gstRate: 18 }], // Added 'hsn' field
      terms: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within the due date.',
    }
  })

  const formData = useWatch({ control })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // 1. Fetch Data
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')
      
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (profile) setSellerProfile(profile)

      if (id) {
        const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single()
        if (invoice) {
          reset(invoice.invoice_data)
          setExistingInvoiceNo(invoice.invoice_no)
          if (invoice.invoice_data.theme) {
            const foundTheme = THEMES.find(t => t.hex === invoice.invoice_data.theme)
            if (foundTheme) setTheme(foundTheme)
          }
        }
      }
    }
    loadData()
  }, [id, navigate, reset])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setSignaturePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  // Handle HSN Selection
  const handleItemSelect = (index, item) => {
    setValue(`items.${index}.description`, item.description)
    if (item.code) setValue(`items.${index}.hsn`, item.code)
    if (item.rate) setValue(`items.${index}.gstRate`, item.rate)
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalGST = 0
    const items = formData.items || []

    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0
      const price = parseFloat(item.price) || 0
      const rate = parseFloat(item.gstRate) || 0
      const lineTotal = qty * price
      const taxAmount = (lineTotal * rate) / 100
      subtotal += lineTotal
      totalGST += taxAmount
    })

    const sellerState = sellerProfile?.state
    const buyerState = formData.buyer_state
    const isInterState = sellerState && buyerState && (sellerState !== buyerState)

    return {
      subtotal: subtotal.toFixed(2),
      cgst: isInterState ? 0 : (totalGST / 2).toFixed(2),
      sgst: isInterState ? 0 : (totalGST / 2).toFixed(2),
      igst: isInterState ? totalGST.toFixed(2) : 0,
      grandTotal: (subtotal + totalGST).toFixed(2)
    }
  }
  const totals = calculateTotals()

  const handleDownloadPDF = () => {
    const element = invoiceRef.current
    const opt = {
      margin: 0,
      filename: `Invoice_${formData.buyer_name || 'Draft'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  const handlePrint = () => window.print()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const invoiceNo = existingInvoiceNo || `INV-${Date.now().toString().slice(-6)}`
      const payload = {
        user_id: user.id,
        invoice_no: invoiceNo,
        invoice_data: { ...data, totals, theme: theme.hex },
        total_amount: totals.grandTotal
      }

      if (id) await supabase.from('invoices').update(payload).eq('id', id)
      else await supabase.from('invoices').insert(payload)

      alert('Invoice Saved Successfully!')
      navigate('/dashboard')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col lg:flex-row gap-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-preview, #invoice-preview * { visibility: visible; }
          #invoice-preview { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      {/* --- LEFT SIDE: EDITOR --- */}
      <div className="no-print w-full lg:w-5/12 bg-white p-6 rounded-lg shadow-lg h-fit overflow-y-auto max-h-screen custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{id ? 'Edit Invoice' : 'New Invoice'}</h2>
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button key={t.name} onClick={() => setTheme(t)} className={`w-6 h-6 rounded-full border-2 ${theme.name === t.name ? 'border-black scale-110' : 'border-transparent'}`} style={{ backgroundColor: t.hex }} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Invoice Date</label>
              <input type="date" {...register('invoiceDate')} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Due Date</label>
              <input type="date" {...register('dueDate')} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="text-xs text-gray-500">PO Number</label>
              <input {...register('poNumber')} placeholder="e.g. PO-2024-001" className="w-full p-2 border rounded" />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded border">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Bill To (Customer)</h3>
            <input {...register('buyer_name')} placeholder="Business/Client Name" className="w-full p-2 border rounded mb-2" />
            <select {...register('buyer_state')} className="w-full p-2 border rounded mb-2">
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input {...register('buyer_gstin')} placeholder="GSTIN (Optional)" className="w-full p-2 border rounded" />
            <input {...register('buyer_address')} placeholder="Billing Address" className="w-full p-2 border rounded mt-2" />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Items</h3>
            {fields.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-2 mb-4 p-3 bg-gray-50 rounded border">
                
                {/* 1. Description with Search */}
                <div className="w-full">
                    <label className="text-xs text-gray-500 font-bold">Item & HSN Search</label>
                    <SearchableSelect 
                        options={HSN_CODES} 
                        value={formData.items[index]?.description}
                        placeholder="Search Item (e.g. Mobile, Audit...)"
                        onChange={(selected) => handleItemSelect(index, selected)}
                    />
                </div>

                <div className="flex gap-2">
                    {/* 2. HSN Code (Auto-filled but editable) */}
                    <div className="w-1/4">
                        <label className="text-xs text-gray-500">HSN/SAC</label>
                        <input {...register(`items.${index}.hsn`)} placeholder="Code" className="w-full p-2 border rounded text-sm bg-white" />
                    </div>

                    <div className="w-1/4">
                        <label className="text-xs text-gray-500">Qty</label>
                        <input {...register(`items.${index}.quantity`)} type="number" className="w-full p-2 border rounded text-sm" />
                    </div>

                    <div className="w-1/4">
                        <label className="text-xs text-gray-500">Price</label>
                        <input {...register(`items.${index}.price`)} type="number" className="w-full p-2 border rounded text-sm" />
                    </div>

                    <div className="w-1/4">
                        <label className="text-xs text-gray-500">GST %</label>
                        <select {...register(`items.${index}.gstRate`)} className="w-full p-2 border rounded text-sm">
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                </div>
                <button type="button" onClick={() => remove(index)} className="text-red-500 text-xs text-right hover:underline">Remove Item</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ description: '', hsn: '', quantity: 1, price: 0, gstRate: 18 })} className="text-blue-600 text-sm font-bold">
              + Add New Item
            </button>
          </div>

          {/* Terms & Uploads */}
          <div className="space-y-3">
             <div className="bg-gray-50 p-3 rounded border">
                <label className="text-xs font-bold text-gray-500">Signature Upload</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Terms & Conditions</label>
              <textarea {...register('terms')} rows="3" className="w-full p-2 border rounded text-sm"></textarea>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-white z-10">
            <button type="button" onClick={handlePrint} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-bold shadow transition">Print</button>
            <button type="button" onClick={handleDownloadPDF} className="flex-1 bg-gray-900 text-white py-3 rounded-lg hover:bg-black font-bold shadow transition">PDF</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold shadow transition">
              {loading ? 'Saving...' : (id ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>

      {/* --- RIGHT SIDE: LIVE PREVIEW --- */}
      <div className="w-full lg:w-7/12 flex justify-center bg-gray-300 p-8 overflow-y-auto">
        <div id="invoice-preview" ref={invoiceRef} className="bg-white shadow-2xl relative" style={{ width: '210mm', minHeight: '297mm', padding: '0' }}>
          
          {/* HEADER */}
          <div className="p-8 flex justify-between items-start" style={{ backgroundColor: theme.hex, color: theme.text }}>
            <div>
              {sellerProfile?.logo_url && <img src={sellerProfile.logo_url} alt="Logo" className="h-20 w-auto mb-4 object-contain bg-white rounded p-1" />}
              <h1 className="text-4xl font-bold uppercase tracking-wide">Invoice</h1>
              <p className="opacity-80 mt-1"># {existingInvoiceNo || 'DRAFT'}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold">{sellerProfile?.business_name || 'Your Business Name'}</h2>
              <p className="opacity-90">{sellerProfile?.state}</p>
              {sellerProfile?.business_email && <p className="opacity-90 text-sm">{sellerProfile.business_email}</p>}
              {sellerProfile?.business_phone && <p className="opacity-90 text-sm">{sellerProfile.business_phone}</p>}
              {sellerProfile?.gstin && <p className="font-semibold mt-1">GSTIN: {sellerProfile.gstin}</p>}
            </div>
          </div>

          <div className="p-8">
            <div className="flex justify-between mb-8">
              <div className="w-1/2">
                <h3 className="text-gray-500 text-xs uppercase font-bold mb-1">Bill To</h3>
                <p className="text-lg font-bold text-gray-800">{formData.buyer_name || 'Client Name'}</p>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{formData.buyer_address}</p>
                <p className="text-gray-600">{formData.buyer_state}</p>
                {formData.buyer_gstin && <p className="text-sm font-semibold mt-1">GSTIN: {formData.buyer_gstin}</p>}
              </div>
              <div className="w-1/3 text-right space-y-1">
                <div className="flex justify-between border-b pb-1">
                    <span className="text-gray-500 text-sm">Date:</span><span className="font-semibold">{formData.invoiceDate}</span>
                </div>
                {formData.dueDate && <div className="flex justify-between border-b pb-1"><span className="text-gray-500 text-sm">Due Date:</span><span className="font-semibold">{formData.dueDate}</span></div>}
                {formData.poNumber && <div className="flex justify-between border-b pb-1"><span className="text-gray-500 text-sm">PO #:</span><span className="font-semibold">{formData.poNumber}</span></div>}
              </div>
            </div>

            {/* TABLE - ADDED HSN COLUMN */}
            <table className="w-full mb-8">
              <thead>
                <tr style={{ backgroundColor: theme.hex, color: theme.text }}>
                  <th className="text-left py-2 px-2 text-sm uppercase w-5/12">Item Description</th>
                  <th className="text-left py-2 px-2 text-sm uppercase w-2/12">HSN/SAC</th>
                  <th className="text-center py-2 px-2 text-sm uppercase w-1/12">Qty</th>
                  <th className="text-right py-2 px-2 text-sm uppercase w-2/12">Price</th>
                  <th className="text-right py-2 px-2 text-sm uppercase w-2/12">Amount</th>
                </tr>
              </thead>
              <tbody>
                {formData.items?.map((item, i) => {
                   const amount = ((item.quantity||0) * (item.price||0));
                   const gstAmt = (amount * (item.gstRate||0)) / 100;
                   return (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-3 px-2">
                        <p className="font-semibold text-gray-800">{item.description}</p>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {item.hsn}
                      </td>
                      <td className="text-center py-3 px-2">{item.quantity}</td>
                      <td className="text-right py-3 px-2">₹{item.price}</td>
                      <td className="text-right py-3 px-2 font-bold text-gray-800">
                        ₹{(amount).toFixed(2)}
                      </td>
                    </tr>
                   )
                })}
              </tbody>
            </table>
            
            {/* Totals Section ... (Same as before) */}
            <div className="flex justify-end">
                 <div className="w-5/12 space-y-2 border-b pb-4">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{totals.subtotal}</span></div>
                    {parseFloat(totals.igst) > 0 ? (
                      <div className="flex justify-between text-gray-600 text-sm"><span>IGST</span><span>₹{totals.igst}</span></div>
                    ) : (
                      <>
                        <div className="flex justify-between text-gray-600 text-sm"><span>CGST</span><span>₹{totals.cgst}</span></div>
                        <div className="flex justify-between text-gray-600 text-sm"><span>SGST</span><span>₹{totals.sgst}</span></div>
                      </>
                    )}
                    <div className="flex justify-between py-3 text-2xl font-bold" style={{ color: theme.hex }}>
                        <span>Total</span><span>₹{totals.grandTotal}</span>
                    </div>
                 </div>
            </div>

            {/* Signature Area */}
            <div className="mt-8 text-right">
                {signaturePreview && <img src={signaturePreview} alt="Sign" className="h-16 ml-auto mb-2 object-contain" />}
                <p className="text-xs font-bold uppercase">Authorized Signatory</p>
                <p className="text-xs text-gray-500">{sellerProfile?.business_name}</p>
            </div>
            
             {/* Terms */}
            <div className="mt-8 pt-4 border-t text-sm text-gray-600">
                  <h4 className="font-bold text-gray-800 mb-1">Terms & Conditions</h4>
                  <p className="whitespace-pre-wrap text-xs">{formData.terms}</p>
            </div>
          </div>
          <div className="h-4 w-full absolute bottom-0" style={{ backgroundColor: theme.hex }}></div>
        </div>
      </div>
    </div>
  )
}