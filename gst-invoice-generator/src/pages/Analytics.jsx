import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
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
import BrandingFooter from '../components/BrandingFooter'
import { REVENUE_BASES, buildAnalytics } from '../data/analytics'
import { formatCompactINR, formatINR, formatPercent } from '../data/currency'
import { DATE_PRESETS, getFinancialYear, resolveDateRange } from '../data/expenses'

const CARD = 'rounded-2xl bg-white ring-1 ring-ink-900/[0.06] shadow-sm-soft'
const PANEL_TITLE = 'text-[10px] font-bold uppercase tracking-widest text-ink-400'

function Money({ value, className = '' }) {
  return <span className={`tnum ${className}`}>{formatINR(value)}</span>
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-ink-900 px-3 py-2 shadow-float">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-400">
        {label || payload[0]?.payload?.name}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-[11px] font-semibold text-white">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          {p.name}
          <span className="tnum ml-auto pl-3 font-bold">{formatINR(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

/** Headline profit / loss card — the number people open this page for. */
function ProfitHeadline({ profit, revenue, expenses }) {
  const win = profit.isProfit
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-hero sm:p-6 ${
        win
          ? 'bg-gradient-to-br from-mint-700 via-mint-600 to-mint-500'
          : 'bg-gradient-to-br from-rose-700 via-rose-600 to-rose-500'
      }`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
          <Icon name={win ? 'arrowUpRight' : 'arrowDownRight'} className="h-3.5 w-3.5" strokeWidth={2.4} />
          {win ? 'Net profit' : 'Net loss'}
        </p>
        <p className="tnum mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {formatINR(Math.abs(profit.net))}
        </p>
        <p className="mt-1 text-xs font-semibold text-white/80">
          {formatPercent(Math.abs(profit.margin))} {win ? 'margin' : 'of revenue lost'}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-widest text-white/60">Revenue</dt>
            <dd className="tnum text-sm font-bold">{formatCompactINR(revenue.total)}</dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-widest text-white/60">Expenses</dt>
            <dd className="tnum text-sm font-bold">{formatCompactINR(expenses.total)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, tone = 'ink' }) {
  const tones = {
    ink: 'bg-ink-900 text-white',
    brand: 'bg-brand-50 text-brand-600 ring-1 ring-brand-100',
    mint: 'bg-mint-50 text-mint-600 ring-1 ring-mint-100',
    amber: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
    rose: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
  }
  return (
    <div className={`${CARD} flex items-start justify-between gap-3 p-4`}>
      <div className="min-w-0">
        <p className={PANEL_TITLE}>{label}</p>
        <p className="tnum mt-1.5 truncate text-xl font-extrabold tracking-tight text-ink-900">{value}</p>
        {sub && <p className="mt-0.5 truncate text-[11px] font-medium text-ink-500">{sub}</p>}
      </div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon name={icon} className="h-4.5 w-4.5" />
      </span>
    </div>
  )
}

function Leaderboard({ title, rows, emptyText, accent }) {
  const max = rows.length ? Math.max(...rows.map((r) => r.value)) : 0
  return (
    <div className={`${CARD} p-4`}>
      <h2 className={PANEL_TITLE}>{title}</h2>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-xs font-medium text-ink-400">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.name}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-xs font-semibold text-ink-700">{r.name}</span>
                <Money value={r.value} className="shrink-0 text-xs font-bold text-ink-900" />
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${max ? (r.value / max) * 100 : 0}%`, backgroundColor: accent }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState([])
  const [preset, setPreset] = useState('this-fy')
  const [basis, setBasis] = useState('all')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')
      const { data, error } = await supabase.from('invoices').select('*').eq('user_id', user.id)
      if (error) {
        setToast({ message: 'Could not load your data. Please retry.', type: 'error' })
      } else {
        setDocs(data || [])
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const range = useMemo(() => resolveDateRange(preset), [preset])
  const a = useMemo(
    () => buildAnalytics({ documents: docs, from: range.from, to: range.to, basis }),
    [docs, range, basis]
  )

  const rangeLabel = DATE_PRESETS.find((p) => p.id === preset)?.label || ''
  const basisMeta = REVENUE_BASES.find((b) => b.id === basis)
  const hasData = a.counts.invoices + a.counts.receipts + a.counts.expenses > 0

  const handleExport = async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Profit & Loss')
    ws.columns = [
      { header: 'Line', key: 'line', width: 34 },
      { header: 'Amount (INR)', key: 'amount', width: 18 },
    ]
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E1424' } }

    const add = (line, amount, bold = false) => {
      const r = ws.addRow({ line, amount })
      if (bold) r.font = { bold: true }
      return r
    }
    add(`Period: ${rangeLabel}`, null, true)
    add(`Revenue basis: ${basisMeta?.label} (${basisMeta?.hint})`, null)
    ws.addRow({})
    add('Revenue — invoiced', a.revenue.invoiced)
    add('Revenue — collected', a.revenue.collected)
    add('Revenue recognised', a.revenue.total, true)
    ws.addRow({})
    a.expenses.byCategory.forEach((c) => add(`Expense — ${c.name}`, c.value))
    add('Total expenses', a.expenses.total, true)
    ws.addRow({})
    add(a.profit.isProfit ? 'NET PROFIT' : 'NET LOSS', a.profit.net, true)
    add('Margin %', a.profit.margin)
    ws.addRow({})
    add('GST output (collected)', a.gst.output)
    add('GST input credit (ITC eligible)', a.gst.input)
    add('GST net position', a.gst.net, true)
    ws.addRow({})
    add('Unpaid invoices outstanding', a.revenue.outstanding)
    add('Unpaid expenses', a.expenses.unpaid)

    ws.getColumn('amount').numFmt = '#,##0.00'
    const buf = await wb.xlsx.writeBuffer()
    saveAs(new Blob([buf]), `Profit-and-Loss_${rangeLabel.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.xlsx`)
    setToast({ message: 'P&L statement exported.', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="min-h-screen bg-ink-50/60 font-sans antialiased">
      {/* --- Header --- */}
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-container-wide flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Back to dashboard"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 ring-1 ring-ink-200 transition hover:text-ink-900"
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
            </button>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white">
              <Icon name="pie" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-bold tracking-tight text-ink-900 sm:text-lg">Analytics</h1>
              <p className="text-[11px] font-medium text-ink-500">
                Profit &amp; loss · {getFinancialYear().label}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/expenses')}
              className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-ink-700 transition hover:bg-ink-50 lg:flex-none"
            >
              <Icon name="wallet" className="h-4 w-4" />
              Expenses
            </button>
            <button
              onClick={handleExport}
              disabled={!hasData}
              className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-ink-800 disabled:opacity-50 lg:flex-none"
            >
              <Icon name="download" className="h-4 w-4" />
              Export P&amp;L
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-container-wide px-4 py-6 sm:px-6">
        {/* --- Controls --- */}
        <section className={`${CARD} p-3 sm:p-4`} aria-label="Period and revenue basis">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
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

          <div className="mt-3 flex flex-col gap-2 border-t border-ink-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <fieldset className="min-w-0">
              <legend className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-400">
                Revenue basis
              </legend>
              <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
                {REVENUE_BASES.map((b) => (
                  <label
                    key={b.id}
                    title={b.hint}
                    className={`focus-ring shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                      basis === b.id
                        ? 'bg-brand-600 text-white shadow-sm-soft'
                        : 'bg-ink-100/70 text-ink-500 hover:text-ink-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="basis"
                      className="sr-only"
                      checked={basis === b.id}
                      onChange={() => setBasis(b.id)}
                    />
                    {b.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="max-w-sm text-[10px] font-medium leading-snug text-ink-400 sm:text-right">
              {basisMeta?.hint}.
              {basis === 'all' &&
                ' If you raise an invoice and a receipt for the same sale, that revenue is counted twice — switch basis to avoid it.'}
            </p>
          </div>
        </section>

        {loading ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : !hasData ? (
          <div className={`${CARD} mt-4 flex flex-col items-center px-6 py-16 text-center`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
              <Icon name="pie" className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-base font-bold text-ink-900">Nothing to analyse yet</h2>
            <p className="mt-1.5 max-w-sm text-sm text-ink-500">
              Once you have invoices, receipts or expenses in this period, your profit and loss will
              appear here.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => navigate('/create-invoice')}
                className="focus-ring rounded-xl bg-ink-900 px-4 py-2.5 text-xs font-bold text-white shadow-lift hover:bg-ink-800"
              >
                Create an invoice
              </button>
              <button
                onClick={() => navigate('/expenses')}
                className="focus-ring rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-ink-700 hover:bg-ink-50"
              >
                Add an expense
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* --- Headline + stats --- */}
            <section className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
              <ProfitHeadline profit={a.profit} revenue={a.revenue} expenses={a.expenses} />

              <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
                <StatCard
                  label="Revenue recognised"
                  value={formatCompactINR(a.revenue.total)}
                  sub={`${a.counts.invoices} invoices · ${a.counts.receipts} receipts`}
                  icon="trendUp"
                  tone="brand"
                />
                <StatCard
                  label="Total expenses"
                  value={formatCompactINR(a.expenses.total)}
                  sub={`${a.counts.expenses} recorded`}
                  icon="wallet"
                  tone="rose"
                />
                <StatCard
                  label="GST net position"
                  value={formatCompactINR(a.gst.net)}
                  sub={`${formatCompactINR(a.gst.output)} out · ${formatCompactINR(a.gst.input)} ITC`}
                  icon="scale"
                  tone="ink"
                />
                <StatCard
                  label="Unpaid invoices"
                  value={formatCompactINR(a.revenue.outstanding)}
                  sub={a.expenses.unpaid > 0 ? `${formatCompactINR(a.expenses.unpaid)} owed out` : 'nothing owed out'}
                  icon="clock"
                  tone="amber"
                />
              </div>
            </section>

            {/* --- Revenue vs expenses vs profit --- */}
            <section className={`${CARD} mt-3 p-4`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className={PANEL_TITLE}>Revenue vs expenses vs profit</h2>
                <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-brand-600" /> Revenue
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-rose-500" /> Expenses
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-mint-600" /> Profit
                  </span>
                </div>
              </div>
              <div className="mt-3 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={a.monthly} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                    <CartesianGrid stroke="#ECEEF2" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7D8AA3' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#7D8AA3' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCompactINR(v).replace('₹', '')}
                    />
                    <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(7,10,19,0.04)' }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#2547E4" radius={[5, 5, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={26} />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke="#089060"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#089060' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* --- Pies --- */}
            <section className="mt-3 grid gap-3 lg:grid-cols-3">
              {/* Where revenue went */}
              <div className={`${CARD} p-4`}>
                <h2 className={PANEL_TITLE}>Revenue split</h2>
                <div className="mt-2 h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={a.profit.breakdown}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={66}
                        paddingAngle={3}
                        cornerRadius={4}
                      >
                        {a.profit.breakdown.map((s) => (
                          <Cell key={s.name} fill={s.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-1 space-y-1.5">
                  {a.profit.breakdown.map((s) => (
                    <li key={s.name} className="flex items-center gap-2 text-[11px]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="flex-1 font-semibold text-ink-600">{s.name}</span>
                      <Money value={s.value} className="font-bold text-ink-900" />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expense mix */}
              <div className={`${CARD} p-4`}>
                <h2 className={PANEL_TITLE}>Expenses by category</h2>
                {a.expenses.byCategory.length ? (
                  <>
                    <div className="mt-2 h-[190px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={a.expenses.byCategory}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={66}
                            paddingAngle={3}
                            cornerRadius={4}
                          >
                            {a.expenses.byCategory.map((c) => (
                              <Cell key={c.name} fill={c.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="no-scrollbar mt-1 max-h-24 space-y-1.5 overflow-y-auto">
                      {a.expenses.byCategory.map((c) => (
                        <li key={c.name} className="flex items-center gap-2 text-[11px]">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="flex-1 truncate font-semibold text-ink-600">{c.name}</span>
                          <Money value={c.value} className="shrink-0 font-bold text-ink-900" />
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="py-16 text-center text-xs font-medium text-ink-400">No expenses in this period</p>
                )}
              </div>

              {/* Product vs service */}
              <div className={`${CARD} p-4`}>
                <h2 className={PANEL_TITLE}>Product vs service</h2>
                {a.revenueMix.length ? (
                  <>
                    <div className="mt-2 h-[190px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={a.revenueMix}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={66}
                            paddingAngle={3}
                            cornerRadius={4}
                          >
                            {a.revenueMix.map((m) => (
                              <Cell key={m.name} fill={m.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-1 space-y-1.5">
                      {a.revenueMix.map((m) => (
                        <li key={m.name} className="flex items-center gap-2 text-[11px]">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                          <span className="flex-1 font-semibold text-ink-600">{m.name}</span>
                          <Money value={m.value} className="font-bold text-ink-900" />
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="py-16 text-center text-xs font-medium text-ink-400">No revenue in this period</p>
                )}
              </div>
            </section>

            {/* --- Profit trend + leaderboards --- */}
            <section className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className={`${CARD} p-4`}>
                <h2 className={PANEL_TITLE}>Profit trend</h2>
                <div className="mt-3 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={a.monthly} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                      <defs>
                        <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14b274" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#14b274" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#ECEEF2" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7D8AA3' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#7D8AA3' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCompactINR(v).replace('₹', '')}
                      />
                      <Tooltip content={<ChartTip />} />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="Profit"
                        stroke="#089060"
                        strokeWidth={2.5}
                        fill="url(#profitFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {a.bestMonth && a.worstMonth && a.monthly.length > 1 && (
                  <div className="mt-2 grid grid-cols-2 gap-2 border-t border-ink-100 pt-3">
                    <p className="text-[11px]">
                      <span className="block text-[9px] font-bold uppercase tracking-widest text-ink-400">Best month</span>
                      <span className="font-bold text-ink-900">{a.bestMonth.label}</span>{' '}
                      <span className="tnum font-semibold text-mint-600">{formatCompactINR(a.bestMonth.profit)}</span>
                    </p>
                    <p className="text-[11px] sm:text-right">
                      <span className="block text-[9px] font-bold uppercase tracking-widest text-ink-400">Weakest month</span>
                      <span className="font-bold text-ink-900">{a.worstMonth.label}</span>{' '}
                      <span className="tnum font-semibold text-rose-600">{formatCompactINR(a.worstMonth.profit)}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <Leaderboard title="Top customers by revenue" rows={a.topClients} emptyText="No revenue in this period" accent="#2547E4" />
                <Leaderboard title="Top vendors by spend" rows={a.expenses.topVendors} emptyText="No expenses in this period" accent="#f43f5e" />
              </div>
            </section>

            {/* --- P&L statement --- */}
            <section className={`${CARD} mt-3 overflow-hidden`}>
              <div className="border-b border-ink-100 px-4 py-3">
                <h2 className={PANEL_TITLE}>Statement · {rangeLabel}</h2>
              </div>
              <dl className="divide-y divide-ink-100">
                <div className="flex items-baseline justify-between px-4 py-2.5">
                  <dt className="text-xs font-semibold text-ink-600">Revenue invoiced (accrual)</dt>
                  <Money value={a.revenue.invoiced} className="text-xs font-bold text-ink-900" />
                </div>
                <div className="flex items-baseline justify-between px-4 py-2.5">
                  <dt className="text-xs font-semibold text-ink-600">Revenue collected (cash)</dt>
                  <Money value={a.revenue.collected} className="text-xs font-bold text-ink-900" />
                </div>
                <div className="flex items-baseline justify-between bg-brand-50/50 px-4 py-2.5">
                  <dt className="text-xs font-bold text-ink-900">
                    Revenue recognised · {basisMeta?.label}
                  </dt>
                  <Money value={a.revenue.total} className="text-sm font-extrabold text-brand-700" />
                </div>
                {a.expenses.byCategory.map((c) => (
                  <div key={c.name} className="flex items-baseline justify-between px-4 py-2.5">
                    <dt className="flex items-center gap-2 text-xs font-semibold text-ink-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                      <span className="text-[10px] text-ink-400">({c.count})</span>
                    </dt>
                    <Money value={c.value} className="text-xs font-bold text-ink-700" />
                  </div>
                ))}
                <div className="flex items-baseline justify-between bg-rose-50/50 px-4 py-2.5">
                  <dt className="text-xs font-bold text-ink-900">Total expenses</dt>
                  <Money value={a.expenses.total} className="text-sm font-extrabold text-rose-700" />
                </div>
                <div
                  className={`flex items-baseline justify-between px-4 py-3.5 ${
                    a.profit.isProfit ? 'bg-mint-50/70' : 'bg-amber-50/70'
                  }`}
                >
                  <dt className="text-sm font-extrabold uppercase tracking-wide text-ink-900">
                    {a.profit.isProfit ? 'Net profit' : 'Net loss'}
                    <span className="ml-2 text-[11px] font-bold normal-case text-ink-500">
                      {formatPercent(a.profit.margin)} margin
                    </span>
                  </dt>
                  <Money
                    value={Math.abs(a.profit.net)}
                    className={`text-lg font-extrabold ${a.profit.isProfit ? 'text-mint-700' : 'text-amber-700'}`}
                  />
                </div>
              </dl>
              <p className="flex items-start gap-2 border-t border-ink-100 bg-ink-50/60 px-4 py-3 text-[10px] font-medium leading-snug text-ink-500">
                <Icon name="info" className="mt-px h-3.5 w-3.5 shrink-0 text-ink-400" />
                A management view, not a statutory financial statement. GST figures are indicative
                and exclude reverse charge, blocked credits and adjustments. Foreign-currency
                receipts convert at fixed indicative rates. Have your accountant verify before
                filing.
              </p>
            </section>
          </>
        )}
      </main>

      <BrandingFooter />

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 z-[9999] -translate-x-1/2 animate-rise px-4">
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
