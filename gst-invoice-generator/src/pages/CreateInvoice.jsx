import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'
import { INDIAN_STATES, HSN_CODES } from '../constants'
import SearchableSelect from '../components/SearchableSelect'
import html2pdf from 'html2pdf.js'

// Import Footer Component
import BrandingFooter from '../components/BrandingFooter'

// --- PREMIUM POPUP COMPONENT ---
const Popup = ({ isOpen, onClose, title, message, type, actionLabel, onAction, cancelLabel }) => {
    if (!isOpen) return null;
    const colors = {
        success: { iconBg: 'bg-green-100', iconColor: 'text-green-600', btn: 'bg-green-600 hover:bg-green-700' },
        error: { iconBg: 'bg-red-100', iconColor: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
        info: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' }
    }
    const style = colors[type] || colors.info;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-5 ${style.iconBg}`}>
                        <svg className={`h-8 w-8 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">{title}</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">{message}</p>
                    <div className="flex gap-3">
                        {cancelLabel && <button onClick={onClose} className="flex-1 py-3.5 px-4 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm">{cancelLabel}</button>}
                        <button onClick={() => { if (onAction) onAction(); else onClose(); }} className={`flex-1 py-3.5 px-4 rounded-xl text-white font-bold shadow-lg shadow-gray-200 transition-transform active:scale-95 ${style.btn}`}>{actionLabel || 'Continue'}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const THEMES = [
  { name: 'Blue', hex: '#2563eb', text: 'white' },
  { name: 'Green', hex: '#16a34a', text: 'white' },
  { name: 'Red', hex: '#dc2626', text: 'white' },
  { name: 'Black', hex: '#1f2937', text: 'white' },
  { name: 'Orange', hex: '#ea580c', text: 'white' },
]

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
    if (Number(paise) > 0) { str += 'and ' + convert(Number(paise)) + 'Paise '; }
    return str + 'Only';
}

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
  const [stampPreview, setStampPreview] = useState(null) 
  const [manualInvoiceEnabled, setManualInvoiceEnabled] = useState(false) 
  const [existingInvoiceNo, setExistingInvoiceNo] = useState(null)

  const [popup, setPopup] = useState({ isOpen: false, title: '', message: '', type: 'success', actionLabel: 'OK', onAction: null, cancelLabel: null })
  
  const showPopup = (title, message, type = 'success', actionLabel = 'OK', onAction = null, cancelLabel = null) => { 
      setPopup({ isOpen: true, title, message, type, actionLabel, onAction, cancelLabel }) 
  }
  
  const closePopup = () => { 
      setPopup({ ...popup, isOpen: false }) 
  }

  const { register, control, handleSubmit, setValue, reset, watch } = useForm({
    defaultValues: {
      invoice_no: '',
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
          if (profile.signature_url) setSignaturePreview(profile.signature_url)
          if (profile.stamp_url) setStampPreview(profile.stamp_url)
          setManualInvoiceEnabled(profile.enable_manual_invoice_no) 
      }

      if (id) {
        const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single()
        if (invoice) {
          reset(invoice.invoice_data)
          setValue('invoice_no', invoice.invoice_no)
          setExistingInvoiceNo(invoice.invoice_no)
          if (invoice.invoice_data.theme) {
            const foundTheme = THEMES.find(t => t.hex === invoice.invoice_data.theme)
            if (foundTheme) setTheme(foundTheme)
          }
        }
      } else {
        if (!profile?.enable_manual_invoice_no) {
            try {
                const date = new Date();
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                const prefix = `${day}${month}${year}`; 
                const { data: lastInvoice } = await supabase.from('invoices').select('invoice_no').eq('user_id', user.id).ilike('invoice_no', `${prefix}%`).order('invoice_no', { ascending: false }).limit(1).single();
                let sequence = '01';
                if (lastInvoice && lastInvoice.invoice_no) {
                    const lastSeqStr = lastInvoice.invoice_no.replace(prefix, '');
                    const lastSeqNum = parseInt(lastSeqStr, 10);
                    if (!isNaN(lastSeqNum)) sequence = String(lastSeqNum + 1).padStart(2, '0');
                }
                setValue('invoice_no', `${prefix}${sequence}`)
            } catch (e) {
                console.error("Error generating invoice number:", e);
                setValue('invoice_no', `DRAFT-${Date.now().toString().slice(-4)}`)
            }
        }
      }
    }
    loadData()
  }, [id, navigate, reset, setValue])

  useEffect(() => {
    const handleResize = () => { if (containerRef.current) { const s = (containerRef.current.offsetWidth - 32) / 794; setPreviewScale(s > 1 ? 1 : s) } }; handleResize(); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize);
  }, [mobileTab])
  
  const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setSignaturePreview(reader.result); reader.readAsDataURL(file) } }
  const handleItemSelect = (index, item) => { setValue(`items.${index}.description`, item.description); if (item.code) setValue(`items.${index}.hsn`, item.code); if (item.rate) setValue(`items.${index}.gstRate`, item.rate) }
  const calculateTotals = () => { let s=0,t=0; (formData.items||[]).forEach(i=>{const q=parseFloat(i.quantity)||0,p=parseFloat(i.price)||0,r=parseFloat(i.gstRate)||0,l=q*p; s+=l; t+=(l*r)/100}); const isInter=sellerProfile?.state&&formData.buyer_state&&(sellerProfile.state!==formData.buyer_state); return { subtotal: s.toFixed(2), cgst: isInter?0:(t/2).toFixed(2), sgst: isInter?0:(t/2).toFixed(2), igst: isInter?t.toFixed(2):0, grandTotal: (s+t).toFixed(2) } }
  const totals = calculateTotals(); const amountInWords = totals.grandTotal ? numberToWords(totals.grandTotal) : '';
  const getTaxRateText = (type) => { const rates = new Set(formData.items?.map(i => parseFloat(i.gstRate)).filter(r => r > 0)); if (rates.size === 1) { const r = [...rates][0]; if (type === 'IGST') return `(${r}%)`; if (type === 'CGST' || type === 'SGST') return `(${r/2}%)`; } return ''; }

  const generatePdfBlob = async (copyType = '') => {
      const originalElement = invoiceRef.current
      if (!originalElement) {
          console.error('Invoice ref is null');
          return null;
      }

      const clone = originalElement.cloneNode(true)
      
      if (copyType) {
          const titleElement = clone.querySelector('h1'); 
          if (titleElement) {
              const copyLabel = document.createElement('p');
              
              if (copyType === 'ORIGINAL') copyLabel.innerText = 'ORIGINAL FOR RECIPIENT';
              else if (copyType === 'DUPLICATE') copyLabel.innerText = 'DUPLICATE FOR TRANSPORTER';
              else if (copyType === 'TRIPLICATE') copyLabel.innerText = 'TRIPLICATE FOR SUPPLIER';
              else copyLabel.innerText = copyType;

              copyLabel.style.fontSize = '12px';  
              copyLabel.style.fontWeight = 'bold'; 
              copyLabel.style.color = '#ffffff';   
              copyLabel.style.marginTop = '4px';
              copyLabel.style.letterSpacing = '1px';
              copyLabel.style.opacity = '1';       
              
              titleElement.parentNode.appendChild(copyLabel);
          }
      }

      // Set A4 page dimensions (210mm x 297mm = 794px x 1123px at 96dpi)
      clone.style.width = '794px'
      clone.style.height = 'auto'
      clone.style.minHeight = 'unset'
      clone.style.maxHeight = 'unset'
      clone.style.overflow = 'visible'
      clone.style.transform = 'none'
      clone.style.margin = '0'
      clone.style.padding = '0'
      clone.style.backgroundColor = 'white'
      clone.style.display = 'block'
      clone.style.position = 'relative'
      clone.style.boxShadow = 'none'
      clone.style.border = 'none'
      clone.classList.remove('w-full', 'lg:w-7/12', 'flex', 'justify-center', 'shadow-2xl', 'p-8', 'hidden', 'lg:flex', 'rounded-2xl')
      
      // Remove the bottom color bar from clone to prevent extra page
      const colorBar = clone.querySelector('[style*="bottom: 0"]')
      if (colorBar) colorBar.remove()
      
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '794px' 
      container.style.height = 'auto'
      container.style.backgroundColor = 'white'
      container.style.zIndex = '-9999'
      container.style.margin = '0'
      container.style.padding = '0'
      
      container.appendChild(clone)
      document.body.appendChild(container)

      // Wait for images to load
      const images = Array.from(container.querySelectorAll('img'));
      await Promise.all(images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => { 
              img.onload = resolve; 
              img.onerror = resolve;
              setTimeout(resolve, 2000);
          });
      }));

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      const buyerName = (formData.buyer_name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const invoiceNum = (formData.invoice_no || 'DRAFT').replace(/[^a-zA-Z0-9]/g, '_');
      const typeTag = copyType ? `_${copyType}` : '';
      const safeFileName = `${buyerName}_${invoiceNum}${typeTag}.pdf`

      const opt = {
        margin: 0,
        filename: safeFileName,
        image: { type: 'jpeg', quality: 0.98 },
        enableLinks: false, 
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
            backgroundColor: '#ffffff'
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true,
            precision: 10
        }
      }
      
      try {
        console.log('Starting PDF generation...');
        const pdfBlob = await html2pdf().set(opt).from(clone).output('blob')
        console.log('PDF generated successfully, size:', pdfBlob.size);
        document.body.removeChild(container)
        return { blob: pdfBlob, filename: opt.filename }
      } catch (err) {
        console.error('PDF generation error:', err);
        if(document.body.contains(container)) document.body.removeChild(container)
        throw err
      }
  }

  const handleDownloadPDF = async () => {
    try {
        const res1 = await generatePdfBlob('ORIGINAL')
        downloadBlob(res1.blob, res1.filename)

        if (sellerProfile?.print_duplicates) {
            setTimeout(async () => {
                const res2 = await generatePdfBlob('DUPLICATE')
                downloadBlob(res2.blob, res2.filename)
            }, 1000)
        }

        if (sellerProfile?.print_triplicates) {
            setTimeout(async () => {
                const res3 = await generatePdfBlob('TRIPLICATE')
                downloadBlob(res3.blob, res3.filename)
            }, 2000)
        }

    } catch (e) {
        showPopup('Error', 'Failed to generate PDF.', 'error');
    }
  }

  const handleSendEmail = async () => {
    try {
        const res1 = await generatePdfBlob('ORIGINAL')
        downloadBlob(res1.blob, res1.filename)

        if (sellerProfile?.print_duplicates) {
             setTimeout(async () => {
                const res2 = await generatePdfBlob('DUPLICATE')
                downloadBlob(res2.blob, res2.filename)
             }, 1000)
        }

        if (sellerProfile?.print_triplicates) {
             setTimeout(async () => {
                const res3 = await generatePdfBlob('TRIPLICATE')
                downloadBlob(res3.blob, res3.filename)
             }, 2000)
        }

    } catch (e) {
        showPopup('Error', 'Failed to generate PDF for email.', 'error');
        return
    }

    setTimeout(() => {
        const subject = `Invoice ${formData.invoice_no || ''} from ${sellerProfile?.business_name || 'Us'}`
        const body = `Dear ${formData.buyer_name || 'Customer'},\n\nPlease find the invoice attached.\n\nBest Regards,\n${sellerProfile?.business_name || ''}`
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        showPopup('Email Draft Opened', 'The invoice copies have been downloaded.\n\nPlease attach them manually to the email.', 'info', 'Got it');
    }, 2500)
  }

  const downloadBlob = (blob, filename) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
  }

  const handleShare = async () => { 
    setSharing(true); 
    try { 
        const result = await generatePdfBlob(); 
        if(!result) return; 
        const file = new File([result.blob], result.filename, { type: 'application/pdf' }); 
        if (navigator.canShare && navigator.canShare({ files: [file] })) { 
            await navigator.share({ files: [file], title: 'Invoice', text: `Invoice from ${sellerProfile?.business_name}` }) 
        } else { 
            downloadBlob(result.blob, result.filename); 
            showPopup('Downloaded', 'Browser doesn\'t support sharing.', 'info'); 
        } 
    } catch(e){ 
        showPopup('Error','Failed to share','error') 
    } finally { 
        setSharing(false) 
    } 
  }
  
  const onSubmit = async (data) => { 
      setLoading(true); 
      try { 
          const { data: { user } } = await supabase.auth.getUser(); 
          const payload = { 
              user_id: user.id, 
              invoice_no: data.invoice_no, 
              invoice_data: { ...data, totals, theme: theme.hex }, 
              total_amount: totals.grandTotal 
          }; 
          
          if (id) await supabase.from('invoices').update(payload).eq('id', id); 
          else await supabase.from('invoices').insert(payload); 
          
          showPopup(
              'Success!', 
              'Invoice has been saved successfully.', 
              'success', 
              'Go to Dashboard', 
              () => navigate('/dashboard'), 
              'Stay Here'
          ); 
      } catch (error) { 
          showPopup('Error', error.message, 'error'); 
      } finally { 
          setLoading(false) 
      } 
  }

  return (
    <div className="min-h-screen bg-gray-100 p-0 md:p-4 lg:p-8 flex flex-col">
      
      {/* --- RENDER POPUP --- */}
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

      <style>{`
        @media print {
          .no-print, .no-print * {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          #print-scaler {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            transform: none !important; 
            margin: 0 !important;
            padding: 0 !important;
            left: 0 !important;
            top: 0 !important;
            overflow: visible !important;
          }
          #invoice-preview {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      
      {/* --- MOBILE TABS --- */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b flex text-sm font-bold shadow-sm">
        <button onClick={() => setMobileTab('edit')} className={`flex-1 py-3 text-center ${mobileTab === 'edit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>✎ Editor</button>
        <button onClick={() => setMobileTab('preview')} className={`flex-1 py-3 text-center ${mobileTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>👁 Preview</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* --- LEFT SIDE: EDITOR --- */}
        <div className={`w-full lg:w-5/12 bg-white p-4 md:p-6 rounded-lg shadow-lg h-fit overflow-y-auto max-h-screen custom-scrollbar ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            
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
                <label className="text-xs text-gray-500">Invoice No</label>
                <input 
                    {...register('invoice_no')} 
                    className={`w-full p-2 border rounded text-sm ${!manualInvoiceEnabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                    readOnly={!manualInvoiceEnabled}
                    onChange={(e) => setValue('invoice_no', e.target.value.toUpperCase())}
                />
                </div>
                <div>
                <label className="text-xs text-gray-500">Date</label>
                <input type="date" {...register('invoiceDate')} className="w-full p-2 border rounded text-sm" />
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-500">Due Date</label>
                <input type="date" {...register('dueDate')} className="w-full p-2 border rounded text-sm" />
            </div>

            <div className="bg-gray-50 p-3 rounded border">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Bill To</h3>
                
                <input 
                    {...register('buyer_name')} 
                    placeholder="Client Name" 
                    className="w-full p-2 border rounded mb-2 text-sm" 
                    onChange={(e) => setValue('buyer_name', e.target.value.toUpperCase())}
                />
                
                <select {...register('buyer_state')} className="w-full p-2 border rounded mb-2 text-sm">
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                
                <input 
                    {...register('buyer_gstin')} 
                    placeholder="GSTIN (Optional)" 
                    className="w-full p-2 border rounded text-sm" 
                    onChange={(e) => setValue('buyer_gstin', e.target.value.toUpperCase())}
                />
                
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
                    <div className="grid grid-cols-12 gap-2 mt-2">
                        <div className="col-span-3">
                            <label className="text-xs text-gray-500">HSN Code</label>
                            <input {...register(`items.${index}.hsn`)} placeholder="HSN" className="w-full p-2 border rounded text-sm" />
                        </div>
                        <div className="col-span-4">
                            <label className="text-xs text-gray-500">Price</label>
                            <input {...register(`items.${index}.price`)} type="number" className="w-full p-2 border rounded text-sm" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-500">Qty</label>
                            <input {...register(`items.${index}.quantity`)} type="number" className="w-full p-2 border rounded text-sm" />
                        </div>
                        <div className="col-span-3">
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
                    <button type="button" onClick={handleSendEmail} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded hover:bg-gray-300 font-bold">Send Email</button>
                    <button type="button" onClick={handleDownloadPDF} className="flex-1 bg-gray-900 text-white py-3 rounded hover:bg-black font-bold">PDF</button>
                    <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold">
                        {loading ? '...' : (id ? 'Update' : 'Save')}
                    </button>
                </div>
            </div>
            </form>
        </div>

        {/* --- RIGHT SIDE: PREVIEW --- */}
        <div 
            ref={containerRef}
            className={`w-full lg:w-7/12 flex justify-center bg-gray-300 p-0 md:p-8 overflow-auto ${mobileTab === 'edit' ? 'hidden lg:flex' : 'flex'}`}
        >
            <div 
                id="print-scaler" 
                className="flex justify-center origin-top p-4 md:p-0 transition-transform duration-200 ease-out"
                style={{ 
                    transform: `scale(${previewScale})`, 
                    transformOrigin: 'top center',
                }}
            >
                <div 
                    id="invoice-preview" 
                    ref={invoiceRef} 
                    className="bg-white relative shrink-0" 
                    style={{ width: '794px', height: '1123px', margin: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                
                <div className="px-6 py-3 flex justify-between flex-shrink-0" style={{ backgroundColor: theme.hex, color: theme.text }}>
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
                        <p className="opacity-80 text-xs"># {formData.invoice_no || 'DRAFT'}</p>
                    </div>
                    <div className="text-right" style={{ width: '50%' }}>
                        <h2 className="text-3xl font-bold leading-tight mb-1">{sellerProfile?.business_name || 'Your Business Name'}</h2>
                        <p className="opacity-90 text-sm leading-tight">{sellerProfile?.state}</p>
                        {sellerProfile?.business_email && <p className="opacity-90 text-sm leading-tight">{sellerProfile.business_email}</p>}
                        {sellerProfile?.business_phone && <p className="opacity-90 text-sm leading-tight">{sellerProfile.business_phone}</p>}
                        {sellerProfile?.website && <p className="opacity-90 text-sm leading-tight">{sellerProfile.website}</p>}
                        {sellerProfile?.gstin && <p className="font-semibold mt-1 text-base">GSTIN: {sellerProfile.gstin}</p>}
                    </div>
                </div>

                <div className="px-6 py-3 flex-grow" style={{ display: 'flex', flexDirection: 'column', paddingBottom: '24px' }}>
                    <div className="flex justify-between mb-4">
                        <div style={{ width: '60%' }}>
                            <h3 className="text-gray-500 text-[10px] uppercase font-bold mb-1">Bill To</h3>
                            <p className="text-base font-bold text-gray-800 leading-tight">{formData.buyer_name || 'Client Name'}</p>
                            <p className="text-gray-600 text-xs whitespace-pre-wrap leading-tight">{formData.buyer_address}</p>
                            <p className="text-gray-600 text-xs">{formData.buyer_state}</p>
                            {formData.buyer_gstin && <p className="text-xs font-semibold mt-1">GSTIN: {formData.buyer_gstin}</p>}
                        </div>
                        <div className="text-right" style={{ width: '35%' }}>
                            <div className="grid grid-cols-[auto_auto] gap-x-3 justify-end items-baseline">
                                <span className="text-gray-500 text-xs text-right">Date:</span>
                                <span className="font-semibold text-sm text-right">{formatDate(formData.invoiceDate)}</span>
                                
                                {formData.dueDate && (
                                    <>
                                        <span className="text-gray-500 text-xs text-right">Due Date:</span>
                                        <span className="font-semibold text-sm text-right">{formatDate(formData.dueDate)}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '100%', display: 'block', marginBottom: '8px', flex: '0 1 auto' }}>
                        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: theme.hex, color: theme.text }}>
                                    <th style={{ 
                                        width: '38%', 
                                        height: '35px', 
                                        overflow: 'hidden',
                                        verticalAlign: 'middle', 
                                        backgroundColor: theme.hex, 
                                        color: theme.text 
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingLeft: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>ITEM</div>
                                    </th>
                                    <th style={{ width: '13%', height: '35px', overflow: 'hidden', verticalAlign: 'middle', backgroundColor: theme.hex, color: theme.text }}>
                                        <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingLeft: '8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>HSN</div>
                                    </th>
                                    <th style={{ width: '10%', height: '35px', overflow: 'hidden', verticalAlign: 'middle', backgroundColor: theme.hex, color: theme.text }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>QTY</div>
                                    </th>
                                    <th style={{ width: '15%', height: '35px', overflow: 'hidden', verticalAlign: 'middle', backgroundColor: theme.hex, color: theme.text }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%', paddingRight: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>PRICE</div>
                                    </th>
                                    <th style={{ width: '24%', height: '35px', overflow: 'hidden', verticalAlign: 'middle', backgroundColor: theme.hex, color: theme.text }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%', paddingRight: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>TOTAL</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items?.map((item, i) => {
                                    const amount = ((item.quantity||0) * (item.price||0));
                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ width: '38%', padding: '8px 0 8px 12px', verticalAlign: 'top' }}>
                                                <p style={{ fontWeight: 600, fontSize: '13px', margin: 0, color: '#1f2937' }}>{item.description}</p>
                                            </td>
                                            <td style={{ width: '13%', padding: '8px 0 8px 12px', verticalAlign: 'top', fontSize: '12px', color: '#4b5563' }}>{item.hsn}</td>
                                            <td style={{ width: '10%', padding: '8px 0', textAlign: 'center', verticalAlign: 'top', fontSize: '13px', color: '#1f2937' }}>{item.quantity}</td>
                                            <td style={{ width: '15%', padding: '8px 12px 8px 0', textAlign: 'right', verticalAlign: 'top', fontSize: '13px', color: '#1f2937' }}>₹{item.price}</td>
                                            <td style={{ width: '24%', padding: '8px 12px 8px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold', fontSize: '13px', color: '#1f2937' }}>₹{(amount).toFixed(2)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="flex justify-end mb-4">
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

                    <div className="mt-1 text-right mb-2">
                        <p className="text-xs text-gray-500 font-semibold italic">Amount in Words:</p>
                        <p className="text-xs font-bold text-gray-800">{amountInWords}</p>
                    </div>
                    
                    {/* Footer / Bank Info & Signature */}
                    <div className="flex justify-between items-end mt-2 pt-3 border-t border-gray-100 flex-shrink-0">
                        
                        {/* Clean Bank Details - Content Only */}
                        <div className="w-[55%]">
                            {sellerProfile?.bank_name && (
                                <div className="pt-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1 w-fit pr-8">Bank Details</p>
                                    <div className="grid grid-cols-[80px_1fr] gap-y-1 text-xs w-fit min-w-[200px]">
                                        <span className="text-gray-500 font-medium">Bank:</span><span className="font-bold text-gray-800">{sellerProfile.bank_name}</span>
                                        
                                        <span className="text-gray-500 font-medium">A/c No:</span>
                                        <span className="font-bold text-gray-800">{sellerProfile.account_number}</span>
                                        
                                        <span className="text-gray-500 font-medium">IFSC:</span>
                                        <span className="font-bold text-gray-800">{sellerProfile.ifsc_code}</span>
                                        
                                        {sellerProfile.branch_name && (
                                            <>
                                                <span className="text-gray-500 font-medium">Branch:</span>
                                                <span className="font-bold text-gray-800">{sellerProfile.branch_name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-[40%] text-right flex flex-col items-end">
                            <div className="flex items-end gap-4 mb-2">
                                {stampPreview && <img src={stampPreview} alt="Stamp" crossOrigin="anonymous" className="h-16 w-16 object-contain opacity-80 rotate-[-5deg]" />}
                                {signaturePreview && <img src={signaturePreview} alt="Sign" crossOrigin="anonymous" className="h-12 mb-2 object-contain" />}
                            </div>
                            <div className="border-t border-gray-300 w-32"></div> 
                            <p className="text-[10px] font-bold uppercase mt-1 text-gray-600">Authorized Signatory</p>
                            <p className="text-[10px] text-gray-400">{sellerProfile?.business_name}</p>
                        </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t text-xs text-gray-600 flex-shrink-0">
                        <h4 className="font-bold text-gray-800 mb-1">Terms & Conditions</h4>
                        <p className="whitespace-pre-wrap text-[10px]">{formData.terms}</p>
                    </div>
                </div>
                
                <div style={{ backgroundColor: theme.hex, position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px' }}></div>
            </div>
        </div>
      </div>
      </div>
      
      {/* BRANDING FOOTER PLACED AT THE VERY BOTTOM OF THE PAGE LAYOUT (FULL WIDTH) */}
      <div className="w-full mt-auto">
          <BrandingFooter />
      </div>

    </div>
  )
}