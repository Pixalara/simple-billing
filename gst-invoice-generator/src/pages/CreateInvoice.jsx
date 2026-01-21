import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { INDIAN_STATES } from '../constants'
import html2pdf from 'html2pdf.js'

export default function CreateInvoice() {
  const navigate = useNavigate()
  const invoiceRef = useRef() // Reference for the PDF generator
  const [loading, setLoading] = useState(false)
  const [sellerProfile, setSellerProfile] = useState(null)
  
  // Setup Form
  const { register, control, handleSubmit, setValue } = useForm({
    defaultValues: {
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [{ description: '', quantity: 1, price: 0, gstRate: 18 }]
    }
  })

  // Watch inputs for Live Preview
  const formData = useWatch({ control })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // 1. Fetch Seller Profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')
      
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) setSellerProfile(data)
    }
    fetchProfile()
  }, [])

  // 2. Calculate Totals (Memoized for Preview)
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

    // GST Logic
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

  // 3. Download PDF Function
  const handleDownloadPDF = () => {
    const element = invoiceRef.current
    const opt = {
      margin: 10,
      filename: `Invoice_${formData.buyer_name || 'Draft'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  // 4. Save to Database
  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const invoiceNo = `INV-${Date.now().toString().slice(-6)}`

      const { error } = await supabase.from('invoices').insert({
        user_id: user.id,
        invoice_no: invoiceNo,
        invoice_data: { ...data, totals },
        total_amount: totals.grandTotal
      })

      if (error) throw error
      alert('Invoice Saved!')
      navigate('/dashboard')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col md:flex-row gap-6">
      
      {/* LEFT COLUMN: EDIT FORM */}
      <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-lg h-fit overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-blue-800">1. Invoice Details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Invoice Date</label>
              <input type="date" {...register('invoiceDate')} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Due Date</label>
              <input type="date" {...register('dueDate')} className="w-full p-2 border rounded" />
            </div>
          </div>

          {/* Buyer Info */}
          <div className="bg-gray-50 p-3 rounded border">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Bill To:</h3>
            <input {...register('buyer_name')} placeholder="Business/Client Name" className="w-full p-2 border rounded mb-2" />
            <select {...register('buyer_state')} className="w-full p-2 border rounded mb-2">
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input {...register('buyer_gstin')} placeholder="GSTIN (Optional)" className="w-full p-2 border rounded" />
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Items</h3>
            {fields.map((item, index) => (
              <div key={item.id} className="flex gap-2 mb-2">
                <input {...register(`items.${index}.description`)} placeholder="Item" className="flex-grow p-2 border rounded text-sm" />
                <input {...register(`items.${index}.quantity`)} type="number" placeholder="Qty" className="w-16 p-2 border rounded text-sm" />
                <input {...register(`items.${index}.price`)} type="number" placeholder="₹" className="w-20 p-2 border rounded text-sm" />
                <button type="button" onClick={() => remove(index)} className="text-red-500 px-2">×</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ description: '', quantity: 1, price: 0, gstRate: 18 })} className="text-blue-600 text-sm font-bold">
              + Add Item
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <button type="button" onClick={handleDownloadPDF} className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-black">
              Download PDF
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              {loading ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: LIVE PREVIEW (A4 Paper) */}
      <div className="w-full md:w-1/2 flex justify-center bg-gray-200 p-4 rounded-lg overflow-auto">
        
        {/* The PDF Target Element */}
        <div 
          ref={invoiceRef} 
          className="bg-white shadow-2xl p-8 text-sm text-gray-800"
          style={{ width: '210mm', minHeight: '297mm' }} // A4 Size
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 uppercase tracking-wide">Invoice</h1>
              <p className="font-semibold text-lg mt-2">{sellerProfile?.business_name || 'Your Business Name'}</p>
              <p className="text-gray-500">{sellerProfile?.state}</p>
              {sellerProfile?.gstin && <p className="text-gray-500">GSTIN: {sellerProfile.gstin}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-500">Date: <span className="font-semibold text-black">{formData.invoiceDate}</span></p>
              {formData.dueDate && <p className="text-gray-500">Due Date: <span className="font-semibold text-black">{formData.dueDate}</span></p>}
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-gray-500 text-xs uppercase font-bold mb-1">Bill To</h3>
            <p className="text-xl font-bold">{formData.buyer_name || 'Client Name'}</p>
            <p>{formData.buyer_state}</p>
            {formData.buyer_gstin && <p>GSTIN: {formData.buyer_gstin}</p>}
          </div>

          {/* Table */}
          <table className="w-full mb-8 border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-800">
                <th className="text-left py-2 px-2 font-bold uppercase text-xs">Description</th>
                <th className="text-right py-2 px-2 font-bold uppercase text-xs">Qty</th>
                <th className="text-right py-2 px-2 font-bold uppercase text-xs">Price</th>
                <th className="text-right py-2 px-2 font-bold uppercase text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {formData.items?.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 px-2">{item.description}</td>
                  <td className="text-right py-2 px-2">{item.quantity}</td>
                  <td className="text-right py-2 px-2">₹{item.price}</td>
                  <td className="text-right py-2 px-2 font-semibold">
                    ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Totals */}
          <div className="flex justify-end">
            <div className="w-1/2 border-t pt-4">
              <div className="flex justify-between mb-1">
                <span>Subtotal</span>
                <span>₹{totals.subtotal}</span>
              </div>
              
              {/* GST Breakdown */}
              {parseFloat(totals.igst) > 0 ? (
                 <div className="flex justify-between mb-1 text-gray-600 text-xs">
                   <span>IGST</span>
                   <span>₹{totals.igst}</span>
                 </div>
              ) : (
                <>
                  <div className="flex justify-between mb-1 text-gray-600 text-xs">
                    <span>CGST</span>
                    <span>₹{totals.cgst}</span>
                  </div>
                  <div className="flex justify-between mb-1 text-gray-600 text-xs">
                    <span>SGST</span>
                    <span>₹{totals.sgst}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between mt-4 pt-2 border-t border-gray-800 font-bold text-xl">
                <span>Total</span>
                <span>₹{totals.grandTotal}</span>
              </div>
            </div>
          </div>
          
          {/* Terms / Notes */}
          <div className="mt-12 pt-8 border-t text-sm text-gray-500 text-center">
            <p>Thank you for your business!</p>
          </div>

        </div>
      </div>
    </div>
  )
}