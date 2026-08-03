import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../supabaseClient'
import Icon from './icons'
import {
  AMOUNT_MODES,
  EXPENSE_CATEGORIES,
  EXPENSE_TYPE,
  GST_RATES,
  PAYMENT_METHODS,
  RECURRING_CYCLES,
  computeExpenseTotals,
  emptyExpense,
  getCategory,
  isNoGst,
  nextExpenseId,
} from '../../data/expenses'
import { formatINR } from '../../data/currency'

const FIELD =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 placeholder:text-ink-300'
const LABEL = 'mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-ink-400'

export default function ExpenseFormModal({ expenseNode, allExpenses = [], onClose, onSaved }) {
  const isEdit = !!expenseNode
  const [fields, setFields] = useState(emptyExpense)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef(null)
  const firstFieldRef = useRef(null)

  const set = (patch) => setFields((f) => ({ ...f, ...patch }))

  useEffect(() => {
    if (isEdit) {
      setFields({ ...emptyExpense(), ...expenseNode.invoice_data, expense_id: expenseNode.invoice_no })
    } else {
      setFields({ ...emptyExpense(), expense_id: nextExpenseId(allExpenses) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseNode])

  // Escape to close, body scroll lock, focus the first field on open.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => firstFieldRef.current?.focus(), 60)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      clearTimeout(t)
    }
  }, [onClose])

  // Keep focus inside the dialog.
  const onKeyDownTrap = (e) => {
    if (e.key !== 'Tab') return
    const nodes = dialogRef.current?.querySelectorAll(
      'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
    )
    if (!nodes?.length) return
    const list = Array.from(nodes).filter((n) => !n.disabled && n.offsetParent !== null)
    const first = list[0]
    const last = list[list.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const totals = computeExpenseTotals(fields)
  const category = getCategory(fields.category)
  const noGst = isNoGst(fields.amountMode)

  /** Selecting a category prefills SAC, the usual rate, and — for spend that is
   *  outside GST by nature, like salaries — the No GST treatment. Never
   *  overwrites values the user has already typed. */
  const pickCategory = (id) => {
    const c = getCategory(id)
    const untouched = !fields.amount
    set({
      category: id,
      sac: fields.sac ? fields.sac : c.sac,
      gstRate: untouched ? c.gst : fields.gstRate,
      amountMode: untouched ? (c.noGst ? 'none' : 'exclusive') : fields.amountMode,
    })
  }

  /** Switching to No GST clears the rate and any ITC claim, since neither
   *  applies. Switching back restores the category's usual rate. */
  const pickAmountMode = (mode) => {
    if (isNoGst(mode)) {
      set({ amountMode: mode, gstRate: 0, itcEligible: false })
    } else {
      set({
        amountMode: mode,
        gstRate: fields.gstRate || category.gst || 18,
        itcEligible: true,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fields.vendor.trim()) return setError('Enter who this was paid to.')
    if (!(parseFloat(fields.amount) > 0)) return setError('Enter an amount greater than zero.')

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session expired. Please sign in again.')

      // A No-GST expense must never persist a rate or an ITC claim, whatever
      // was left in state before the mode was switched.
      const gstFields = noGst
        ? { gstRate: 0, itcEligible: false }
        : { gstRate: fields.gstRate, itcEligible: fields.itcEligible }

      const payload = {
        user_id: user.id,
        invoice_no: fields.expense_id,
        invoice_data: {
          ...fields,
          ...gstFields,
          type: EXPENSE_TYPE,
          taxableValue: totals.taxableValue,
          gstAmount: totals.gstAmount,
          grandTotal: totals.grandTotal,
        },
        total_amount: totals.grandTotal,
      }

      if (isEdit) {
        const { error: err } = await supabase
          .from('invoices')
          .update({ ...payload, status: fields.paymentStatus })
          .eq('id', expenseNode.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('invoices')
          .insert({ ...payload, status: fields.paymentStatus })
        if (err) throw err
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Could not save this expense.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        onKeyDown={onKeyDownTrap}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-hero animate-rise sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: category.color }}
            >
              <Icon name={category.icon} className="h-5 w-5" />
            </span>
            <div>
              <h2 id="expense-modal-title" className="text-base font-bold tracking-tight text-ink-900">
                {isEdit ? 'Edit expense' : 'Add expense'}
              </h2>
              <p className="font-mono text-[11px] font-semibold text-ink-400">{fields.expense_id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 ring-1 ring-ink-200 transition hover:text-ink-700"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <form id="expense-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Category picker: the fastest way in, so it comes first. */}
            <div>
              <span className={LABEL}>Category</span>
              <div className="grid grid-cols-2 gap-2 xs:grid-cols-3">
                {EXPENSE_CATEGORIES.map((c, i) => {
                  const active = fields.category === c.id
                  return (
                    <button
                      key={c.id}
                      ref={i === 0 ? firstFieldRef : undefined}
                      type="button"
                      onClick={() => pickCategory(c.id)}
                      aria-pressed={active}
                      className={`focus-ring flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-left transition-all ${
                        active
                          ? 'border-transparent bg-ink-900 text-white shadow-soft'
                          : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50'
                      }`}
                    >
                      <Icon
                        name={c.icon}
                        className="h-4 w-4 shrink-0"
                        strokeWidth={2}
                      />
                      <span className="truncate text-[11px] font-bold leading-tight">{c.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Who and when */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="exp-vendor">Paid to *</label>
                <input
                  id="exp-vendor"
                  type="text"
                  className={FIELD}
                  value={fields.vendor}
                  onChange={(e) => set({ vendor: e.target.value })}
                  placeholder="e.g. Amazon Web Services"
                  required
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="exp-date">Expense date *</label>
                <input
                  id="exp-date"
                  type="date"
                  className={FIELD}
                  value={fields.date}
                  onChange={(e) => set({ date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Amount */}
            <div className="rounded-2xl bg-ink-50/70 p-4 ring-1 ring-ink-100">
              <div className="flex flex-col gap-3 xs:flex-row xs:items-end">
                <div className="flex-1">
                  <label className={LABEL} htmlFor="exp-amount">Amount *</label>
                  <input
                    id="exp-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    className={`${FIELD} text-base font-bold`}
                    value={fields.amount}
                    onChange={(e) => set({ amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                {/* No rate to choose when the spend is outside GST. */}
                {!noGst && (
                  <div className="xs:w-32">
                    <label className={LABEL} htmlFor="exp-gst">GST rate</label>
                    <select
                      id="exp-gst"
                      className={FIELD}
                      value={fields.gstRate}
                      onChange={(e) => set({ gstRate: parseFloat(e.target.value) })}
                    >
                      {GST_RATES.map((r) => (
                        <option key={r} value={r}>{r}%</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Bills are quoted both ways, and plenty of spend carries no GST
                  at all, so the user says which rather than us guessing. */}
              <fieldset className="mt-3">
                <legend className="sr-only">How should this amount be treated for GST?</legend>
                <div className="inline-flex flex-wrap gap-0.5 rounded-lg bg-white p-0.5 ring-1 ring-ink-200">
                  {AMOUNT_MODES.map((opt) => (
                    <label
                      key={opt.id}
                      title={opt.hint}
                      className={`focus-ring cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-bold transition ${
                        fields.amountMode === opt.id
                          ? 'bg-ink-900 text-white'
                          : 'text-ink-500 hover:text-ink-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="amountMode"
                        className="sr-only"
                        checked={fields.amountMode === opt.id}
                        onChange={() => pickAmountMode(opt.id)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] font-medium text-ink-400">
                  {AMOUNT_MODES.find((m) => m.id === fields.amountMode)?.hint}
                </p>
              </fieldset>

              {/* Derived figures, so there is no doubt what gets saved. */}
              <dl className="mt-4 space-y-1.5 border-t border-ink-200/70 pt-3" aria-live="polite">
                {noGst ? (
                  <div className="flex items-baseline justify-between">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-900">
                      Total
                    </dt>
                    <dd className="tnum text-lg font-extrabold text-ink-900">
                      {formatINR(totals.grandTotal)}
                    </dd>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-xs">
                      <dt className="text-ink-500">Taxable value</dt>
                      <dd className="tnum font-semibold text-ink-700">{formatINR(totals.taxableValue)}</dd>
                    </div>
                    <div className="flex justify-between text-xs">
                      <dt className="text-ink-500">GST ({fields.gstRate}%)</dt>
                      <dd className="tnum font-semibold text-ink-700">{formatINR(totals.gstAmount)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between border-t border-ink-200/70 pt-2">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-900">Total</dt>
                      <dd className="tnum text-lg font-extrabold text-ink-900">{formatINR(totals.grandTotal)}</dd>
                    </div>
                  </>
                )}
              </dl>

              {noGst && (
                <p className="mt-2.5 flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-[10px] font-medium leading-snug text-ink-500 ring-1 ring-ink-200">
                  <Icon name="info" className="mt-px h-3.5 w-3.5 shrink-0 text-ink-400" />
                  Recorded outside GST, so no input tax credit is claimed on this expense.
                </p>
              )}
            </div>

            {/* GST / ITC — irrelevant when the expense is outside GST, so the
                whole block stands down rather than showing dead fields. */}
            {!noGst && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL} htmlFor="exp-gstin">Vendor GSTIN</label>
                  <input
                    id="exp-gstin"
                    type="text"
                    className={`${FIELD} font-mono uppercase`}
                    value={fields.vendorGstin}
                    onChange={(e) =>
                      set({ vendorGstin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })
                    }
                    placeholder="29AAXXX1234X1ZX"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="exp-sac">HSN / SAC</label>
                  <input
                    id="exp-sac"
                    type="text"
                    className={`${FIELD} font-mono`}
                    value={fields.sac}
                    onChange={(e) => set({ sac: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder={category.sac || '998311'}
                  />
                </div>
              </div>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition ${
                  fields.itcEligible
                    ? 'border-mint-300 bg-mint-50/60'
                    : 'border-ink-200 bg-white hover:border-ink-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-mint-600"
                  checked={fields.itcEligible}
                  onChange={(e) => set({ itcEligible: e.target.checked })}
                />
                <span>
                  <span className="block text-xs font-bold text-ink-900">
                    Input tax credit claimable
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink-500">
                    Counts this bill&rsquo;s GST toward your claimable ITC total. Needs a valid tax
                    invoice from a registered vendor.
                  </span>
                </span>
              </label>
            </div>
            )}

            {/* Payment */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="exp-method">Paid via</label>
                <select
                  id="exp-method"
                  className={FIELD}
                  value={fields.paymentMethod}
                  onChange={(e) => set({ paymentMethod: e.target.value })}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className={LABEL}>Payment status</span>
                <div className="inline-flex w-full rounded-lg bg-ink-100/70 p-0.5">
                  {[
                    { id: 'PAID', label: 'Paid' },
                    { id: 'PENDING', label: 'Unpaid' },
                  ].map((s) => (
                    <label
                      key={s.id}
                      className={`focus-ring flex-1 cursor-pointer rounded-md px-3 py-1.5 text-center text-[11px] font-bold transition ${
                        fields.paymentStatus === s.id
                          ? s.id === 'PAID'
                            ? 'bg-mint-600 text-white shadow-sm-soft'
                            : 'bg-amber-500 text-white shadow-sm-soft'
                          : 'text-ink-500 hover:text-ink-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentStatus"
                        className="sr-only"
                        checked={fields.paymentStatus === s.id}
                        onChange={() => set({ paymentStatus: s.id })}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Reference + recurring */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="exp-bill">Bill / reference no.</label>
                <input
                  id="exp-bill"
                  type="text"
                  className={FIELD}
                  value={fields.billNo}
                  onChange={(e) => set({ billNo: e.target.value })}
                  placeholder="e.g. INV-99213"
                />
              </div>
              <div>
                <span className={LABEL}>Recurring</span>
                <div className="flex gap-2">
                  <label
                    className={`focus-ring flex flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-[11px] font-bold transition ${
                      fields.isRecurring
                        ? 'border-brand-400 bg-brand-50/60 text-brand-700'
                        : 'border-ink-200 text-ink-500 hover:border-ink-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 cursor-pointer accent-brand-600"
                      checked={fields.isRecurring}
                      onChange={(e) => set({ isRecurring: e.target.checked })}
                    />
                    <Icon name="repeat" className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Repeats
                  </label>
                  {fields.isRecurring && (
                    <select
                      aria-label="Recurring cycle"
                      className={`${FIELD} w-32`}
                      value={fields.recurringCycle}
                      onChange={(e) => set({ recurringCycle: e.target.value })}
                    >
                      {RECURRING_CYCLES.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={LABEL} htmlFor="exp-notes">Notes</label>
              <textarea
                id="exp-notes"
                rows="2"
                className={FIELD}
                value={fields.notes}
                onChange={(e) => set({ notes: e.target.value })}
                placeholder="Anything your accountant should know"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
              >
                <Icon name="info" className="mt-px h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-5 py-4 sm:px-6">
          <div className="hidden xs:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Total</p>
            <p className="tnum text-base font-extrabold text-ink-900">{formatINR(totals.grandTotal)}</p>
          </div>
          <div className="flex flex-1 gap-2 xs:flex-none">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring flex-1 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-ink-600 transition hover:bg-ink-50 xs:flex-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="expense-form"
              disabled={saving}
              className="focus-ring flex-1 rounded-xl bg-ink-900 px-5 py-2.5 text-xs font-bold text-white shadow-lift transition hover:bg-ink-800 disabled:opacity-60 xs:flex-none"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
