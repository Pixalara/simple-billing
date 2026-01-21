import { useState, useEffect } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { INDIAN_STATES } from '../constants' // Import the list

export default function CreateInvoice() {
  const navigate = useNavigate()
  const { register, control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      items: [{ description: '', quantity: 1, price: 0, gstRate: 18 }]
    }
  })
  
  // Manage dynamic list of items
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const [sellerState, setSellerState] = useState('')
  const [loading, setLoading] = useState(false)

  // Watch fields for real-time calculation
  const items = useWatch({ control, name: 'items' })
  const buyerState = useWatch({ control, name: 'buyer_state' })

  // 1. Fetch Seller's State on Load
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')
      
      const { data } = await supabase
        .from('users')
        .select('state')
        .eq('id', user.id)
        .single()
      
      if (data) setSellerState(data.state)
    }
    fetchProfile()
  }, [])

  // 2. Calculate Totals Logic
  const calculateTotals = () => {
    let subtotal = 0
    let totalGST = 0

    items.forEach(item => {
      const lineTotal = (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)
      const taxAmount = (lineTotal * (parseFloat(item.gstRate) || 0)) / 100
      
      subtotal += lineTotal
      totalGST += taxAmount
    })

    // GST Logic: Intra-state vs Inter-state
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

  // 3. Save Invoice to Supabase
  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Auto-generate invoice number (Timestamp based for MVP simplicity)
      const invoiceNo = `INV-${Date.now().toString().slice(-6)}`

      const { error } = await supabase.from('invoices').insert({
        user_id: user.id,
        invoice_no: invoiceNo,
        invoice_data: { ...data, totals }, // Store full form data + calculated totals
        total_amount: totals.grandTotal
      })

      if (error) throw error
      alert('Invoice Saved Successfully!')
      navigate('/dashboard')
    } catch (error) {
      alert('Error saving invoice: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Create New Invoice</h1>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Buyer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded">
            <h3 className="col-span-2 font-semibold text-gray-700">Buyer Details</h3>
            <input {...register('buyer_name', { required: true })} placeholder="Buyer Name" className="p-2 border rounded" />
            
            {/* UPDATED: Dynamic State List */}
            <select 
                {...register('buyer_state', { required: true })} 
                className="p-2 border rounded"
            >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                        {state}
                    </option>
                ))}
            </select>

            <input {...register('buyer_gstin')} placeholder="Buyer GSTIN (Optional)" className="p-2 border rounded" />
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Items</h3>
            {fields.map((item, index) => (
              <div key={item.id} className="flex gap-2 mb-2 items-start">
                <input {...register(`items.${index}.description`)} placeholder="Item Description" className="flex-grow p-2 border rounded" />
                <input {...register(`items.${index}.quantity`)} type="number" placeholder="Qty" className="w-20 p-2 border rounded" />
                <input {...register(`items.${index}.price`)} type="number" placeholder="Price" className="w-24 p-2 border rounded" />
                <select {...register(`items.${index}.gstRate`)} className="w-24 p-2 border rounded">
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
                <button type="button" onClick={() => remove(index)} className="text-red-500 p-2">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ description: '', quantity: 1, price: 0, gstRate: 18 })} className="text-blue-600 text-sm font-semibold">
              + Add Item
            </button>
          </div>

          {/* Live Totals Display */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2 text-right">
              <div className="flex justify-between"><span>Subtotal:</span> <span>₹{totals.subtotal}</span></div>
              {parseFloat(totals.cgst) > 0 && <div className="flex justify-between text-sm text-gray-600"><span>CGST:</span> <span>₹{totals.cgst}</span></div>}
              {parseFloat(totals.sgst) > 0 && <div className="flex justify-between text-sm text-gray-600"><span>SGST:</span> <span>₹{totals.sgst}</span></div>}
              {parseFloat(totals.igst) > 0 && <div className="flex justify-between text-sm text-gray-600"><span>IGST:</span> <span>₹{totals.igst}</span></div>}
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total:</span> <span>₹{totals.grandTotal}</span></div>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2 border rounded text-gray-600">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex-grow">
              {loading ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}