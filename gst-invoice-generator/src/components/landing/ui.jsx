import { useReveal } from './useReveal'

/* =============================================================================
 * Shared landing-page primitives: layout, buttons, icons, reveal wrapper.
 * One source of truth so spacing, radii and stroke weights stay consistent.
 * ========================================================================== */

export function Container({ as = 'div', wide = false, className = '', children }) {
  const Tag = as
  return (
    <Tag
      className={`mx-auto w-full px-5 sm:px-6 lg:px-8 ${
        wide ? 'max-w-container-wide' : 'max-w-container'
      } ${className}`}
    >
      {children}
    </Tag>
  )
}

/** Small uppercase label above a heading. */
export function Eyebrow({ children, tone = 'brand', className = '' }) {
  const tones = {
    brand: 'text-brand-600 bg-brand-50 ring-brand-100',
    mint: 'text-mint-700 bg-mint-50 ring-mint-100',
    light: 'text-brand-200 bg-white/10 ring-white/15',
  }
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-eyebrow uppercase ring-1 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  eyebrowTone = 'brand',
  title,
  body,
  align = 'center',
  light = false,
  className = '',
}) {
  const alignment = align === 'center' ? 'text-center mx-auto items-center' : 'text-left items-start'
  return (
    <div className={`flex flex-col ${alignment} ${align === 'center' ? 'max-w-prose-mid' : ''} ${className}`}>
      {eyebrow && <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>}
      <h2
        className={`mt-4 text-display-lg font-display text-balance ${
          light ? 'text-white' : 'text-ink-900'
        }`}
      >
        {title}
      </h2>
      {body && (
        <p
          className={`mt-4 text-body-lg ${
            light ? 'text-ink-300' : 'text-ink-500'
          } ${align === 'center' ? 'max-w-prose-tight' : 'max-w-prose-mid'}`}
        >
          {body}
        </p>
      )}
    </div>
  )
}

/* --- Buttons ------------------------------------------------------------- */
const BUTTON_BASE =
  'focus-ring inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out-expo active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none whitespace-nowrap'

const BUTTON_SIZES = {
  sm: 'h-10 px-4 text-body-sm rounded-lg',
  md: 'h-12 px-5 text-body rounded-xl',
  lg: 'h-14 px-7 text-body-lg rounded-xl',
}

const BUTTON_VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-lift hover:bg-brand-700 hover:shadow-float hover:-translate-y-0.5',
  secondary:
    'bg-white text-ink-800 ring-1 ring-ink-200 shadow-sm-soft hover:ring-ink-300 hover:shadow-soft hover:-translate-y-0.5',
  ghost: 'text-ink-600 hover:text-ink-900 hover:bg-ink-50',
  light:
    'bg-white text-ink-900 shadow-lift hover:shadow-float hover:-translate-y-0.5',
  outlineLight:
    'text-white ring-1 ring-white/25 hover:bg-white/10 hover:ring-white/40',
}

export function Button({
  as = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const Tag = as
  return (
    <Tag
      className={`${BUTTON_BASE} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** "Coming soon" / "Live" status chip. */
export function StatusChip({ status, label, className = '' }) {
  if (status === 'live') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-2.5 py-1 text-micro font-bold text-mint-700 ring-1 ring-mint-200 ${className}`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-mint-500 animate-pulse-ring" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint-600" />
        </span>
        {label || 'Available now'}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-micro font-bold text-amber-700 ring-1 ring-amber-200 ${className}`}
    >
      <Icon name="clock" className="h-3 w-3" />
      {label || 'Coming soon'}
    </span>
  )
}

export function Stars({ rating = 5, size = 'sm', className = '' }) {
  const dim = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`${dim} ${i <= rating ? 'text-amber-400' : 'text-ink-200'}`}
          fill="currentColor"
        >
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
        </svg>
      ))}
    </span>
  )
}

/** Wraps children in a staggered reveal. `delay` is in milliseconds. */
export function Reveal({ as = 'div', delay = 0, className = '', children, ...rest }) {
  const Tag = as
  const [ref, visible] = useReveal()
  return (
    <Tag
      ref={ref}
      style={{ '--reveal-delay': `${delay}ms` }}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* --- Icons --------------------------------------------------------------
 * 24x24 grid, 1.75 stroke, round caps. Consistent optical weight matters
 * more than variety here.
 */
const PATHS = {
  receipt: <><path d="M5 3h14a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" /><path d="M9 8h6M9 12h6" /></>,
  sparkles: <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" /><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" /></>,
  palette: <><circle cx="12" cy="12" r="9" /><circle cx="9" cy="9.5" r="1.2" /><circle cx="15" cy="9.5" r="1.2" /><circle cx="9.5" cy="15" r="1.2" /></>,
  users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7.5" r="3.5" /><path d="M16.5 4.2a3.5 3.5 0 0 1 0 6.6" /><path d="M18 20v-1.5a4 4 0 0 0-2-3.4" /></>,
  chart: <><path d="M4 20h16" /><path d="M7 20v-6M12 20V6M17 20v-9" /></>,
  sheet: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 9h16M9 9v12M4 15h16" /></>,
  copies: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  download: <><path d="M12 3v12" /><path d="M7.5 10.5L12 15l4.5-4.5" /><path d="M4 20h16" /></>,
  share: <><circle cx="17.5" cy="6" r="2.5" /><circle cx="6.5" cy="12" r="2.5" /><circle cx="17.5" cy="18" r="2.5" /><path d="M8.8 10.8l6.4-3.6M8.8 13.2l6.4 3.6" /></>,
  whatsapp: <><path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5Z" /><path d="M9.2 9c0 3 2.3 5.3 5.3 5.3.5 0 .9-.4.9-.9v-.7l-1.7-.6-.8.8a5 5 0 0 1-2.3-2.3l.8-.8-.6-1.7h-.7c-.5 0-.9.4-.9.9Z" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6 8.5-6" /></>,
  sms: <><path d="M20 14a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8Z" /><path d="M8.5 10h.01M12 10h.01M15.5 10h.01" /></>,
  bell: <><path d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 15Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  check: <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  arrowRight: <><path d="M4 12h15" /><path d="M13.5 6.5L20 12l-6.5 5.5" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  shield: <><path d="M12 3l7.5 3v6c0 4.2-3 7.6-7.5 9-4.5-1.4-7.5-4.8-7.5-9V6L12 3Z" /><path d="M9 12l2 2 4-4" /></>,
  zap: <path d="M13.5 3L6 13.5h4.5L10.5 21 18 10.5h-4.5L13.5 3Z" />,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5s-1.2 6.2-3.4 8.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5Z" /></>,
}

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.75 }) {
  const path = PATHS[name]
  if (!path) return null
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  )
}

/** Soft square icon container used on feature cards. */
export function IconTile({ name, tone = 'brand', className = '' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 ring-brand-100',
    mint: 'bg-mint-50 text-mint-600 ring-mint-100',
    ink: 'bg-ink-100 text-ink-700 ring-ink-200',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  }
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone]} ${className}`}
    >
      <Icon name={name} className="h-5 w-5" />
    </span>
  )
}
