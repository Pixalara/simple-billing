/* =============================================================================
 * ANALYTICS — profit & loss aggregation
 * =============================================================================
 * Pure functions only. No React, no Supabase. Everything the Analytics page
 * displays is derived here so it can be reasoned about and verified directly.
 *
 * REVENUE BASIS — read this before trusting the profit number
 * -----------------------------------------------------------------------------
 * There is no link in the data model between an invoice and the receipt that
 * pays it. So if you raise an invoice AND issue a receipt for the same sale,
 * counting both double-counts that revenue. Hence an explicit basis:
 *
 *   invoiced   accrual — sum of GST invoices, whether or not they were paid
 *   collected  cash    — sum of payment receipts only
 *   all        both    — total billing activity; safe ONLY if you use one
 *                       document type per sale
 *
 * The UI states this rather than hiding it. Nothing here guesses.
 * ========================================================================== */

// Explicit .js extensions so this pure-logic layer can be run directly under
// node for verification, not just through Vite's resolver.
import { fxToInr } from './currency.js'
import { EXPENSE_TYPE, getCategory, getExpenseDate, isWithinRange } from './expenses.js'

export const REVENUE_BASES = [
  { id: 'all', label: 'All documents', hint: 'Invoices + receipts' },
  { id: 'invoiced', label: 'Invoiced', hint: 'Accrual: billed, paid or not' },
  { id: 'collected', label: 'Collected', hint: 'Cash: receipts only' },
]

const RECEIPT = 'receipt'
const LEDGER_TYPES = ['customer', 'product']

const isInvoice = (d) =>
  !LEDGER_TYPES.includes(d?.invoice_data?.type) &&
  d?.invoice_data?.type !== RECEIPT &&
  d?.invoice_data?.type !== EXPENSE_TYPE

const isReceipt = (d) => d?.invoice_data?.type === RECEIPT
const isExpense = (d) => d?.invoice_data?.type === EXPENSE_TYPE

/** Invoices and receipts store their date on different fields. */
export const getDocDate = (doc) => {
  const d = doc?.invoice_data || {}
  const raw = d.invoiceDate || d.issueDate || d.receiptDate || d.date
  return raw ? new Date(raw) : new Date(doc?.created_at || Date.now())
}

/** Receipt amounts can be in foreign currency; invoices are always INR. */
const receiptInr = (doc) =>
  (parseFloat(doc.total_amount) || 0) * fxToInr(doc.invoice_data?.currency || 'INR')

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const monthLabel = (date) =>
  date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

/**
 * @param documents  every row from the `invoices` table
 * @param from,to    period bounds; null means unbounded
 * @param basis      'all' | 'invoiced' | 'collected'
 */
export function buildAnalytics({ documents = [], from = null, to = null, basis = 'all' } = {}) {
  const inPeriod = (doc, dateFn) => isWithinRange(dateFn(doc), from, to)

  const invoices = documents.filter((d) => isInvoice(d) && inPeriod(d, getDocDate))
  const receipts = documents.filter((d) => isReceipt(d) && inPeriod(d, getDocDate))
  const expenses = documents.filter((d) => isExpense(d) && inPeriod(d, getExpenseDate))

  /* --- Revenue -------------------------------------------------------- */
  const invoiced = invoices.reduce((s, d) => s + (parseFloat(d.total_amount) || 0), 0)
  const collected = receipts.reduce((s, d) => s + receiptInr(d), 0)
  const revenue =
    basis === 'invoiced' ? invoiced : basis === 'collected' ? collected : invoiced + collected

  /** Unpaid invoices — money billed but not yet in the bank. */
  const outstanding = invoices
    .filter((d) => (d.status || 'PENDING') !== 'PAID')
    .reduce((s, d) => s + (parseFloat(d.total_amount) || 0), 0)

  /* --- Expenses ------------------------------------------------------- */
  const expenseTotal = expenses.reduce((s, d) => s + (parseFloat(d.total_amount) || 0), 0)
  const expenseUnpaid = expenses
    .filter((d) => (d.status || d.invoice_data?.paymentStatus) === 'PENDING')
    .reduce((s, d) => s + (parseFloat(d.total_amount) || 0), 0)

  /* --- Profit --------------------------------------------------------- */
  const net = revenue - expenseTotal
  const margin = revenue > 0 ? (net / revenue) * 100 : 0

  /* --- GST position ---------------------------------------------------
   * Output tax from invoices and receipts, input credit from eligible
   * expenses. The difference is indicative only, not a filing figure. */
  let outputTax = 0
  invoices.forEach((d) => {
    const t = d.invoice_data?.totals || {}
    outputTax +=
      (parseFloat(t.cgst) || 0) + (parseFloat(t.sgst) || 0) + (parseFloat(t.igst) || 0)
  })
  receipts.forEach((d) => {
    outputTax +=
      (parseFloat(d.invoice_data?.taxAmount) || 0) * fxToInr(d.invoice_data?.currency || 'INR')
  })
  const inputTax = expenses.reduce(
    (s, d) => s + (d.invoice_data?.itcEligible ? parseFloat(d.invoice_data?.gstAmount) || 0 : 0),
    0
  )

  /* --- Monthly series ------------------------------------------------- */
  const months = {}
  const touchMonth = (date) => {
    const key = monthKey(date)
    if (!months[key]) {
      months[key] = { key, label: monthLabel(date), revenue: 0, expenses: 0, profit: 0 }
    }
    return months[key]
  }
  if (basis !== 'collected') {
    invoices.forEach((d) => {
      touchMonth(getDocDate(d)).revenue += parseFloat(d.total_amount) || 0
    })
  }
  if (basis !== 'invoiced') {
    receipts.forEach((d) => {
      touchMonth(getDocDate(d)).revenue += receiptInr(d)
    })
  }
  expenses.forEach((d) => {
    touchMonth(getExpenseDate(d)).expenses += parseFloat(d.total_amount) || 0
  })

  const monthly = Object.values(months)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((m) => ({
      ...m,
      revenue: round2(m.revenue),
      expenses: round2(m.expenses),
      profit: round2(m.revenue - m.expenses),
    }))

  /* --- Expense mix by category ---------------------------------------- */
  const catMap = {}
  expenses.forEach((d) => {
    const c = getCategory(d.invoice_data?.category)
    if (!catMap[c.id]) catMap[c.id] = { name: c.label, value: 0, color: c.color, count: 0 }
    catMap[c.id].value += parseFloat(d.total_amount) || 0
    catMap[c.id].count += 1
  })
  const expenseByCategory = Object.values(catMap)
    .map((c) => ({ ...c, value: round2(c.value) }))
    .sort((a, b) => b.value - a.value)

  /* --- Revenue mix: product vs service -------------------------------- */
  let productRevenue = 0
  let serviceRevenue = 0
  const addMix = (doc, amount) => {
    if (doc.invoice_data?.billingKind === 'service') serviceRevenue += amount
    else productRevenue += amount
  }
  if (basis !== 'collected') invoices.forEach((d) => addMix(d, parseFloat(d.total_amount) || 0))
  if (basis !== 'invoiced') receipts.forEach((d) => addMix(d, receiptInr(d)))

  const revenueMix = [
    { name: 'Products', value: round2(productRevenue), color: '#2563eb' },
    { name: 'Services', value: round2(serviceRevenue), color: '#7c3aed' },
  ].filter((x) => x.value > 0)

  /* --- Leaderboards ---------------------------------------------------- */
  const clientMap = {}
  const addClient = (doc, amount) => {
    const name = doc.invoice_data?.buyer_name || 'Unnamed customer'
    clientMap[name] = (clientMap[name] || 0) + amount
  }
  if (basis !== 'collected') invoices.forEach((d) => addClient(d, parseFloat(d.total_amount) || 0))
  if (basis !== 'invoiced') receipts.forEach((d) => addClient(d, receiptInr(d)))

  const topClients = Object.entries(clientMap)
    .map(([name, value]) => ({ name, value: round2(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const vendorMap = {}
  expenses.forEach((d) => {
    const name = d.invoice_data?.vendor || 'Unnamed vendor'
    vendorMap[name] = (vendorMap[name] || 0) + (parseFloat(d.total_amount) || 0)
  })
  const topVendors = Object.entries(vendorMap)
    .map(([name, value]) => ({ name, value: round2(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  /* --- Profit / loss split for the pie -------------------------------- */
  const breakdown = [
    { name: 'Expenses', value: round2(Math.min(expenseTotal, revenue)), color: '#f43f5e' },
    { name: net >= 0 ? 'Net profit' : 'Net loss', value: round2(Math.abs(net)), color: net >= 0 ? '#14b274' : '#f59e0b' },
  ].filter((x) => x.value > 0)

  return {
    counts: { invoices: invoices.length, receipts: receipts.length, expenses: expenses.length },
    revenue: {
      invoiced: round2(invoiced),
      collected: round2(collected),
      total: round2(revenue),
      outstanding: round2(outstanding),
    },
    expenses: {
      total: round2(expenseTotal),
      unpaid: round2(expenseUnpaid),
      byCategory: expenseByCategory,
      topVendors,
    },
    profit: {
      net: round2(net),
      margin: round2(margin),
      isProfit: net >= 0,
      breakdown,
    },
    gst: {
      output: round2(outputTax),
      input: round2(inputTax),
      net: round2(outputTax - inputTax),
    },
    monthly,
    revenueMix,
    topClients,
    /** Best and worst month by profit — surfaced as a plain-language insight. */
    bestMonth: monthly.length ? monthly.reduce((a, b) => (b.profit > a.profit ? b : a)) : null,
    worstMonth: monthly.length ? monthly.reduce((a, b) => (b.profit < a.profit ? b : a)) : null,
  }
}
