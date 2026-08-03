import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { supabase } from '../supabaseClient'
import Icon from '../components/expenses/icons'
import ExpenseFormModal from '../components/expenses/ExpenseFormModal'
import BrandingFooter from '../components/BrandingFooter'
import {
  DATE_PRESETS,
  EXPENSE_CATEGORIES,
  EXPENSE_TYPE,
  PAYMENT_METHODS,
  formatCompactINR,
  formatINR,
  getCategory,
  getExpenseDate,
  getFinancialYear,
  isWithinRange,
  resolveDateRange,
} from '../data/expenses'

const CARD =
  'rounded-2xl bg-white ring-1 ring-ink-900/[0.06] shadow-sm-soft'

/* --- Small building blocks ---------------------------------------------- */

function KpiCard({ label, value, sub, icon, tone = 'ink', trend }) {
  const tones = {
    ink: 'bg-ink-900 text-white',
    brand: 'bg-brand-50 text-brand-600 ring-1 ring-brand-100',
    mint: 'bg-mint-50 text-mint-600 ring-1 ring-mint-100',
    amber: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
  }
  return (
    <div className={`${CARD} flex items-start justify-between gap-3 p-4 transition-shadow hover:shadow-lift`}>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">{label}</p>
        <p className="tnum mt-1.5 truncate text-2xl font-extrabold tracking-tight text-ink-900">
          {value}
        </p>
        {sub && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-ink-500">
            {trend === 'up' && <Icon name="trendUp" className="h-3.5 w-3.5 text-rose-500" strokeWidth={2.2} />}
            {trend === 'down' && <Icon name="trendDown" className="h-3.5 w-3.5 text-mint-600" strokeWidth={2.2} />}
            {sub}
          </p>
        )}
      </div>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
    </div>
  )
}

function StatusPill({ status }) {
  const paid = status !== 'PENDING'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${
        paid
          ? 'bg-mint-50 text-mint-700 ring-mint-200'
          : 'bg-amber-50 text-amber-700 ring-amber-200'
      }`}
    >
      <Icon name={paid ? 'check' : 'clock'} className="h-3 w-3" strokeWidth={2.6} />
      {paid ? 'Paid' : 'Unpaid'}
    </span>
  )
}

function CategoryTag({ id }) {
  const c = getCategory(id)
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white"
        style={{ backgroundColor: c.color }}
      >
        <Icon name={c.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      <span className="truncate text-xs font-semibold text-ink-700">{c.label}</span>
    </span>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-ink-900 px-3 py-2 shadow-float">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
        {payload[0]?.payload?.name || label}
      </p>
      <p className="tnum text-sm font-bold text-white">{formatINR(payload[0].value)}</p>
    </div>
  )
}

/* --- Page --------------------------------------------------------------- */

export default function Expenses() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [modal, setModal] = useState({ open: false, node: null })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [toast, setToast] = useState(null)

  // Filters
  const [preset, setPreset] = useState('this-fy')
  const [category, setCategory] = useState('all')
  const [method, setMethod] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const notify = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3200)
  }

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigate('/login')

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      notify('Could not load expenses. Please retry.', 'error')
      setLoading(false)
      return
    }
    setRows((data || []).filter((d) => d.invoice_data?.type === EXPENSE_TYPE))
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const range = useMemo(() => resolveDateRange(preset), [preset])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows
      .filter((r) => {
        const d = r.invoice_data || {}
        if (!isWithinRange(getExpenseDate(r), range.from, range.to)) return false
        if (category !== 'all' && d.category !== category) return false
        if (method !== 'all' && d.paymentMethod !== method) return false
        if (status !== 'all' && (r.status || d.paymentStatus || 'PAID') !== status) return false
        if (!q) return true
        return [r.invoice_no, d.vendor, d.description, d.billNo, d.notes, getCategory(d.category).label]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      })
      .sort((a, b) => getExpenseDate(b) - getExpenseDate(a))
  }, [rows, range, category, method, status, search])

  /* --- Aggregates ------------------------------------------------------- */
  const stats = useMemo(() => {
    let total = 0
    let itc = 0
    let unpaid = 0
    let unpaidCount = 0
    const byCategory = {}
    const byMonth = {}

    filtered.forEach((r) => {
      const d = r.invoice_data || {}
      const amount = parseFloat(r.total_amount || 0)
      total += amount

      if (d.itcEligible) itc += parseFloat(d.gstAmount || 0)
      if ((r.status || d.paymentStatus) === 'PENDING') {
        unpaid += amount
        unpaidCount += 1
      }

      const cat = getCategory(d.category)
      if (!byCategory[cat.id]) byCategory[cat.id] = { name: cat.label, value: 0, color: cat.color, count: 0 }
      byCategory[cat.id].value += amount
      byCategory[cat.id].count += 1

      const dt = getExpenseDate(r)
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      if (!byMonth[key]) {
        byMonth[key] = {
          key,
          name: dt.toLocaleDateString('en-IN', { month: 'short' }),
          value: 0,
        }
      }
      byMonth[key].value += amount
    })

    const categories = Object.values(byCategory)
      .map((c) => ({ ...c, value: Math.round(c.value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)

    const months = Object.values(byMonth)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12)
      .map((m) => ({ ...m, value: Math.round(m.value * 100) / 100 }))

    const monthlyAvg = months.length ? total / months.length : 0

    return {
      total,
      itc,
      unpaid,
      unpaidCount,
      count: filtered.length,
      categories,
      months,
      monthlyAvg,
      topCategory: categories[0] || null,
    }
  }, [filtered])

  /* --- Actions ---------------------------------------------------------- */
  const handleDelete = async (row) => {
    const snapshot = rows
    setRows((prev) => prev.filter((r) => r.id !== row.id))
    setConfirmDelete(null)
    const { error } = await supabase.from('invoices').delete().eq('id', row.id)
    if (error) {
      setRows(snapshot)
      notify('Could not delete that expense.', 'error')
    } else {
      notify(`${row.invoice_no} deleted.`)
    }
  }

  const toggleStatus = async (row) => {
    const current = row.status || row.invoice_data?.paymentStatus || 'PAID'
    const next = current === 'PAID' ? 'PENDING' : 'PAID'
    const snapshot = rows
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, status: next, invoice_data: { ...r.invoice_data, paymentStatus: next } }
          : r
      )
    )
    const { error } = await supabase
      .from('invoices')
      .update({ status: next, invoice_data: { ...row.invoice_data, paymentStatus: next } })
      .eq('id', row.id)
    if (error) {
      setRows(snapshot)
      notify('Could not update status.', 'error')
    }
  }

  const handleExport = async () => {
    if (!filtered.length) return notify('Nothing to export in this view.', 'error')
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Expenses')
    ws.columns = [
      { header: 'Expense ID', key: 'id', width: 14 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Category', key: 'category', width: 24 },
      { header: 'Paid To', key: 'vendor', width: 28 },
      { header: 'Vendor GSTIN', key: 'gstin', width: 18 },
      { header: 'HSN/SAC', key: 'sac', width: 12 },
      { header: 'Bill No', key: 'bill', width: 16 },
      { header: 'Taxable Value', key: 'taxable', width: 15 },
      { header: 'GST Rate %', key: 'rate', width: 11 },
      { header: 'GST Amount', key: 'gst', width: 14 },
      { header: 'Total', key: 'total', width: 14 },
      { header: 'ITC Claimable', key: 'itc', width: 14 },
      { header: 'Paid Via', key: 'method', width: 16 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Notes', key: 'notes', width: 34 },
    ]
    ws.getRow(1).font = { bold: true }
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E1424' } }
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    filtered.forEach((r) => {
      const d = r.invoice_data || {}
      ws.addRow({
        id: r.invoice_no,
        date: d.date || '',
        category: getCategory(d.category).label,
        vendor: d.vendor || '',
        gstin: d.vendorGstin || '',
        sac: d.sac || '',
        bill: d.billNo || '',
        taxable: parseFloat(d.taxableValue || 0),
        rate: parseFloat(d.gstRate || 0),
        gst: parseFloat(d.gstAmount || 0),
        total: parseFloat(r.total_amount || 0),
        itc: d.itcEligible ? 'Yes' : 'No',
        method: d.paymentMethod || '',
        status: (r.status || d.paymentStatus) === 'PENDING' ? 'Unpaid' : 'Paid',
        notes: d.notes || '',
      })
    })

    // Totals row
    const totalRow = ws.addRow({
      vendor: 'TOTAL',
      taxable: filtered.reduce((s, r) => s + parseFloat(r.invoice_data?.taxableValue || 0), 0),
      gst: filtered.reduce((s, r) => s + parseFloat(r.invoice_data?.gstAmount || 0), 0),
      total: filtered.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0),
    })
    totalRow.font = { bold: true }
    ;['taxable', 'gst', 'total'].forEach((k) => {
      ws.getColumn(k).numFmt = '#,##0.00'
    })

    const buf = await wb.xlsx.writeBuffer()
    const label = DATE_PRESETS.find((p) => p.id === preset)?.label.replace(/\s+/g, '-') || 'all'
    saveAs(new Blob([buf]), `Expenses_${label}_${new Date().toISOString().split('T')[0]}.xlsx`)
    notify(`${filtered.length} expenses exported.`)
  }

  const activeFilterCount =
    (category !== 'all' ? 1 : 0) + (method !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0)

  const rangeLabel = DATE_PRESETS.find((p) => p.id === preset)?.label || ''

  return (
    <div className="min-h-screen bg-ink-50/60 font-sans antialiased">
      {/* --- Header --- */}
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-container-wide flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 ring-1 ring-ink-200 transition hover:text-ink-900"
              aria-label="Back to dashboard"
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
            </button>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ink-900 to-ink-700 text-white">
              <Icon name="wallet" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-bold tracking-tight text-ink-900 sm:text-lg">
                Expenses Manager
              </h1>
              <p className="text-[11px] font-medium text-ink-500">
                {getFinancialYear().label} · {stats.count} {stats.count === 1 ? 'expense' : 'expenses'} in view
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-ink-700 transition hover:bg-ink-50 lg:flex-none"
            >
              <Icon name="download" className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => setModal({ open: true, node: null })}
              className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-xs font-bold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-ink-800 lg:flex-none"
            >
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} />
              Add expense
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-container-wide px-4 py-6 sm:px-6">
        {/* --- KPIs --- */}
        <section aria-label="Summary" className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={`Spent · ${rangeLabel}`}
            value={formatCompactINR(stats.total)}
            sub={`${stats.count} ${stats.count === 1 ? 'entry' : 'entries'}`}
            icon="wallet"
            tone="ink"
          />
          <KpiCard
            label="Monthly average"
            value={formatCompactINR(stats.monthlyAvg)}
            sub={stats.months.length ? `across ${stats.months.length} mo` : 'no data yet'}
            icon="chart"
            tone="brand"
          />
          <KpiCard
            label="ITC claimable"
            value={formatCompactINR(stats.itc)}
            sub="GST on eligible bills"
            icon="shield"
            tone="mint"
          />
          <KpiCard
            label="Unpaid"
            value={formatCompactINR(stats.unpaid)}
            sub={`${stats.unpaidCount} awaiting payment`}
            icon="clock"
            tone="amber"
          />
        </section>

        {/* --- Charts --- */}
        <section className="mt-4 grid gap-3 lg:grid-cols-5">
          <div className={`${CARD} p-4 lg:col-span-3`}>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
              Monthly spend
            </h2>
            {stats.months.length ? (
              <div className="mt-3 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.months} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#7D8AA3' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#7D8AA3' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCompactINR(v).replace('₹', '')}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(7,10,19,0.04)' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#2547E4" maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="flex h-[220px] items-center justify-center text-xs font-medium text-ink-400">
                No spend in this period
              </p>
            )}
          </div>

          <div className={`${CARD} p-4 lg:col-span-2`}>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
              By category
            </h2>
            {stats.categories.length ? (
              <div className="mt-3 flex h-[220px] items-center gap-2">
                <div className="h-full w-[45%]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categories}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={62}
                        paddingAngle={3}
                        cornerRadius={4}
                      >
                        {stats.categories.map((c) => (
                          <Cell key={c.name} fill={c.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="no-scrollbar max-h-full flex-1 space-y-1.5 overflow-y-auto pr-1">
                  {stats.categories.map((c) => (
                    <li key={c.name} className="flex items-center gap-2 text-[11px]">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="flex-1 truncate font-semibold text-ink-600">{c.name}</span>
                      <span className="tnum shrink-0 font-bold text-ink-900">
                        {formatCompactINR(c.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="flex h-[220px] items-center justify-center text-xs font-medium text-ink-400">
                No categories yet
              </p>
            )}
          </div>
        </section>

        {/* --- Filters --- */}
        <section className={`${CARD} mt-4 p-3 sm:p-4`} aria-label="Filters">
          {/* Date presets scroll sideways on phones */}
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:pb-0">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                aria-pressed={preset === p.id}
                className={`focus-ring shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold transition ${
                  preset === p.id
                    ? 'bg-ink-900 text-white shadow-sm-soft'
                    : 'bg-ink-100/70 text-ink-500 hover:text-ink-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor, category, bill no…"
                aria-label="Search expenses"
                className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={`focus-ring inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                activeFilterCount
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
              }`}
            >
              <Icon name="filter" className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="tnum rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 grid gap-3 border-t border-ink-100 pt-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-ink-400" htmlFor="f-cat">
                  Category
                </label>
                <select
                  id="f-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="all">All categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-ink-400" htmlFor="f-method">
                  Paid via
                </label>
                <select
                  id="f-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="all">Any method</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-ink-400" htmlFor="f-status">
                  Status
                </label>
                <select
                  id="f-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="all">Any status</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Unpaid</option>
                </select>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setCategory('all'); setMethod('all'); setStatus('all') }}
                  className="focus-ring justify-self-start text-[11px] font-bold text-brand-600 underline decoration-brand-200 decoration-2 underline-offset-2 hover:decoration-brand-400"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* --- List --- */}
        <section className={`${CARD} mt-4 overflow-hidden`} aria-label="Expense list">
          {loading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-ink-100/70" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
                <Icon name="wallet" className="h-7 w-7" />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink-900">
                {rows.length === 0 ? 'No expenses yet' : 'Nothing matches these filters'}
              </h3>
              <p className="mt-1.5 max-w-sm text-sm text-ink-500">
                {rows.length === 0
                  ? 'Add your first expense and it will show up here with GST and ITC worked out for you.'
                  : 'Try widening the date range or clearing the filters.'}
              </p>
              {rows.length === 0 && (
                <button
                  onClick={() => setModal({ open: true, node: null })}
                  className="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-ink-800"
                >
                  <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} />
                  Add your first expense
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <table className="hidden w-full text-left md:table">
                <thead className="border-b border-ink-100 bg-ink-50/70">
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                    <th className="px-4 py-3">Expense</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Taxable</th>
                    <th className="px-4 py-3 text-right">GST</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filtered.map((r) => {
                    const d = r.invoice_data || {}
                    return (
                      <tr key={r.id} className="group transition-colors hover:bg-brand-50/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-bold text-ink-900">
                              {d.vendor || '—'}
                            </span>
                            {d.isRecurring && (
                              <span title={`Repeats ${d.recurringCycle}`} className="text-brand-500">
                                <Icon name="repeat" className="h-3.5 w-3.5" strokeWidth={2.2} />
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] font-semibold text-ink-400">
                            {r.invoice_no}
                            {d.billNo ? ` · ${d.billNo}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3"><CategoryTag id={d.category} /></td>
                        <td className="tnum px-4 py-3 text-xs font-medium text-ink-600">
                          {d.date
                            ? new Date(d.date).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="tnum px-4 py-3 text-right text-xs font-semibold text-ink-600">
                          {formatINR(d.taxableValue)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="tnum block text-xs font-semibold text-ink-600">
                            {formatINR(d.gstAmount)}
                          </span>
                          {d.itcEligible && parseFloat(d.gstAmount || 0) > 0 && (
                            <span className="text-[9px] font-bold uppercase tracking-wide text-mint-600">
                              ITC
                            </span>
                          )}
                        </td>
                        <td className="tnum px-4 py-3 text-right text-sm font-extrabold text-ink-900">
                          {formatINR(r.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleStatus(r)}
                            className="focus-ring transition active:scale-95"
                            title="Toggle paid / unpaid"
                          >
                            <StatusPill status={r.status || d.paymentStatus} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => setModal({ open: true, node: r })}
                              aria-label={`Edit ${r.invoice_no}`}
                              className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 ring-1 ring-ink-200 transition hover:text-brand-600"
                            >
                              <Icon name="edit" className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(r)}
                              aria-label={`Delete ${r.invoice_no}`}
                              className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 ring-1 ring-ink-200 transition hover:text-rose-600"
                            >
                              <Icon name="trash" className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Mobile cards */}
              <ul className="divide-y divide-ink-100 md:hidden">
                {filtered.map((r) => {
                  const d = r.invoice_data || {}
                  return (
                    <li key={r.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink-900">{d.vendor || '—'}</p>
                          <p className="font-mono text-[10px] font-semibold text-ink-400">
                            {r.invoice_no}
                          </p>
                        </div>
                        <p className="tnum shrink-0 text-base font-extrabold text-ink-900">
                          {formatINR(r.total_amount)}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <CategoryTag id={d.category} />
                        <span className="tnum shrink-0 text-[11px] font-medium text-ink-500">
                          {d.date
                            ? new Date(d.date).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short',
                              })
                            : ''}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button onClick={() => toggleStatus(r)} className="focus-ring active:scale-95">
                          <StatusPill status={r.status || d.paymentStatus} />
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setModal({ open: true, node: r })}
                            aria-label={`Edit ${r.invoice_no}`}
                            className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 ring-1 ring-ink-200"
                          >
                            <Icon name="edit" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(r)}
                            aria-label={`Delete ${r.invoice_no}`}
                            className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 ring-1 ring-ink-200"
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* Footer total */}
              <div className="flex items-center justify-between gap-4 border-t border-ink-100 bg-ink-50/70 px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                  {filtered.length} shown
                </span>
                <span className="tnum text-sm font-extrabold text-ink-900">
                  {formatINR(stats.total)}
                </span>
              </div>
            </>
          )}
        </section>
      </main>

      <BrandingFooter />

      {/* --- Add / edit --- */}
      {modal.open && (
        <ExpenseFormModal
          expenseNode={modal.node}
          allExpenses={rows}
          onClose={() => setModal({ open: false, node: null })}
          onSaved={() => {
            setModal({ open: false, node: null })
            notify(modal.node ? 'Expense updated.' : 'Expense added.')
            load()
          }}
        />
      )}

      {/* --- Delete confirm --- */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="del-title"
            className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-hero"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <Icon name="trash" className="h-5 w-5" />
            </span>
            <h3 id="del-title" className="mt-3.5 text-base font-bold text-ink-900">
              Delete this expense?
            </h3>
            <p className="mt-1.5 text-sm text-ink-500">
              {confirmDelete.invoice_no} · {formatINR(confirmDelete.total_amount)} to{' '}
              {confirmDelete.invoice_data?.vendor || 'vendor'}. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="focus-ring flex-1 rounded-xl border border-ink-200 px-4 py-2.5 text-xs font-bold text-ink-600 hover:bg-ink-50"
              >
                Keep it
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="focus-ring flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lift hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Toast --- */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[9999] -translate-x-1/2 animate-rise px-4"
        >
          <div
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold shadow-float ${
              toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-ink-900 text-white'
            }`}
          >
            <Icon name={toast.type === 'error' ? 'info' : 'check'} className="h-4 w-4" strokeWidth={2.5} />
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
