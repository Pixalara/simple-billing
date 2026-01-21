import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { INDIAN_STATES } from '../constants'
import html2pdf from 'html2pdf.js'

// Vyapar-like Theme Colors
const THEMES = [
  { name: 'Blue', hex: '#2563eb', text: 'white' },
  { name: 'Green', hex: '#16a34a', text: 'white' },
  { name: 'Red', hex: '#dc2626', text: 'white' },
  { name: 'Black', hex: '#1f2937', text: 'white' },
  { name: 'Orange', hex: '#ea580c', text: 'white' },
]

export default function CreateInvoice() {
  const navigate = useNavigate()
  const invoiceRef = useRef()
  const [loading, setLoading] = useState(false)
  const [sellerProfile, setSellerProfile] = useState(null)
  
  // Custom Visual States
  const [theme, setTheme] = useState(THEMES[0])
  const [logoPreview, setLogoPreview] = useState(null)
  const [signaturePreview, setSignaturePreview] = useState(null)

  const { register, control, handleSubmit, setValue } = useForm({
    defaultValues: {
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [{ description: '', quantity: 1, price: 0, gstRate: 18 }],
      terms: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within the due date.',
      bankName: '',
      accountNo: '',
      ifsc: ''
    }
  })

  const formData = useWatch({ control })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // 1. Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) setSellerProfile(data)
    }
    fetchProfile()
  }, [])

  // 2. Handle Image Uploads (Local Preview)
  const handleImageUpload = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'logo') setLogoPreview(reader.result)
        if (type === 'signature') setSignaturePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // 3. Calculate Totals
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

  // 4. Download PDF
  const handleDownloadPDF = () => {
    const element = invoiceRef.current
    const opt = {
      margin: 0, // No margin for full bleed
      filename: `Invoice_${formData.buyer_name || 'Draft'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  // 5. Save Invoice
  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const invoiceNo = `INV-${Date.now().toString().slice(-6)}`
      const { error } = await supabase.from('invoices').insert({
        user_id: user.id,
        invoice_no: invoiceNo,
        invoice_data: { ...data, totals, theme: theme.hex },
        total_amount: totals.grandTotal
      })
      if (error) throw error
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
      
      {/* --- LEFT SIDE: EDITOR --- */}
      <div className="w-full lg:w-5/12 bg-white p-6 rounded-lg shadow-lg h-fit overflow-y-auto max-h-screen custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Invoice Editor</h2>
          
          {/* Theme Selector */}
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button 
                key={t.name}
                onClick={() => setTheme(t)}
                className={`w-6 h-6 rounded-full border-2 ${theme.name === t.name ? 'border-black scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: t.hex }}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Logo Upload */}
          <div className="bg-gray-50 p-3 rounded border">
            <label className="text-xs font-bold text-gray-500 uppercase">Business Logo</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="block w-full text-sm text-gray-500 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>

          {/* Dates & PO */}
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

          {/* Bill To */}
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

          {/* Bank Details */}
          <div className="bg-gray-50 p-3 rounded border">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Bank Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <input {...register('bankName')} placeholder="Bank Name" className="w-full p-2 border rounded" />
              <input {...register('accountNo')} placeholder="Account Number" className="w-full p-2 border rounded" />
              <input {...register('ifsc')} placeholder="IFSC Code" className="w-full p-2 border rounded" />
              <input {...register('upiId')} placeholder="UPI ID (Optional)" className="w-full p-2 border rounded" />
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Items</h3>
            {fields.map((item, index) => (
              <div key={item.id} className="flex gap-1 mb-2">
                <input {...register(`items.${index}.description`)} placeholder="Item" className="w-1/3 p-2 border rounded text-sm" />
                <input {...register(`items.${index}.quantity`)} type="number" placeholder="Qty" className="w-14 p-2 border rounded text-sm" />
                <input {...register(`items.${index}.price`)} type="number" placeholder="Price" className="w-20 p-2 border rounded text-sm" />
                <select {...register(`items.${index}.gstRate`)} className="w-16 p-2 border rounded text-sm">
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
                <button type="button" onClick={() => remove(index)} className="text-red-500 px-1">×</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ description: '', quantity: 1, price: 0, gstRate: 18 })} className="text-blue-600 text-sm font-bold">
              + Add Item
            </button>
          </div>

          {/* Signature & Terms */}
          <div className="space-y-3">
             <div className="bg-gray-50 p-3 rounded border">
                <label className="text-xs font-bold text-gray-500">Signature Upload</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} className="block w-full text-sm text-gray-500 mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Terms & Conditions</label>
              <textarea {...register('terms')} rows="3" className="w-full p-2 border rounded text-sm"></textarea>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t sticky bottom-0 bg-white">
            <button type="button" onClick={handleDownloadPDF} className="flex-1 bg-gray-900 text-white py-3 rounded-lg hover:bg-black font-bold shadow-lg transition transform hover:scale-105">
              Download PDF
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg">
              {loading ? 'Saving...' : 'Save & Close'}
            </button>
          </div>
        </form>
      </div>

      {/* --- RIGHT SIDE: LIVE PREVIEW (A4) --- */}
      <div className="w-full lg:w-7/12 flex justify-center bg-gray-300 p-8 overflow-y-auto">
        
        <div 
          ref={invoiceRef} 
          className="bg-white shadow-2xl relative"
          style={{ width: '210mm', minHeight: '297mm', padding: '0' }}
        >
          {/* COLORED HEADER */}
          <div className="p-8 flex justify-between items-start" style={{ backgroundColor: theme.hex, color: theme.text }}>
            <div>
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="h-20 w-auto mb-4 object-contain bg-white rounded p-1" />
              )}
              <h1 className="text-4xl font-bold uppercase tracking-wide">Invoice</h1>
              <p className="opacity-80 mt-1"># {`INV-${new Date().getFullYear()}-001`}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold">{sellerProfile?.business_name || 'Your Business Name'}</h2>
              <p className="opacity-90">{sellerProfile?.state}</p>
              <p className="opacity-90">{sellerProfile?.email}</p>
              {sellerProfile?.gstin && <p className="font-semibold mt-1">GSTIN: {sellerProfile.gstin}</p>}
            </div>
          </div>

          <div className="p-8">
            {/* META INFO ROW */}
            <div className="flex justify-between mb-8">
              <div className="w-1/2">
                <h3 className="text-gray-500 text-xs uppercase font-bold mb-1">Bill To</h3>
                <p className="text-lg font-bold text-gray-800">{formData.buyer_name || 'Client Name'}</p>
                {formData.buyer_address && <p className="text-gray-600 text-sm whitespace-pre-wrap">{formData.buyer_address}</p>}
                <p className="text-gray-600">{formData.buyer_state}</p>
                {formData.buyer_gstin && <p className="text-sm font-semibold mt-1">GSTIN: {formData.buyer_gstin}</p>}
              </div>
              <div className="w-1/3 text-right space-y-1">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500 text-sm">Date:</span>
                  <span className="font-semibold">{formData.invoiceDate}</span>
                </div>
                {formData.dueDate && (
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-gray-500 text-sm">Due Date:</span>
                    <span className="font-semibold">{formData.dueDate}</span>
                  </div>
                )}
                {formData.poNumber && (
                   <div className="flex justify-between border-b pb-1">
                   <span className="text-gray-500 text-sm">PO #:</span>
                   <span className="font-semibold">{formData.poNumber}</span>
                 </div>
                )}
              </div>
            </div>

            {/* TABLE */}
            <table className="w-full mb-8">
              <thead>
                <tr style={{ backgroundColor: theme.hex, color: theme.text }}>
                  <th className="text-left py-2 px-3 text-sm uppercase">Item Description</th>
                  <th className="text-center py-2 px-3 text-sm uppercase">Qty</th>
                  <th className="text-right py-2 px-3 text-sm uppercase">Price</th>
                  <th className="text-right py-2 px-3 text-sm uppercase">GST</th>
                  <th className="text-right py-2 px-3 text-sm uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {formData.items?.map((item, i) => {
                   const amount = ((item.quantity||0) * (item.price||0));
                   const gstAmt = (amount * (item.gstRate||0)) / 100;
                   return (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-800">{item.description}</p>
                        <p className="text-xs text-gray-500">HSN/SAC: 9983</p>
                      </td>
                      <td className="text-center py-3 px-3">{item.quantity}</td>
                      <td className="text-right py-3 px-3">₹{item.price}</td>
                      <td className="text-right py-3 px-3 text-xs text-gray-500">
                        {item.gstRate}% <br/>(₹{gstAmt.toFixed(2)})
                      </td>
                      <td className="text-right py-3 px-3 font-bold text-gray-800">
                        ₹{(amount).toFixed(2)}
                      </td>
                    </tr>
                   )
                })}
              </tbody>
            </table>

            {/* FOOTER SECTION */}
            <div className="flex justify-between items-start">
              
              {/* Bank & Terms */}
              <div className="w-1/2 pr-8">
                {formData.bankName && (
                  <div className="mb-6 bg-gray-50 p-3 rounded border">
                    <h4 className="font-bold text-sm mb-2" style={{ color: theme.hex }}>Bank Details</h4>
                    <p className="text-sm"><span className="text-gray-500">Bank:</span> {formData.bankName}</p>
                    <p className="text-sm"><span className="text-gray-500">A/c No:</span> {formData.accountNo}</p>
                    <p className="text-sm"><span className="text-gray-500">IFSC:</span> {formData.ifsc}</p>
                    {formData.upiId && <p className="text-sm"><span className="text-gray-500">UPI:</span> {formData.upiId}</p>}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <h4 className="font-bold text-gray-800 mb-1">Terms & Conditions</h4>
                  <p className="whitespace-pre-wrap text-xs">{formData.terms}</p>
                </div>
              </div>

              {/* Totals & Sign */}
              <div className="w-5/12">
                 <div className="space-y-2 border-b pb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{totals.subtotal}</span>
                    </div>
                    {parseFloat(totals.igst) > 0 ? (
                      <div className="flex justify-between text-gray-600 text-sm">
                        <span>IGST</span>
                        <span>₹{totals.igst}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-gray-600 text-sm">
                          <span>CGST</span>
                          <span>₹{totals.cgst}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 text-sm">
                          <span>SGST</span>
                          <span>₹{totals.sgst}</span>
                        </div>
                      </>
                    )}
                 </div>
                 
                 <div className="flex justify-between py-3 text-2xl font-bold" style={{ color: theme.hex }}>
                    <span>Total</span>
                    <span>₹{totals.grandTotal}</span>
                 </div>

                 {/* Signature Area */}
                 <div className="mt-8 text-right">
                    {signaturePreview && (
                       <img src={signaturePreview} alt="Sign" className="h-16 ml-auto mb-2 object-contain" />
                    )}
                    <p className="text-xs font-bold uppercase">Authorized Signatory</p>
                    <p className="text-xs text-gray-500">{sellerProfile?.business_name}</p>
                 </div>
              </div>
            </div>

          </div>
          
          {/* BOTTOM COLOR BAR */}
          <div className="h-4 w-full absolute bottom-0" style={{ backgroundColor: theme.hex }}></div>

        </div>
      </div>
    </div>
  )
}