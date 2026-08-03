import { Link, useNavigate } from 'react-router-dom'
import { Button, Container, Icon, Reveal } from './ui'
import { FOOTER_COLUMNS } from '../../data/landingContent'

export default function Footer() {
  const navigate = useNavigate()
  const year = new Date().getFullYear()

  return (
    <>
      {/* --- Closing CTA --- */}
      <section className="relative overflow-hidden bg-ink-950 py-20 lg:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand-600/25 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[280px] w-[380px] rounded-full bg-mint-600/12 blur-[110px]" />
        </div>

        <Container className="relative">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-display-xl font-display text-white text-balance">
              Your next invoice could go out in a minute
            </h2>
            <p className="mx-auto mt-5 max-w-prose-tight text-body-lg text-ink-300">
              Free plan, no card, no onboarding call. Add your GSTIN and bank details and bill your
              first customer today.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 xs:flex-row">
              <Button
                size="lg"
                variant="light"
                onClick={() => navigate('/login', { state: { initialView: 'SIGNUP' } })}
              >
                Start billing free
                <Icon name="arrowRight" className="h-4.5 w-4.5" />
              </Button>
              <Button as={Link} to="/login" variant="outlineLight" size="lg">
                Log in
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-white/8 bg-ink-950 pb-8 pt-16">
        <Container wide>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
            {/* Brand */}
            <div className="max-w-sm">
              <Link to="/" className="focus-ring inline-flex items-center gap-2.5">
                <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
                <span className="flex flex-col leading-none">
                  <span className="text-[13px] font-bold tracking-tight text-brand-300">
                    Pixalara
                  </span>
                  <span className="text-[15px] font-bold tracking-tight text-white">
                    Smart Billing
                  </span>
                </span>
              </Link>
              <p className="mt-4 text-body-sm text-ink-400">
                GST billing, receipts and collections tracking for Indian businesses. Built by a
                DPIIT-recognised team.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-ink-300 ring-1 ring-white/10">
                  <Icon name="shield" className="h-3.5 w-3.5 text-mint-400" />
                  Encrypted storage
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-ink-300 ring-1 ring-white/10">
                  <Icon name="globe" className="h-3.5 w-3.5 text-brand-300" />
                  Made in India
                </span>
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_COLUMNS.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                  {col.heading}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="focus-ring text-body-sm text-ink-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-micro text-ink-500">
              &copy; {year} Pixalara Smart Billing. All rights reserved.
            </p>
            <p className="text-micro text-ink-500">
              Crafted by{' '}
              <a
                href="https://pixalara.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring font-semibold text-ink-300 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white hover:decoration-white/50"
              >
                Pixalara LLP
              </a>{' '}
              — a DPIIT-recognised technology company, Govt. of India
            </p>
          </div>
        </Container>
      </footer>
    </>
  )
}
