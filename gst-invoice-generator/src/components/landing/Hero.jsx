import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Container, Icon, Reveal, Stars } from './ui'
import { HERO_ROTATION, TRUST_POINTS } from '../../data/landingContent'
import { reviewStats } from '../../data/testimonials'

/** Rotating headline word with a measured, non-jittery swap. */
function RotatingWord() {
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const cycle = setInterval(() => {
      setLeaving(true)
      setTimeout(() => {
        setIndex((i) => (i + 1) % HERO_ROTATION.length)
        setLeaving(false)
      }, 260)
    }, 2800)
    return () => clearInterval(cycle)
  }, [])

  return (
    <span className="relative inline-block align-bottom">
      <span
        className={`inline-block bg-gradient-to-r from-brand-600 via-brand-500 to-mint-500 bg-clip-text text-transparent transition-all duration-[260ms] ease-out-expo ${
          leaving ? 'translate-y-1.5 opacity-0 blur-[2px]' : 'translate-y-0 opacity-100 blur-0'
        }`}
      >
        {HERO_ROTATION[index]}
      </span>
      {/* Reserve the widest string so the layout never reflows mid-rotation. */}
      <span aria-hidden="true" className="pointer-events-none block h-0 overflow-hidden opacity-0">
        {HERO_ROTATION.reduce((a, b) => (a.length > b.length ? a : b))}
      </span>
    </span>
  )
}

/** Compact, believable invoice document used as the hero visual. */
function InvoiceMock() {
  const lines = [
    { desc: 'Web design & development', sac: '9983', qty: 1, rate: 15000 },
    { desc: 'Digital marketing retainer', sac: '9983', qty: 1, rate: 22000 },
    { desc: 'Hosting & maintenance', sac: '9983', qty: 3, rate: 1500 },
  ]
  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.rate, 0)
  const cgst = subtotal * 0.09
  const sgst = subtotal * 0.09
  const total = subtotal + cgst + sgst
  const inr = (n) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-hero ring-1 ring-ink-900/[0.06]">
      {/* Document accent band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 via-brand-500 to-mint-500" />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-[11px] font-bold text-white">
              PX
            </div>
            <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600">
              Tax Invoice
            </p>
            <p className="tnum text-micro font-semibold text-ink-400">#03082601</p>
          </div>
          <div className="text-right">
            <p className="text-body-sm font-bold text-ink-900">Pixalara LLP</p>
            <p className="text-[10px] leading-relaxed text-ink-400">
              KR Puram, Bengaluru
              <br />
              Karnataka — 560049
            </p>
            <p className="tnum mt-1 text-[10px] font-semibold text-ink-500">
              GSTIN: 29AAXXX1234X1ZX
            </p>
          </div>
        </div>

        <div className="my-4 h-px bg-ink-100" />

        {/* Parties */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-400">
              Billed to
            </p>
            <p className="mt-1 text-body-sm font-bold text-ink-900">Anand Traders</p>
            <p className="text-[10px] text-ink-400">Whitefield, Karnataka</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-400">
              Place of supply
            </p>
            <p className="mt-1 text-body-sm font-bold text-ink-900">Karnataka</p>
            <p className="text-[10px] font-semibold text-mint-600">Intra-state · CGST + SGST</p>
          </div>
        </div>

        {/* Line items */}
        <div className="mt-5 overflow-hidden rounded-xl ring-1 ring-ink-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-ink-900 text-white">
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.1em]">
                  Service
                </th>
                <th className="px-2 py-2 text-[9px] font-bold uppercase tracking-[0.1em]">SAC</th>
                <th className="px-2 py-2 text-right text-[9px] font-bold uppercase tracking-[0.1em]">
                  Qty
                </th>
                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-[0.1em]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {lines.map((l) => (
                <tr key={l.desc}>
                  <td className="px-3 py-2.5 text-[11px] font-semibold text-ink-800">{l.desc}</td>
                  <td className="tnum px-2 py-2.5 text-[10px] text-ink-400">{l.sac}</td>
                  <td className="tnum px-2 py-2.5 text-right text-[10px] text-ink-600">{l.qty}</td>
                  <td className="tnum px-3 py-2.5 text-right text-[11px] font-semibold text-ink-900">
                    ₹{inr(l.qty * l.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <dl className="w-full max-w-[220px] space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <dt className="text-ink-500">Taxable value</dt>
              <dd className="tnum font-semibold text-ink-700">₹{inr(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-[11px]">
              <dt className="text-ink-500">CGST (9%)</dt>
              <dd className="tnum font-semibold text-ink-700">₹{inr(cgst)}</dd>
            </div>
            <div className="flex justify-between text-[11px]">
              <dt className="text-ink-500">SGST (9%)</dt>
              <dd className="tnum font-semibold text-ink-700">₹{inr(sgst)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink-200 pt-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-900">
                Total
              </dt>
              <dd className="tnum text-body-lg font-extrabold text-brand-600">₹{inr(total)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-cream pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      {/* Background: soft grid, faded at the edges, plus two low-opacity glows. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-ink bg-grid-lg [mask-image:radial-gradient(ellipse_70%_55%_at_50%_35%,#000,transparent)]" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-brand-200/25 blur-[110px]" />
        <div className="absolute -bottom-52 -right-24 h-[420px] w-[520px] rounded-full bg-mint-200/25 blur-[110px]" />
      </div>

      <Container wide className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-14">
          {/* --- Copy --- */}
          <div className="max-w-2xl">
            <Reveal>
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white/80 py-1.5 pl-1.5 pr-3.5 shadow-sm-soft ring-1 ring-ink-900/[0.06] backdrop-blur">
                <span className="rounded-full bg-ink-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                  DPIIT
                </span>
                <span className="text-micro font-semibold text-ink-600">
                  Recognised by Govt. of India
                </span>
              </div>
            </Reveal>

            <Reveal delay={70}>
              <h1 className="mt-6 text-display-2xl font-display text-ink-950">
                Send <RotatingWord />
                <br className="hidden sm:block" /> in under a minute.
              </h1>
            </Reveal>

            <Reveal delay={140}>
              <p className="mt-6 max-w-xl text-body-lg text-ink-600">
                Billing software built for how Indian businesses actually invoice. Tax heads routed
                by state, HSN and SAC handled properly, and separate modes for subscriptions and
                service work — so the form always matches the job.
              </p>
            </Reveal>

            <Reveal delay={210}>
              <div className="mt-8 flex flex-col gap-3 xs:flex-row xs:items-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/login', { state: { initialView: 'SIGNUP' } })}
                >
                  Start billing free
                  <Icon name="arrowRight" className="h-4.5 w-4.5" />
                </Button>
                <Button as={Link} to="/login" variant="secondary" size="lg">
                  Log in
                </Button>
              </div>
            </Reveal>

            <Reveal delay={260}>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-micro font-medium text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="check" className="h-4 w-4 text-mint-600" strokeWidth={2.5} />
                  No card required
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="check" className="h-4 w-4 text-mint-600" strokeWidth={2.5} />
                  Free plan forever
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="check" className="h-4 w-4 text-mint-600" strokeWidth={2.5} />
                  No demo call
                </span>
              </div>
            </Reveal>

            {/* Rating summary */}
            <Reveal delay={320}>
              <div className="mt-8 flex items-center gap-3.5 border-t border-ink-200/70 pt-6">
                <Stars rating={5} size="md" />
                <p className="text-body-sm text-ink-600">
                  <span className="tnum font-bold text-ink-900">{reviewStats.average}</span> average
                  from{' '}
                  <a
                    href="#reviews"
                    className="focus-ring font-semibold text-brand-600 underline decoration-brand-200 decoration-2 underline-offset-2 hover:decoration-brand-400"
                  >
                    {reviewStats.count} reviews
                  </a>
                </p>
              </div>
            </Reveal>
          </div>

          {/* --- Visual --- */}
          <Reveal delay={180} className="relative lg:pl-4">
            {/* Depth: a tilted card behind the document. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-6 top-8 bottom-8 hidden rotate-[3deg] rounded-3xl bg-white/50 ring-1 ring-ink-900/[0.05] sm:block"
            />
            <div className="relative">
              <InvoiceMock />

              {/* Floating badge: tax routing */}
              <div className="absolute -left-3 top-1/3 hidden animate-rise rounded-xl bg-white p-3 shadow-float ring-1 ring-ink-900/[0.06] sm:block lg:-left-8">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-50 text-mint-600 ring-1 ring-mint-100">
                    <Icon name="shield" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold text-ink-900">Tax heads verified</p>
                    <p className="text-[9px] text-ink-400">CGST + SGST · same state</p>
                  </div>
                </div>
              </div>

              {/* Floating badge: generation speed */}
              <div className="absolute -right-3 bottom-14 hidden rounded-xl bg-ink-900 p-3 shadow-float sm:block lg:-right-7">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-mint-300">
                    <Icon name="zap" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold text-white">PDF ready</p>
                    <p className="tnum text-[9px] text-ink-300">Generated in 1.4s</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* --- Trust strip --- */}
        <Reveal delay={120} className="mt-16 lg:mt-20">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink-200/60 ring-1 ring-ink-200/60 tab:grid-cols-4">
            {TRUST_POINTS.map((point) => (
              <div key={point.label} className="bg-white/80 px-5 py-4 backdrop-blur">
                <dt className="text-body-sm font-bold text-ink-900">{point.label}</dt>
                <dd className="mt-0.5 text-micro text-ink-500">{point.detail}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  )
}
