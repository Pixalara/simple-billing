import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Container, Icon } from './ui'
import { NAV_LINKS } from '../../data/landingContent'

export default function Nav() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll and wire Escape while the drawer is open.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const goSignup = () => {
    setOpen(false)
    navigate('/login', { state: { initialView: 'SIGNUP' } })
  }

  return (
    <>
      {/* Skip link: first stop for keyboard and screen reader users. */}
      <a
        href="#main"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-body-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out-expo ${
          scrolled
            ? 'border-b border-ink-100/80 bg-white/85 backdrop-blur-xl shadow-sm-soft'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <Container wide>
          <div className="flex h-16 items-center justify-between gap-4 lg:h-18">
            {/* Brand */}
            <Link
              to="/"
              className="focus-ring flex items-center gap-2.5 shrink-0"
              aria-label="Pixalara Smart Billing, home"
            >
              <img
                src="/logo.png"
                alt=""
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span className="flex flex-col leading-none">
                <span className="text-[13px] font-bold tracking-tight text-brand-600">
                  Pixalara
                </span>
                <span className="text-[15px] font-bold tracking-tight text-ink-900">
                  Smart Billing
                </span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="focus-ring rounded-lg px-3.5 py-2 text-body-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Desktop actions */}
            <div className="hidden items-center gap-2 lg:flex">
              <Button as={Link} to="/login" variant="ghost" size="sm">
                Log in
              </Button>
              <Button onClick={goSignup} variant="primary" size="sm">
                Start free
                <Icon name="arrowRight" className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile trigger */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 ring-1 ring-ink-200 bg-white/70 lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-drawer"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
          </div>
        </Container>
      </header>

      {/* --- Mobile drawer --- */}
      {/* `inert` (React 19) takes the closed drawer out of the tab order and the
          accessibility tree, which aria-hidden alone does not do. */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink-950/45 backdrop-blur-sm transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-white shadow-hero transition-transform duration-300 ease-out-expo ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-ink-100 px-5">
            <span className="text-body font-bold text-ink-900">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 ring-1 ring-ink-200"
              aria-label="Close menu"
            >
              <Icon name="x" className="h-4.5 w-4.5" />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="focus-ring flex items-center justify-between rounded-xl px-3.5 py-3.5 text-body-lg font-semibold text-ink-800 transition-colors hover:bg-ink-50"
                  >
                    {link.label}
                    <Icon name="arrowRight" className="h-4 w-4 text-ink-300" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-2.5 border-t border-ink-100 p-5">
            <Button onClick={goSignup} variant="primary" size="lg" className="w-full">
              Start free
            </Button>
            <Button
              as={Link}
              to="/login"
              onClick={() => setOpen(false)}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Log in
            </Button>
            <p className="pt-1 text-center text-micro text-ink-400">
              No card required. Free plan available.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
