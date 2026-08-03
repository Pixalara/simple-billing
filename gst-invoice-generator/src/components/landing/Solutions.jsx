import { useRef, useState } from 'react'
import { Container, Icon, Reveal, SectionHeading } from './ui'
import { SEGMENTS } from '../../data/landingContent'

/* Seller is in Karnataka, so the demo mirrors the app's real routing rule:
 * same state -> CGST + SGST, different state -> IGST, export -> zero-rated. */
const SELLER_STATE = 'Karnataka'
const BUYER_STATES = [
  { id: 'Karnataka', label: 'Karnataka', note: 'Same state' },
  { id: 'Maharashtra', label: 'Maharashtra', note: 'Other state' },
  { id: 'Export', label: 'Outside India', note: 'Export' },
]

function TaxDemo() {
  const [buyerState, setBuyerState] = useState('Karnataka')
  const [items, setItems] = useState([
    { id: 1, name: 'Web design & development', qty: 1, rate: 15000 },
    { id: 2, name: 'Marketing retainer', qty: 1, rate: 22000 },
  ])

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.rate, 0)
  const isExport = buyerState === 'Export'
  const isInterState = !isExport && buyerState !== SELLER_STATE
  const taxable = subtotal
  const rate = 0.18
  const igst = isInterState ? taxable * rate : 0
  const cgst = !isExport && !isInterState ? (taxable * rate) / 2 : 0
  const sgst = cgst
  const total = taxable + igst + cgst + sgst

  const inr = (n) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const setQty = (id, delta) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
    )

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-float ring-1 ring-ink-900/[0.06]">
      <div className="flex flex-col gap-1 border-b border-ink-100 bg-ink-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-body-sm font-bold text-ink-900">Try the tax routing</p>
          <p className="text-micro text-ink-500">
            You are billing from {SELLER_STATE}. Change the buyer to see the heads switch.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-micro font-bold text-brand-600 ring-1 ring-brand-100">
          <Icon name="zap" className="h-3.5 w-3.5" />
          Live
        </span>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* Left: inputs */}
        <div>
          <fieldset>
            <legend className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
              Where is your customer?
            </legend>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {BUYER_STATES.map((s) => {
                const active = buyerState === s.id
                return (
                  <label
                    key={s.id}
                    className={`focus-ring cursor-pointer rounded-xl border-2 p-2.5 text-center transition-all ${
                      active
                        ? 'border-brand-500 bg-brand-50/60 shadow-ring-brand'
                        : 'border-ink-200 bg-white hover:border-ink-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="demo-buyer-state"
                      value={s.id}
                      checked={active}
                      onChange={() => setBuyerState(s.id)}
                      className="sr-only"
                    />
                    <span
                      className={`block text-[11px] font-bold ${
                        active ? 'text-brand-700' : 'text-ink-700'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="mt-0.5 block text-[9px] text-ink-400">{s.note}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
              Line items
            </p>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-ink-50/70 px-3 py-2.5 ring-1 ring-ink-100"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-ink-800">{item.name}</p>
                  <p className="tnum text-[10px] text-ink-400">₹{inr(item.rate)} each</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQty(item.id, -1)}
                    className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink-600 ring-1 ring-ink-200 transition hover:text-ink-900 hover:ring-ink-300"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <span className="tnum w-6 text-center text-[11px] font-bold text-ink-900">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(item.id, 1)}
                    className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink-600 ring-1 ring-ink-200 transition hover:text-ink-900 hover:ring-ink-300"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: computed totals */}
        <div className="rounded-2xl bg-ink-900 p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
            Calculated
          </p>
          <dl className="mt-3 space-y-2" aria-live="polite">
            <div className="flex justify-between text-[11px]">
              <dt className="text-ink-300">Taxable value</dt>
              <dd className="tnum font-semibold">₹{inr(taxable)}</dd>
            </div>

            {isExport ? (
              <div className="flex justify-between text-[11px]">
                <dt className="text-ink-300">Zero-rated</dt>
                <dd className="tnum font-semibold text-mint-300">₹0.00</dd>
              </div>
            ) : isInterState ? (
              <div className="flex justify-between text-[11px]">
                <dt className="text-ink-300">IGST (18%)</dt>
                <dd className="tnum font-semibold text-mint-300">₹{inr(igst)}</dd>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-[11px]">
                  <dt className="text-ink-300">CGST (9%)</dt>
                  <dd className="tnum font-semibold text-mint-300">₹{inr(cgst)}</dd>
                </div>
                <div className="flex justify-between text-[11px]">
                  <dt className="text-ink-300">SGST (9%)</dt>
                  <dd className="tnum font-semibold text-mint-300">₹{inr(sgst)}</dd>
                </div>
              </>
            )}

            <div className="flex items-baseline justify-between border-t border-white/15 pt-3">
              <dt className="text-[10px] font-bold uppercase tracking-wide">Total</dt>
              <dd className="tnum text-display-sm font-extrabold">₹{inr(total)}</dd>
            </div>
          </dl>

          <p className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-[10px] leading-relaxed text-ink-300">
            {isExport
              ? 'Exports are zero-rated. No GST is charged on the invoice.'
              : isInterState
                ? 'Different states, so this is an inter-state supply and IGST applies.'
                : 'Same state, so the tax splits equally into CGST and SGST.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Solutions() {
  const [active, setActive] = useState(SEGMENTS[0].id)
  const tabRefs = useRef([])
  const segment = SEGMENTS.find((s) => s.id === active)

  // Roving-focus arrow key navigation, per the ARIA tabs pattern.
  const onKeyDown = (e) => {
    const i = SEGMENTS.findIndex((s) => s.id === active)
    let next = null
    if (e.key === 'ArrowRight') next = (i + 1) % SEGMENTS.length
    if (e.key === 'ArrowLeft') next = (i - 1 + SEGMENTS.length) % SEGMENTS.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = SEGMENTS.length - 1
    if (next === null) return
    e.preventDefault()
    setActive(SEGMENTS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <section id="solutions" className="scroll-mt-24 bg-white py-20 lg:py-26">
      <Container wide>
        <Reveal>
          <SectionHeading
            eyebrow="Built for your model"
            title="One tool, three ways of billing"
            body="Subscriptions, project work and over-the-counter sales need different documents. Pick your model and the product adapts, rather than making you work around it."
          />
        </Reveal>

        {/* Tabs */}
        <Reveal delay={80} className="mt-10">
          <div
            role="tablist"
            aria-label="Business model"
            onKeyDown={onKeyDown}
            className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-2xl bg-ink-100/70 p-1.5"
          >
            {SEGMENTS.map((s, i) => {
              const selected = s.id === active
              return (
                <button
                  key={s.id}
                  ref={(el) => (tabRefs.current[i] = el)}
                  role="tab"
                  id={`tab-${s.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${s.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(s.id)}
                  className={`focus-ring rounded-xl px-4 py-2.5 text-body-sm font-bold transition-all duration-200 ease-out-expo ${
                    selected
                      ? 'bg-white text-ink-900 shadow-soft'
                      : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  {s.tab}
                </button>
              )
            })}
          </div>
        </Reveal>

        {/* Panel */}
        <div
          role="tabpanel"
          id={`panel-${segment.id}`}
          aria-labelledby={`tab-${segment.id}`}
          tabIndex={0}
          className="focus-ring mt-12 grid animate-fade items-start gap-10 lg:grid-cols-2 lg:gap-14"
          key={segment.id}
        >
          <div>
            <h3 className="text-display-md font-display text-ink-900">{segment.title}</h3>
            <p className="mt-4 text-body-lg text-ink-600">{segment.body}</p>
            <ul className="mt-7 space-y-3.5">
              {segment.points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-100 text-mint-700">
                    <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-body text-ink-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <TaxDemo />
        </div>
      </Container>
    </section>
  )
}
