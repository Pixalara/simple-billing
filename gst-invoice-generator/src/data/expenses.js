/* =============================================================================
 * EXPENSES MODULE — configuration and pure helpers
 * =============================================================================
 *
 * STORAGE NOTE
 * Expenses live in the same `invoices` table as every other record, keyed by
 * `invoice_data.type === 'expense'`, matching how customers ('customer') and
 * products ('product') are already stored. That is not the schema you would
 * design from scratch, but it works under the RLS policies that already exist.
 * Moving to a dedicated `expenses` table is a clean follow-up: the shape below
 * maps 1:1 onto columns.
 *
 * IMPORTANT: `allInvoices` in Dashboard.jsx is a NEGATIVE filter (everything
 * that isn't a receipt/customer/product). Any new type MUST be added to
 * NON_BILLING_TYPES there, or expenses get counted as revenue.
 * ========================================================================== */

export const EXPENSE_TYPE = 'expense'

/* --- Categories ---------------------------------------------------------
 * `sac` is the common SAC/HSN code for that spend type and `gst` the usual
 * rate — both prefill the form and remain editable, since the bill is the
 * source of truth, not our defaults.
 */
export const EXPENSE_CATEGORIES = [
  { id: 'rent', label: 'Rent & Premises', icon: 'building', color: '#2563eb', sac: '997212', gst: 18 },
  { id: 'salaries', label: 'Salaries & Wages', icon: 'users', color: '#0891b2', sac: '', gst: 0 },
  { id: 'contractors', label: 'Contractors & Freelancers', icon: 'userPlus', color: '#0d9488', sac: '998519', gst: 18 },
  { id: 'software', label: 'Software & Subscriptions', icon: 'cloud', color: '#7c3aed', sac: '997331', gst: 18 },
  { id: 'marketing', label: 'Marketing & Advertising', icon: 'megaphone', color: '#db2777', sac: '998361', gst: 18 },
  { id: 'utilities', label: 'Utilities & Internet', icon: 'bolt', color: '#ea580c', sac: '998631', gst: 18 },
  { id: 'travel', label: 'Travel & Transport', icon: 'plane', color: '#0284c7', sac: '996411', gst: 5 },
  { id: 'professional', label: 'Professional Fees', icon: 'briefcase', color: '#4f46e5', sac: '998221', gst: 18 },
  { id: 'office', label: 'Office Supplies', icon: 'box', color: '#65a30d', sac: '', gst: 18 },
  { id: 'equipment', label: 'Equipment & Assets', icon: 'monitor', color: '#475569', sac: '', gst: 18 },
  { id: 'bank', label: 'Bank & Payment Fees', icon: 'bank', color: '#b45309', sac: '997119', gst: 18 },
  { id: 'taxes', label: 'Taxes & Statutory', icon: 'receipt', color: '#be123c', sac: '', gst: 0 },
  { id: 'other', label: 'Other', icon: 'dots', color: '#6b7280', sac: '', gst: 18 },
]

export const getCategory = (id) =>
  EXPENSE_CATEGORIES.find((c) => c.id === id) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]

export const PAYMENT_METHODS = [
  'Bank Transfer',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Cheque',
  'Auto-debit',
  'Wallet',
]

export const RECURRING_CYCLES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
]

export const EXPENSE_STATUSES = [
  { id: 'PAID', label: 'Paid' },
  { id: 'PENDING', label: 'Unpaid' },
]

export const GST_RATES = [0, 5, 12, 18, 28]

/* --- Money --------------------------------------------------------------
 * Bills are quoted both ways in practice, so the amount entered can be read
 * as exclusive or inclusive of GST and we derive the rest. Doing this in one
 * place keeps the form, the table and the totals from disagreeing.
 */
export const computeExpenseTotals = ({ amount, gstRate, amountMode = 'exclusive' }) => {
  const a = parseFloat(amount) || 0
  const r = parseFloat(gstRate) || 0

  let taxableValue
  let gstAmount
  let grandTotal

  if (amountMode === 'inclusive') {
    grandTotal = a
    taxableValue = r > 0 ? a / (1 + r / 100) : a
    gstAmount = grandTotal - taxableValue
  } else {
    taxableValue = a
    gstAmount = (a * r) / 100
    grandTotal = a + gstAmount
  }

  const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100
  return {
    taxableValue: round(taxableValue),
    gstAmount: round(gstAmount),
    grandTotal: round(grandTotal),
  }
}

export const formatINR = (n, { decimals = 2 } = {}) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`

/** Compact form for KPI tiles: ₹1.2L, ₹3.4Cr. */
export const formatCompactINR = (n) => {
  const v = Number(n) || 0
  const abs = Math.abs(v)
  if (abs >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`
  if (abs >= 1e5) return `₹${(v / 1e5).toFixed(2)}L`
  if (abs >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`
  return formatINR(v, { decimals: 0 })
}

/* --- Financial year (India: 1 April - 31 March) ------------------------ */
export const getFinancialYear = (date = new Date()) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const startYear = d.getMonth() >= 3 ? year : year - 1
  return {
    label: `FY ${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`,
    start: new Date(startYear, 3, 1),
    end: new Date(startYear + 1, 2, 31, 23, 59, 59),
  }
}

export const DATE_PRESETS = [
  { id: 'this-month', label: 'This month' },
  { id: 'last-month', label: 'Last month' },
  { id: 'this-quarter', label: 'This quarter' },
  { id: 'this-fy', label: 'This FY' },
  { id: 'all', label: 'All time' },
]

export const resolveDateRange = (presetId, now = new Date()) => {
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (presetId) {
    case 'this-month':
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0, 23, 59, 59) }
    case 'last-month':
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0, 23, 59, 59) }
    case 'this-quarter': {
      const qStart = Math.floor(m / 3) * 3
      return { from: new Date(y, qStart, 1), to: new Date(y, qStart + 3, 0, 23, 59, 59) }
    }
    case 'this-fy': {
      const fy = getFinancialYear(now)
      return { from: fy.start, to: fy.end }
    }
    default:
      return { from: null, to: null }
  }
}

/** The expense date is what matters for accounting, not the row's created_at. */
export const getExpenseDate = (doc) =>
  doc?.invoice_data?.date ? new Date(doc.invoice_data.date) : new Date(doc?.created_at || Date.now())

export const isWithinRange = (date, from, to) => {
  if (!from && !to) return true
  const t = new Date(date).getTime()
  if (from && t < new Date(from).getTime()) return false
  if (to && t > new Date(to).getTime()) return false
  return true
}

/** Next EXP- id from the records already loaded. */
export const nextExpenseId = (existing = []) => {
  const prefix = 'EXP-'
  let max = 1000
  existing.forEach((doc) => {
    const n = parseInt(String(doc.invoice_no || '').replace(prefix, ''), 10)
    if (!isNaN(n) && n > max) max = n
  })
  return `${prefix}${max + 1}`
}

export const emptyExpense = () => ({
  expense_id: '',
  date: new Date().toISOString().split('T')[0],
  category: 'software',
  vendor: '',
  vendorGstin: '',
  billNo: '',
  description: '',
  amountMode: 'exclusive',
  amount: '',
  gstRate: 18,
  sac: '',
  itcEligible: true,
  paymentMethod: 'Bank Transfer',
  paymentStatus: 'PAID',
  isRecurring: false,
  recurringCycle: 'monthly',
  notes: '',
})
