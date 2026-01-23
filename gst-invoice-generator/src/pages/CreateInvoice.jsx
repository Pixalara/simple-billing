import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'
import { INDIAN_STATES, HSN_CODES } from '../constants'
import SearchableSelect from '../components/SearchableSelect'
import html2pdf from 'html2pdf.js'

const THEMES = [
  { name: 'Blue', hex: '#2563eb', text: 'white' },
  { name: 'Green', hex: '#16a34a', text: 'white' },
  { name: 'Red', hex: '#dc2626', text: 'white' },
  { name: 'Black', hex: '#1f2937', text: 'white' },
  { name: 'Orange', hex: '#ea580c', text: 'white' },
]

// --- HELPER: NUMBER TO WORDS ---
const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const regex = /^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/;
    const getLT20 = (n) => a[Number(n)];
    const get20Plus = (n) => b[n[0]] + ' ' + a[n[1]];

    const convert = (num) => {
        if (num === 0) return '';
        if (num < 20) return getLT20(num);
        if (num < 100) return get20Plus(String(num));
        if (num < 1000) return getLT20(String(num)[0]) + 'Hundred ' + convert(num % 100);
        if (num < 100000) return convert(Math.floor(num / 1000)) + 'Thousand ' + convert(num % 1000);
        if (num < 10000000) return convert(Math.floor(num / 100000)) + 'Lakh ' + convert(num % 100000);
        return convert(Math.floor(num / 10000000)) + 'Crore ' + convert(num % 10000000);
    }

    const [rupees, paise] = Number(num).toFixed(2).split('.');
    let str = convert(Number(rupees)) + 'Rupees ';
    
    if (Number(paise) > 0) {
        str += 'and ' + convert(Number(paise)) + 'Paise ';
    }
    
    return str + 'Only';
}

// --- HELPER: DATE FORMATTER (DD-MM-YYYY) ---
const formatDate = (dateString) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    return `${day}-${month}-${year}`
}

export default function CreateInvoice() {
  const navigate = useNavigate()
  const { id } = useParams()
  const invoiceRef = useRef()
  const containerRef = useRef()
  
  const [mobileTab, setMobileTab] = useState('edit')
  const [previewScale, setPreviewScale] = useState(1)
  
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [sellerProfile, setSellerProfile] = useState(null)
  const [theme, setTheme] = useState(THEMES[0])
  const [signaturePreview, setSignaturePreview] = useState(null)
  const [existingInvoiceNo, setExistingInvoiceNo] = useState(null)

  const { register, control, handleSubmit, setValue, reset, watch } = useForm({
    defaultValues: {
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [{ description: '', hsn: '', quantity: 1, price: 0, gstRate: 18 }],
      terms: '1. Payment must be made within 7 days from the invoice date.\n2. Goods once sold will not be taken back.\n3. Interest @ 18% p.a. will be charged if payment is delayed.',
    }
  })

  const formData = watch()
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')
      
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (profile) {
          setSellerProfile(profile)
          if (profile.signature_url) {
              setSignaturePreview(profile.signature_url)
          }
      }

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

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.offsetWidth
        const requiredWidth = 794
        const padding = 32
        let scale = (availableWidth - padding) / requiredWidth
        if (scale > 1) scale = 1
        setPreviewScale(scale)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    const timeout = setTimeout(handleResize, 100) 
    return () => {
        window.removeEventListener('resize', handleResize)
        clearTimeout(timeout)
    }
  }, [mobileTab])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setSignaturePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

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
  const amountInWords = totals.grandTotal ? numberToWords(totals.grandTotal) : '';

  const getTaxRateText = (type) => {
    const rates = new Set(formData.items?.map(i => parseFloat(i.gstRate)).filter(r => r > 0));
    if (rates.size === 1) {
        const rate = [...rates][0];
        if (type === 'IGST') return `(${rate}%)`;
        if (type === 'CGST' || type === 'SGST') return `(${rate / 2}%)`;
    }
    return ''; 
  }

  // --- PDF GENERATION ---
  const generatePdfBlob = async () => {
      const originalElement = invoiceRef.current
      if (!originalElement) return null;

      const clone = originalElement.cloneNode(true)
      
      clone.style.width = '794px' 
      clone.style.minHeight = '1122px'
      clone.style.height = 'auto'
      clone.style.overflow = 'visible'
      clone.style.transform = 'none'
      clone.style.margin = '0'
      clone.style.backgroundColor = 'white'
      clone.classList.remove('w-full', 'lg:w-7/12', 'flex', 'justify-center', 'shadow-2xl', 'p-8') 
      
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.top = '0'
      container.style.left = '0'
      container.style.zIndex = '-1000'
      container.style.width = '794px'
      container.appendChild(clone)
      document.body.appendChild(container)

      const opt = {
        margin: 0,
        filename: `Invoice_${formData.buyer_name || 'Customer'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        enableLinks: true, 
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            scrollY: 0,
            width: 794,
            windowWidth: 794 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }
      
      try {
        const pdfBlob = await html2pdf().set(opt).from(clone).output('blob')
        document.body.removeChild(container)
        return { blob: pdfBlob, filename: opt.filename }
      } catch (err) {
        document.body.removeChild(container)
        throw err
      }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      const result = await generatePdfBlob()
      if (!result) return

      const file = new File([result.blob], result.filename, { type: 'application/pdf' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Invoice',
          text: `Here is the invoice from ${sellerProfile?.business_name}. Powered by pixalara.com`,
        })
      } else {
        const url = URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        a.click()
        alert('On Desktop/Web, please drag the downloaded file to WhatsApp/Email manually.')
      }
    } catch (error) {
      console.log('Error sharing:', error)
    } finally {
      setSharing(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
        const result = await generatePdfBlob()
        if (result) {
            const url = URL.createObjectURL(result.blob)
            const a = document.createElement('a')
            a.href = url
            a.download = result.filename
            a.click()
        }
    } catch (e) {
        alert('Error generating PDF')
    }
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
    <div className="min-h-screen bg-gray-100 p-0 md:p-4 lg:p-8 flex flex-col lg:flex-row gap-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-preview, #invoice-preview * { visibility: visible; }
          #invoice-preview { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; transform: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      {/* --- MOBILE TABS --- */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b flex text-sm font-bold shadow-sm">
        <button onClick={() => setMobileTab('edit')} className={`flex-1 py-3 text-center ${mobileTab === 'edit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>✎ Editor</button>
        <button onClick={() => setMobileTab('preview')} className={`flex-1 py-3 text-center ${mobileTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>👁 Preview</button>
      </div>

      {/* --- LEFT SIDE: EDITOR --- */}
      <div className={`no-print w-full lg:w-5/12 bg-white p-4 md:p-6 rounded-lg shadow-lg h-fit overflow-y-auto max-h-screen custom-scrollbar ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors font-medium"
        >
          ← Back to Dashboard
        </button>

        <div className="flex justify-between items-center mb-4 border-t pt-4">
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
              <label className="text-xs text-gray-500">Date</label>
              <input type="date" {...register('invoiceDate')} className="w-full p-2 border rounded text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Due Date</label>
              <input type="date" {...register('dueDate')} className="w-full p-2 border rounded text-sm" />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded border">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Bill To</h3>
            <input {...register('buyer_name')} placeholder="Client Name" className="w-full p-2 border rounded mb-2 text-sm" />
            <select {...register('buyer_state')} className="w-full p-2 border rounded mb-2 text-sm">
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input {...register('buyer_gstin')} placeholder="GSTIN (Optional)" className="w-full p-2 border rounded text-sm" />
            <input {...register('buyer_address')} placeholder="Address" className="w-full p-2 border rounded mt-2 text-sm" />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Items</h3>
            {fields.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-2 mb-4 p-3 bg-gray-50 rounded border">
                <div className="w-full">
                    <label className="text-xs text-gray-500 font-bold">Search Item</label>
                    <SearchableSelect 
                        options={HSN_CODES} 
                        value={formData.items[index]?.description}
                        placeholder="Start typing..."
                        onChange={(selected) => handleItemSelect(index, selected)}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="w-2/5">
                        <label className="text-xs text-gray-500">Price</label>
                        <input {...register(`items.${index}.price`)} type="number" className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div className="w-1/5">
                        <label className="text-xs text-gray-500">Qty</label>
                        <input {...register(`items.${index}.quantity`)} type="number" className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div className="w-2/5">
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
                <button type="button" onClick={() => remove(index)} className="text-red-500 text-xs text-right hover:underline mt-1">Remove Item</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ description: '', hsn: '', quantity: 1, price: 0, gstRate: 18 })} className="text-blue-600 text-sm font-bold p-1">
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
             <div className="bg-gray-50 p-3 rounded border">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500">Signature</label>
                    {signaturePreview && <span className="text-xs text-green-600 font-semibold">✓ Loaded from Profile</span>}
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Terms</label>
              <textarea {...register('terms')} rows="3" className="w-full p-2 border rounded text-sm"></textarea>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t sticky bottom-0 bg-white z-10 pb-4 md:pb-0">
            <button type="button" onClick={handleShare} disabled={sharing} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold shadow flex items-center justify-center gap-2">
               {sharing ? '...' : 'Share Invoice'} 
               <span className="text-xs font-normal opacity-75">(WhatsApp)</span>
            </button>

            <div className="flex gap-2">
                <button type="button" onClick={handlePrint} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded hover:bg-gray-300 font-bold">Print</button>
                <button type="button" onClick={handleDownloadPDF} className="flex-1 bg-gray-900 text-white py-3 rounded hover:bg-black font-bold">PDF</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold">
                    {loading ? '...' : (id ? 'Update' : 'Save')}
                </button>
            </div>
          </div>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
           <p>Powered by <a href="https://pixalara.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">pixalara.com</a></p>
        </div>
      </div>

      {/* --- RIGHT SIDE: PREVIEW --- */}
      <div 
        ref={containerRef}
        className={`w-full lg:w-7/12 flex justify-center bg-gray-300 p-0 md:p-8 overflow-hidden ${mobileTab === 'edit' ? 'hidden lg:flex' : 'flex'}`}
      >
        <div 
            className="flex justify-center origin-top p-4 md:p-0 transition-transform duration-200 ease-out"
            style={{ 
                transform: `scale(${previewScale})`, 
                transformOrigin: 'top center',
                height: previewScale < 1 ? `${(297 * 3.78 * previewScale) + 30}px` : 'auto' 
            }}
        >
            <div 
                id="invoice-preview" 
                ref={invoiceRef} 
                className="bg-white shadow-2xl relative shrink-0" 
                style={{ width: '210mm', minHeight: '297mm', padding: '0' }}
            >
            
            <div className="px-6 py-4 flex justify-between" style={{ backgroundColor: theme.hex, color: theme.text }}>
                <div style={{ width: '50%' }}>
                    {sellerProfile?.logo_url && (
                        <img 
                            src={sellerProfile.logo_url} 
                            alt="Logo" 
                            crossOrigin="anonymous" 
                            className="h-12 w-auto mb-1 object-contain bg-white rounded p-0.5" 
                        />
                    )}
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Invoice</h1>
                    <p className="opacity-80 text-xs"># {existingInvoiceNo || 'DRAFT'}</p>
                </div>
                <div className="text-right" style={{ width: '50%' }}>
                    <h2 className="text-lg font-bold leading-tight">{sellerProfile?.business_name || 'Your Business Name'}</h2>
                    <p className="opacity-90 text-xs leading-tight">{sellerProfile?.state}</p>
                    {sellerProfile?.business_email && <p className="opacity-90 text-[10px] leading-tight">{sellerProfile.business_email}</p>}
                    {sellerProfile?.business_phone && <p className="opacity-90 text-[10px] leading-tight">{sellerProfile.business_phone}</p>}
                    {sellerProfile?.gstin && <p className="font-semibold mt-0.5 text-xs">GSTIN: {sellerProfile.gstin}</p>}
                </div>
            </div>

            <div className="px-6 py-4 pb-12">
                <div className="flex justify-between mb-6">
                    <div style={{ width: '60%' }}>
                        <h3 className="text-gray-500 text-[10px] uppercase font-bold mb-1">Bill To</h3>
                        <p className="text-base font-bold text-gray-800 leading-tight">{formData.buyer_name || 'Client Name'}</p>
                        <p className="text-gray-600 text-xs whitespace-pre-wrap leading-tight">{formData.buyer_address}</p>
                        <p className="text-gray-600 text-xs">{formData.buyer_state}</p>
                        {formData.buyer_gstin && <p className="text-xs font-semibold mt-1">GSTIN: {formData.buyer_gstin}</p>}
                    </div>
                    <div className="text-right" style={{ width: '35%' }}>
                        <div className="mb-1 flex justify-between">
                            <span className="text-gray-500 text-xs mr-2">Date:</span>
                            <span className="font-semibold text-sm">{formatDate(formData.invoiceDate)}</span>
                        </div>
                        {formData.dueDate && (
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-xs mr-2">Due Date:</span>
                                <span className="font-semibold text-sm">{formatDate(formData.dueDate)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <table className="w-full mb-6 border-collapse">
                <thead>
                    <tr style={{ color: theme.text }}>
                        {/* FIXED PDF VERTICAL ALIGNMENT WITH FLEXBOX */}
                        <th style={{ backgroundColor: theme.hex, width: '41.6%', padding: 0, border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '35px', paddingLeft: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                ITEM
                            </div>
                        </th>
                        <th style={{ backgroundColor: theme.hex, width: '16.6%', padding: 0, border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '35px', paddingLeft: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                                HSN
                            </div>
                        </th>
                        <th style={{ backgroundColor: theme.hex, width: '8.33%', padding: 0, border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '35px', fontSize: '11px', fontWeight: 'bold' }}>
                                QTY
                            </div>
                        </th>
                        <th style={{ backgroundColor: theme.hex, width: '16.6%', padding: 0, border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '35px', paddingRight: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                PRICE
                            </div>
                        </th>
                        <th style={{ backgroundColor: theme.hex, width: '16.6%', padding: 0, border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '35px', paddingRight: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                TOTAL
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {formData.items?.map((item, i) => {
                    const amount = ((item.quantity||0) * (item.price||0));
                    return (
                        <tr key={i} className="border-b border-gray-200">
                        <td className="py-2 px-2">
                            <p className="font-semibold text-gray-800 text-sm">{item.description}</p>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-600">{item.hsn}</td>
                        <td className="text-center py-2 px-2 text-sm">{item.quantity}</td>
                        <td className="text-right py-2 px-2 text-sm">₹{item.price}</td>
                        <td className="text-right py-2 px-2 font-bold text-gray-800 text-sm">
                            ₹{(amount).toFixed(2)}
                        </td>
                        </tr>
                    )
                    })}
                </tbody>
                </table>
                
                <div className="flex justify-end">
                    <div className="w-5/12 space-y-1 border-b pb-3">
                        <div className="flex justify-between text-gray-600 text-sm"><span>Subtotal</span><span>₹{totals.subtotal}</span></div>
                        {parseFloat(totals.igst) > 0 ? (
                        <div className="flex justify-between text-gray-600 text-xs">
                            <span>IGST {getTaxRateText('IGST')}</span>
                            <span>₹{totals.igst}</span>
                        </div>
                        ) : (
                        <>
                            <div className="flex justify-between text-gray-600 text-xs">
                                <span>CGST {getTaxRateText('CGST')}</span>
                                <span>₹{totals.cgst}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-xs">
                                <span>SGST {getTaxRateText('SGST')}</span>
                                <span>₹{totals.sgst}</span>
                            </div>
                        </>
                        )}
                        <div className="flex justify-between py-2 text-xl font-bold" style={{ color: theme.hex }}>
                            <span>Total</span><span>₹{totals.grandTotal}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-2 text-right">
                    <p className="text-xs text-gray-500 font-semibold italic">Amount in Words:</p>
                    <p className="text-xs font-bold text-gray-800">{amountInWords}</p>
                </div>
                
                <div className="flex justify-between mt-8 items-end">
                    <div className="text-xs text-black w-7/12">
                        {sellerProfile?.bank_name && (
                            <div className="border p-2 rounded bg-gray-50">
                                <p className="font-bold text-gray-700 mb-1 border-b border-gray-300 pb-1">Bank Details</p>
                                <div className="grid grid-cols-3 gap-y-0.5">
                                    <span className="font-semibold col-span-1">Bank:</span>
                                    <span className="col-span-2">{sellerProfile.bank_name}</span>
                                    <span className="font-semibold col-span-1">A/c No:</span>
                                    <span className="col-span-2">{sellerProfile.account_number}</span>
                                    <span className="font-semibold col-span-1">IFSC:</span>
                                    <span className="col-span-2">{sellerProfile.ifsc_code}</span>
                                    {sellerProfile.branch_name && (
                                        <>
                                            <span className="font-semibold col-span-1">Branch:</span>
                                            <span className="col-span-2">{sellerProfile.branch_name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-right w-4/12">
                        {signaturePreview && (
                            <img 
                                src={signaturePreview} 
                                alt="Sign" 
                                crossOrigin="anonymous" 
                                className="h-12 ml-auto mb-1 object-contain" 
                            />
                        )}
                        <p className="text-[10px] font-bold uppercase">Authorized Signatory</p>
                        <p className="text-[10px] text-gray-500">{sellerProfile?.business_name}</p>
                    </div>
                </div>
                
                <div className="mt-6 pt-3 border-t text-xs text-gray-600">
                    <h4 className="font-bold text-gray-800 mb-1">Terms & Conditions</h4>
                    <p className="whitespace-pre-wrap text-[10px]">{formData.terms}</p>
                </div>
            </div>

            <div className="absolute bottom-10 w-full text-center">
                 <p className="text-xs text-gray-700 font-medium">
                     Powered by <a href="https://pixalara.com/" target="_blank" rel="noreferrer" className="text-gray-900 hover:underline font-bold">pixalara.com</a>
                 </p>
            </div>

            <div className="h-6 w-full absolute bottom-0" style={{ backgroundColor: theme.hex }}></div>
            </div>
        </div>
      </div>
    </div>
  )
}