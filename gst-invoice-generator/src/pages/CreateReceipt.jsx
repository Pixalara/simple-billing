import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../supabaseClient'
import BrandingFooter from '../components/BrandingFooter'
import html2pdf from 'html2pdf.js'

// PDF Generation Constants
const MIN_VALID_PDF_SIZE_BYTES = 1000
const IMAGE_LOAD_TIMEOUT_MS = 15000
const MOBILE_RENDER_WAIT_MS = 500

const THEMES = [
  { name: 'Blue', hex: '#2563eb', text: 'white' },
  { name: 'Green', hex: '#16a34a', text: 'white' },
  { name: 'Red', hex: '#dc2626', text: 'white' },
  { name: 'Black', hex: '#1f2937', text: 'white' },
  { name: 'Orange', hex: '#ea580c', text: 'white' },
]

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
]

const PAYMENT_METHODS = [
  'Stripe',
  'PayPal',
  'UPI',
  'Razorpay',
  'Credit Card',
  'Bank Transfer',
  'Apple Pay',
  'Google Pay',
]

const numberToWords = (num, currencySymbol = '$') => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (n) => {
    if (n === 0) return '';
    if (n < 20) return a[Number(n)];
    if (n < 100) return b[Math.floor(n/10)] + ' ' + a[n % 10];
    if (n < 1000) return a[Math.floor(n/100)] + 'Hundred ' + convert(n % 100);
    if (n < 1000000) return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000);
    return convert(Math.floor(n / 1000000)) + 'Million ' + convert(n % 1000000);
  }
  
  const [mainUnit, fractionUnit] = Number(num).toFixed(2).split('.');
  let str = '';
  
  const isINR = currencySymbol === '₹';
  
  if (isINR) {
    const convertINR = (n) => {
      if (n === 0) return '';
      if (n < 20) return a[Number(n)];
      if (n < 100) return b[Math.floor(n/10)] + ' ' + a[n % 10];
      if (n < 1000) return a[Math.floor(n/100)] + 'Hundred ' + convertINR(n % 100);
      if (n < 100000) return convertINR(Math.floor(n / 1000)) + 'Thousand ' + convertINR(n % 1000);
      if (n < 10000000) return convertINR(Math.floor(n / 100000)) + 'Lakh ' + convertINR(n % 100000);
      return convertINR(Math.floor(n / 10000000)) + 'Crore ' + convertINR(n % 10000000);
    }
    str = convertINR(Number(mainUnit)) + 'Rupees ';
    if (Number(fractionUnit) > 0) {
      str += 'and ' + convertINR(Number(fractionUnit)) + 'Paise ';
    }
    return str + 'Only';
  } else {
    str = convert(Number(mainUnit)) + 'Dollars ';
    if (Number(fractionUnit) > 0) {
      str += 'and ' + convert(Number(fractionUnit)) + 'Cents ';
    }
    return str + 'Only';
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  return `${day}-${month}-${year}`
}

export default function CreateReceipt() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const containerRef = useRef()
  const receiptRef = useRef()

  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [sellerProfile, setSellerProfile] = useState(null)
  const [signaturePreview, setSignaturePreview] = useState(null)
  const [stampPreview, setStampPreview] = useState(null)
  const [theme, setTheme] = useState(THEMES[0])
  const [previewScale, setPreviewScale] = useState(1)
  const [mobileTab, setMobileTab] = useState('edit') // 'edit' or 'preview'
  const [popup, setPopup] = useState({ isOpen: false, title: '', message: '', type: 'success', actionLabel: 'OK', onAction: null, cancelLabel: null })
  const [customers, setCustomers] = useState([])

  const showPopup = (title, message, type = 'success', actionLabel = 'OK', onAction = null, cancelLabel = null) => { 
    setPopup({ isOpen: true, title, message, type, actionLabel, onAction, cancelLabel }) 
  }
  const closePopup = () => setPopup({ ...popup, isOpen: false })

  // Initialize form
  const { register, handleSubmit, setValue, reset, watch } = useForm({
    defaultValues: {
      receipt_no: '',
      receiptDate: new Date().toISOString().split('T')[0],
      buyer_name: '',
      buyer_email: '',
      buyer_address: '',
      customerId: '',
      productName: '',
      planName: '',
      amount: '',
      planDuration: '1',
      planType: 'monthly',
      currency: 'INR',
      paymentMethod: 'Stripe',
      transactionId: '',
      taxRate: '0',
      removeSignatureStamp: true,
      isSystemGenerated: true,
      notes: 'Thank you for your business! For any billing queries, please contact support.',
    }
  })

  const formData = watch()

  // Calculate totals
  const price = parseFloat(formData.amount || 0)
  const taxRate = parseFloat(formData.taxRate || 0)
  const subtotal = parseFloat(price.toFixed(2))
  const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2))
  const grandTotal = parseFloat((subtotal + taxAmount).toFixed(2))

  const selectedCurrency = CURRENCIES.find(c => c.code === formData.currency) || CURRENCIES[0]
  const currencySymbol = selectedCurrency.symbol

  const amountInWords = numberToWords(grandTotal, currencySymbol)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')

      // Fetch business profile
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (profile) {
        setSellerProfile({ ...profile, address: localStorage.getItem('business_address') || '' })
        if (profile.signature_url) setSignaturePreview(profile.signature_url)
        if (profile.stamp_url) setStampPreview(profile.stamp_url)
      }

      // Fetch customers
      try {
        const { data: allDocs } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
        if (allDocs) {
          const custs = allDocs
            .filter(doc => doc.invoice_data?.type === 'customer')
            .map(doc => ({
              id: doc.id,
              customer_id: doc.invoice_no,
              name: doc.invoice_data?.name || '',
              email: doc.invoice_data?.email || '',
              phone: doc.invoice_data?.phone || '',
              address: doc.invoice_data?.address || '',
              product: doc.invoice_data?.product || '',
            }))
          setCustomers(custs)
        }
      } catch (err) {
        console.error("Error fetching customers:", err)
      }

      // Load SaaS Settings Defaults
      const savedDefaultsStr = localStorage.getItem('saas_receipt_settings')
      let savedDefaults = {}
      if (savedDefaultsStr) {
        try {
          savedDefaults = JSON.parse(savedDefaultsStr)
        } catch (e) {
          console.error(e)
        }
      }

      if (id) {
        // Editing existing receipt
        const { data: receipt } = await supabase.from('invoices').select('*').eq('id', id).single()
        if (receipt && receipt.invoice_data?.type === 'receipt') {
          reset(receipt.invoice_data)
          setValue('receipt_no', receipt.invoice_no)
          if (receipt.invoice_data.theme) {
            const foundTheme = THEMES.find(t => t.hex === receipt.invoice_data.theme)
            if (foundTheme) setTheme(foundTheme)
          }
        } else {
          showPopup('Error', 'Receipt not found', 'error', 'Go back', () => navigate('/dashboard'))
        }
      } else {
        // Creating new receipt, apply defaults
        if (savedDefaults.productName) setValue('productName', savedDefaults.productName)
        if (savedDefaults.planName) setValue('planName', savedDefaults.planName)
        if (savedDefaults.amount) setValue('amount', savedDefaults.amount)
        if (savedDefaults.planDuration) setValue('planDuration', savedDefaults.planDuration)
        if (savedDefaults.planType) setValue('planType', savedDefaults.planType)
        if (savedDefaults.removeSignatureStamp !== undefined) setValue('removeSignatureStamp', savedDefaults.removeSignatureStamp)
        if (savedDefaults.isSystemGenerated !== undefined) setValue('isSystemGenerated', savedDefaults.isSystemGenerated)

        // Generate receipt number
        try {
          const date = new Date()
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          const prefix = `REC-${year}${month}${day}-`
          
          const { data: lastReceipt } = await supabase
            .from('invoices')
            .select('invoice_no')
            .eq('user_id', user.id)
            .ilike('invoice_no', `${prefix}%`)
            .order('invoice_no', { ascending: false })
            .limit(1)
            .single()

          let sequence = '01'
          if (lastReceipt && lastReceipt.invoice_no) {
            const lastSeqStr = lastReceipt.invoice_no.replace(prefix, '')
            const lastSeqNum = parseInt(lastSeqStr, 10)
            if (!isNaN(lastSeqNum)) {
              sequence = String(lastSeqNum + 1).padStart(2, '0')
            }
          }
          setValue('receipt_no', `${prefix}${sequence}`)
        } catch (e) {
          console.error(e)
          setValue('receipt_no', `REC-${Date.now().toString().slice(-6)}`)
        }
      }
    }
    loadData()
  }, [id, navigate, reset, setValue])

  // Scale preview for screen size
  useEffect(() => {
    const handleResize = () => { 
      if (containerRef.current) { 
        const s = (containerRef.current.offsetWidth - 32) / 794; 
        setPreviewScale(s > 1 ? 1 : s) 
      } 
    }; 
    handleResize(); 
    window.addEventListener('resize', handleResize); 
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileTab])

  // Enforce visibility of cloned elements for PDF
  const enforceElementVisibility = (element) => {
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none') {
        el.style.setProperty('display', 'block', 'important');
      }
      if (style.visibility === 'hidden') {
        el.style.setProperty('visibility', 'visible', 'important');
      }
      if (style.opacity === '0') {
        el.style.setProperty('opacity', '1', 'important');
      }
      el.classList.remove('hidden', 'invisible');
    });
  }

  // Generate PDF Blob
  const generatePdfBlob = async () => {
    const originalElement = receiptRef.current
    if (!originalElement) {
      console.error('Receipt ref is null')
      return null
    }

    const clone = originalElement.cloneNode(true)
    
    // Set exact dimensions
    clone.style.width = '794px'
    clone.style.height = '1123px'
    clone.style.minHeight = '1123px'
    clone.style.maxHeight = '1123px'
    clone.style.overflow = 'hidden'
    clone.style.transform = 'none'
    clone.style.margin = '0'
    clone.style.padding = '0'
    clone.style.backgroundColor = 'white'
    clone.style.display = 'flex'
    clone.style.flexDirection = 'column'
    clone.style.position = 'relative'
    clone.style.boxShadow = 'none'
    clone.style.border = 'none'
    clone.style.visibility = 'visible'
    clone.style.opacity = '1'
    clone.classList.remove('w-full', 'lg:w-7/12', 'flex', 'justify-center', 'shadow-2xl', 'p-8', 'hidden', 'lg:flex', 'rounded-2xl')
    
    enforceElementVisibility(clone)

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '794px'
    container.style.height = '1123px'
    container.style.backgroundColor = 'white'
    container.style.zIndex = '-9999'
    container.style.overflow = 'hidden'
    container.style.visibility = 'visible'
    container.style.opacity = '1'
    container.style.transform = 'none'
    
    container.appendChild(clone)
    document.body.appendChild(container)

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Wait for images
    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise(resolve => { 
        img.onload = resolve; 
        img.onerror = resolve;
        setTimeout(resolve, IMAGE_LOAD_TIMEOUT_MS);
      });
    }));

    await new Promise(resolve => setTimeout(resolve, MOBILE_RENDER_WAIT_MS));
    void clone.offsetHeight;

    const buyerName = (formData.buyer_name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')
    const receiptNum = (formData.receipt_no || 'RECEIPT').replace(/[^a-zA-Z0-9]/g, '_')
    const safeFileName = `${buyerName}_${receiptNum}.pdf`

    const opt = {
      margin: 0,
      filename: safeFileName,
      image: { type: 'jpeg', quality: 0.98 },
      enableLinks: false,
      pagebreak: { mode: 'avoid' },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollY: 0,
        scrollX: 0,
        windowHeight: 1123,
        windowWidth: 794,
        letterRendering: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        imageTimeout: 15000,
        onclone: function(clonedDoc) {
          const clonedContainer = clonedDoc.querySelector('#receipt-preview') || clonedDoc.querySelector('[style*="794px"]');
          if (clonedContainer) {
            clonedContainer.style.visibility = 'visible';
            clonedContainer.style.display = 'flex';
            clonedContainer.style.opacity = '1';
            clonedContainer.style.backgroundColor = '#ffffff';
            clonedContainer.style.transform = 'none';
          }
          enforceElementVisibility(clonedDoc);
        }
      },
      jsPDF: {
        unit: 'px',
        format: [794, 1123],
        orientation: 'portrait',
        compress: true,
        precision: 10,
        hotfixes: ['px_scaling']
      }
    }

    try {
      const elementToRender = container.querySelector('#receipt-preview') || clone
      const pdfBlob = await html2pdf().set(opt).from(elementToRender).output('blob')
      document.body.removeChild(container)
      return { blob: pdfBlob, filename: safeFileName }
    } catch (e) {
      console.error(e)
      if (document.body.contains(container)) document.body.removeChild(container)
      throw e
    }
  }

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  const handleDownloadPDF = async () => {
    try {
      setLoading(true)
      const res = await generatePdfBlob()
      if (res && res.blob) {
        downloadBlob(res.blob, res.filename)
      } else {
        showPopup('Error', 'Failed to generate PDF.', 'error');
      }
    } catch (e) {
      console.error(e)
      showPopup('Error', 'Failed to generate PDF.', 'error');
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const result = await generatePdfBlob()
      if (!result || !result.blob || result.blob.size < MIN_VALID_PDF_SIZE_BYTES) {
        showPopup('Error', 'Failed to generate PDF', 'error')
        return
      }

      const file = new File([result.blob], result.filename, { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Payment Receipt',
          text: `Payment Receipt from ${sellerProfile?.business_name || 'Business'}`
        })
      } else {
        downloadBlob(result.blob, result.filename)
        showPopup('Downloaded', 'Sharing is not supported by your browser. PDF downloaded.', 'info')
      }
    } catch (e) {
      console.error(e)
      showPopup('Error', 'Failed to share receipt: ' + e.message, 'error')
    } finally {
      setSharing(false)
    }
  }

  // Handle Form Submit (Save to DB)
  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        user_id: user.id,
        invoice_no: data.receipt_no,
        invoice_data: {
          ...data,
          type: 'receipt', // Mark document type
          subtotal,
          taxAmount,
          grandTotal,
          currencySymbol,
          theme: theme.hex
        },
        total_amount: grandTotal
      }

      if (id) {
        await supabase.from('invoices').update(payload).eq('id', id)
      } else {
        await supabase.from('invoices').insert(payload)
      }

      showPopup(
        'Success!',
        'Receipt saved successfully.',
        'success',
        'Go to Dashboard',
        () => navigate('/dashboard'),
        'Stay Here'
      )
    } catch (e) {
      console.error(e)
      showPopup('Error', 'Failed to save receipt: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      {/* HEADER BAR */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors font-bold"
          >
            ← Back
          </button>
          <div className="h-6 w-[1px] bg-gray-200"></div>
          <h1 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
            📄 {id ? 'Edit' : 'Create'} Receipt
          </h1>
        </div>
        
        <div className="flex gap-2">
          {/* Mobile view selector */}
          <div className="flex lg:hidden bg-gray-100 p-0.5 rounded-lg border">
            <button 
              onClick={() => setMobileTab('edit')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${mobileTab === 'edit' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              Edit
            </button>
            <button 
              onClick={() => setMobileTab('preview')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${mobileTab === 'preview' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              Preview
            </button>
          </div>

          <button 
            onClick={handleShare} 
            disabled={sharing || loading}
            className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold border border-blue-200 hover:bg-blue-100 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {sharing ? 'Sharing...' : 'Share'}
          </button>

          <button 
            onClick={handleSubmit(onSubmit)} 
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold shadow hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: FORM INPUTS */}
        <div className={`w-full lg:w-5/12 bg-white border-r overflow-y-auto p-4 sm:p-6 space-y-6 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Theme Picker */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-xs uppercase font-bold text-gray-500 mb-3 tracking-wider">Accent Theme</h3>
              <div className="flex gap-2.5">
                {THEMES.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setTheme(t)}
                    style={{ backgroundColor: t.hex }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all transform active:scale-90 ${theme.name === t.name ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                  >
                    {theme.name === t.name && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Receipt Meta Details */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Receipt Metadata</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Receipt Number</label>
                  <input 
                    type="text" 
                    {...register('receipt_no')} 
                    placeholder="REC-XXXXXXXXXX" 
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Payment Date</label>
                  <input 
                    type="date" 
                    {...register('receiptDate')} 
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Currency</label>
                  <select 
                    {...register('currency')} 
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Payment Method</label>
                  <select 
                    {...register('paymentMethod')} 
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Transaction/Reference ID (Optional)</label>
                <input 
                  type="text" 
                  {...register('transactionId')} 
                  placeholder="e.g. txn_3M2db9Hq2x9..." 
                  className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                />
              </div>
            </div>

            {/* Subscriber Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Subscriber Details</h3>
              
              <input type="hidden" {...register('customerId')} />

              {customers.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Select Existing Customer (Auto-fill)</label>
                  <select
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none font-medium text-gray-700"
                    onChange={(e) => {
                      const selectedId = e.target.value
                      if (selectedId === '') {
                        setValue('customerId', '')
                        return
                      }
                      const cust = customers.find(c => c.customer_id === selectedId)
                      if (cust) {
                        setValue('customerId', cust.customer_id)
                        setValue('buyer_name', cust.name)
                        setValue('buyer_email', cust.email)
                        const fullAddr = [cust.address, cust.city, cust.state].filter(Boolean).join(', ')
                        setValue('buyer_address', fullAddr)
                        if (cust.product) {
                          setValue('productName', cust.product)
                        }
                      }
                    }}
                    value={formData.customerId || ''}
                  >
                    <option value="">-- Choose a Customer --</option>
                    {customers.map(c => (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.name} ({c.customer_id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Customer Name</label>
                <input 
                  type="text" 
                  {...register('buyer_name')} 
                  placeholder="e.g. John Doe" 
                  className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Customer Email</label>
                <input 
                  type="email" 
                  {...register('buyer_email')} 
                  placeholder="e.g. john@example.com" 
                  className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Billing Address (Optional)</label>
                <textarea 
                  {...register('buyer_address')} 
                  rows="2"
                  placeholder="Street, City, State, Country, ZIP" 
                  className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                />
              </div>
            </div>

            {/* Subscription details */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Subscription Details</h3>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Product Name</label>
                <input 
                  type="text" 
                  {...register('productName')} 
                  placeholder="e.g. Pixalara" 
                  className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Plan Name</label>
                <input 
                  type="text" 
                  {...register('planName')} 
                  placeholder="e.g. Premium Growth Plan" 
                  className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Plan Duration</label>
                  <input 
                    type="number" 
                    {...register('planDuration')} 
                    placeholder="e.g. 1" 
                    min="1"
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Billing Cycle</label>
                  <select 
                    {...register('planType')} 
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Plan Price / Amount</label>
                  <input 
                    type="number" 
                    step="0.01"
                    {...register('amount')} 
                    placeholder="e.g. 4999.00" 
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Tax Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    {...register('taxRate')} 
                    placeholder="e.g. 18" 
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                  />
                </div>
              </div>
            </div>

            {/* Receipt Styling / Extra */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Receipt Customization</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="removeSignatureStamp" 
                    {...register('removeSignatureStamp')} 
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer" 
                  />
                  <label htmlFor="removeSignatureStamp" className="text-xs font-bold text-gray-700 cursor-pointer">Remove Signature & Stamp</label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isSystemGenerated" 
                    {...register('isSystemGenerated')} 
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer" 
                  />
                  <label htmlFor="isSystemGenerated" className="text-xs font-bold text-gray-700 cursor-pointer">Show "System Generated" Notice</label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Notes / Terms</label>
                <textarea 
                  {...register('notes')} 
                  rows="3"
                  className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" 
                />
              </div>
            </div>

            {/* Actions for PDF */}
            <div className="pt-4 border-t flex gap-3">
              <button 
                type="button" 
                onClick={handleDownloadPDF} 
                className="flex-1 bg-gray-900 text-white py-3 rounded-lg hover:bg-black font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                📥 Download PDF
              </button>
            </div>
            
          </form>
        </div>

        {/* RIGHT PANEL: LIVE PREVIEW */}
        <div 
          ref={containerRef}
          className={`w-full lg:w-7/12 flex justify-center bg-gray-300 p-0 sm:p-4 md:p-8 overflow-auto ${mobileTab === 'edit' ? 'hidden lg:flex' : 'flex'}`}
        >
          <div 
            id="print-scaler" 
            className="flex justify-center origin-top p-2 sm:p-4 md:p-0 transition-transform duration-200 ease-out"
            style={{ 
              transform: `scale(${previewScale})`, 
              transformOrigin: 'top center',
            }}
          >
            {/* A4 CANVAS */}
            <div 
              id="receipt-preview" 
              ref={receiptRef} 
              className="bg-white relative shrink-0" 
              style={{ width: '794px', height: '1123px', margin: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}
            >
              {/* TOP COLOR BAND */}
              <div className="h-4 w-full flex-shrink-0" style={{ backgroundColor: theme.hex }}></div>

              <div className="px-10 py-8 flex-grow" style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* BRAND HEADER */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    {sellerProfile?.logo_url ? (
                      <img 
                        src={sellerProfile.logo_url} 
                        alt="Logo" 
                        crossOrigin="anonymous" 
                        className="h-14 w-auto mb-2 object-contain bg-white rounded p-0.5" 
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center font-black text-white text-xl mb-2 uppercase" style={{ backgroundColor: theme.hex }}>
                        {(formData.productName || sellerProfile?.business_name || 'S').slice(0, 2)}
                      </div>
                    )}
                    <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: theme.hex }}>Payment Receipt</h2>
                    <p className="text-xs text-gray-500 font-bold"># {formData.receipt_no || 'REC-XXXXXX'}</p>
                  </div>
                  
                  <div className="text-right max-w-[50%]">
                    <h3 className="text-2xl font-black text-gray-800 leading-tight mb-1">{sellerProfile?.business_name || 'Business Name'}</h3>
                    {sellerProfile?.address && <p className="text-[10px] text-gray-500 leading-tight whitespace-pre-wrap mb-1">{sellerProfile.address}</p>}
                    <p className="text-xs text-gray-500 leading-normal font-medium">{sellerProfile?.state}</p>
                    {sellerProfile?.business_email && <p className="text-xs text-gray-500 leading-normal font-medium">{sellerProfile.business_email}</p>}
                    {sellerProfile?.website && <p className="text-xs text-blue-600 leading-normal font-bold hover:underline">{sellerProfile.website}</p>}
                  </div>
                </div>

                {/* LIGHT SEPARATOR */}
                <hr className="border-gray-100 mb-6" />

                {/* TRANSACTION INFO */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {/* Billed To */}
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</h4>
                    <p className="text-sm font-bold text-gray-800 leading-tight">{formData.buyer_name || 'Customer Name'}</p>
                    {formData.buyer_email && <p className="text-xs text-gray-600 font-semibold mt-0.5">{formData.buyer_email}</p>}
                    {formData.buyer_address && (
                      <p className="text-xs text-gray-500 whitespace-pre-wrap leading-tight mt-1 max-w-[90%]">{formData.buyer_address}</p>
                    )}
                  </div>

                  {/* Payment Details */}
                  <div className="text-right">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Details</h4>
                    <div className="inline-grid grid-cols-[auto_auto] gap-x-3 gap-y-1 justify-end items-baseline text-xs text-gray-600">
                      <span className="text-gray-400 font-medium">Payment Date:</span>
                      <span className="font-bold text-gray-800">{formatDate(formData.receiptDate)}</span>
                      
                      <span className="text-gray-400 font-medium">Payment Method:</span>
                      <span className="font-bold text-gray-800">{formData.paymentMethod}</span>
                      
                      {formData.transactionId && (
                        <>
                          <span className="text-gray-400 font-medium">Transaction ID:</span>
                          <span className="font-bold text-gray-800 font-mono text-[10px]">{formData.transactionId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* SUBSCRIPTION TABLE */}
                <div className="mb-4 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                        <th className="py-2.5 pb-2">Description / Subscription</th>
                        <th className="py-2.5 pb-2 text-center" style={{ width: '120px' }}>Billing Cycle</th>
                        <th className="py-2.5 pb-2 text-right" style={{ width: '120px' }}>Amount</th>
                        <th className="py-2.5 pb-2 text-right" style={{ width: '120px' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-4">
                          <p className="text-sm font-bold text-gray-800">{formData.productName || 'Product'} - {formData.planName || 'Plan'}</p>
                          <p className="text-xs text-gray-400 font-semibold mt-0.5">Subscription / Service Access</p>
                        </td>
                        <td className="py-4 text-center text-xs font-bold text-gray-700">
                          {formData.planDuration} {formData.planType === 'yearly' ? 'Year' : 'Month'}{parseInt(formData.planDuration) > 1 ? 's' : ''} ({formData.planType})
                        </td>
                        <td className="py-4 text-right text-xs font-bold text-gray-700 font-mono">
                          {currencySymbol}{price.toFixed(2)}
                        </td>
                        <td className="py-4 text-right text-sm font-bold text-gray-800 font-mono">
                          {currencySymbol}{price.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* TOTALS & STAMP */}
                <div className="flex justify-between items-start mb-4">
                  {/* Paid Badge / Stamp */}
                  <div className="pt-2">
                    <div className="inline-flex flex-col items-center border-4 border-emerald-500/80 rounded-xl px-4 py-2 rotate-[-4deg] bg-emerald-50/20">
                      <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600/80">Payment Status</span>
                      <span className="text-xl font-black uppercase text-emerald-600 tracking-wider">SUCCESSFUL</span>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="w-[45%] text-right space-y-1.5 border-t border-gray-100 pt-3">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>Subtotal</span>
                      <span className="font-bold text-gray-700 font-mono">{currencySymbol}{subtotal.toFixed(2)}</span>
                    </div>
                    
                    {taxRate > 0 && (
                      <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>Tax ({taxRate}%)</span>
                        <span className="font-bold text-gray-700 font-mono">{currencySymbol}{taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-baseline pt-2 border-t text-gray-800">
                      <span className="text-sm font-black uppercase">Total Paid</span>
                      <span className="text-xl font-black font-mono" style={{ color: theme.hex }}>
                        {currencySymbol}{grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* WORDS */}
                <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100/50 mb-4 text-right">
                  <p className="text-[10px] uppercase text-gray-400 font-black tracking-wide mb-0.5">Amount in Words</p>
                  <p className="text-xs font-bold text-gray-800">{amountInWords}</p>
                </div>

                {/* SIGNATURE & STAMP OR SYSTEM GENERATED LOGIC */}
                <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-100">
                  
                  {/* Notes / Terms */}
                  <div className="w-[55%]">
                    <h5 className="text-[9px] uppercase font-black tracking-wider text-gray-400 mb-1">Billing Notes</h5>
                    <p className="text-[10px] text-gray-500 whitespace-pre-wrap leading-relaxed pr-6">{formData.notes}</p>
                  </div>

                  {/* Signature / Stamp */}
                  <div className="w-[40%] flex flex-col items-end">
                    {!formData.removeSignatureStamp ? (
                      <>
                        <div className="flex items-end gap-3 mb-1">
                          {stampPreview && <img src={stampPreview} alt="Stamp" className="h-14 w-14 object-contain opacity-75 rotate-[-6deg]" />}
                          {signaturePreview && <img src={signaturePreview} alt="Signature" className="h-10 object-contain mb-1" />}
                        </div>
                        <div className="border-t border-gray-200 w-32"></div>
                        <p className="text-[9px] font-black uppercase mt-1 text-gray-500">Authorized Signatory</p>
                        <p className="text-[9px] text-gray-400 leading-tight">{sellerProfile?.business_name}</p>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* System generated notice at the very bottom of the document */}
                {formData.isSystemGenerated && (
                  <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-100 text-gray-400 italic text-[10px]">
                    This is a system-generated transaction receipt and does not require a physical signature or business stamp.
                  </div>
                )}

              </div>

              {/* BOTTOM ACCENT BAR */}
              <div className="h-5 w-full flex-shrink-0" style={{ backgroundColor: theme.hex }}></div>
            </div>
            
          </div>
        </div>

      </div>

      {/* POPUP NOTIFICATION MODAL */}
      {popup.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${popup.type === 'success' ? 'bg-emerald-100 text-emerald-600' : popup.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {popup.type === 'success' ? '✓' : popup.type === 'error' ? '✗' : 'ℹ'}
              </div>
              <h4 className="text-lg font-bold text-gray-900">{popup.title}</h4>
            </div>
            <p className="text-sm text-gray-600 leading-normal">{popup.message}</p>
            <div className="flex gap-2 justify-end pt-2">
              {popup.cancelLabel && (
                <button 
                  onClick={closePopup} 
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  {popup.cancelLabel}
                </button>
              )}
              <button 
                onClick={() => {
                  closePopup()
                  if (popup.onAction) popup.onAction()
                }} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all"
              >
                {popup.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="w-full">
        <BrandingFooter />
      </div>

    </div>
  )
}
