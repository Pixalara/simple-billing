import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

/* =============================================================================
 * ModuleNav — switches between the three peer modules.
 * =============================================================================
 * Dashboard, Expenses and Analytics are siblings, not a drill-down, so a back
 * arrow was the wrong model: it implied a linear path and forced a detour
 * through the dashboard to reach a sibling. This shows all three at once and
 * marks the current one, so location is obvious and every jump is one tap.
 *
 * Used identically in all three page headers.
 * ========================================================================== */

const MODULES = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'grid' },
  { id: 'expenses', label: 'Expenses', to: '/expenses', icon: 'wallet' },
  { id: 'analytics', label: 'Analytics', to: '/analytics', icon: 'pie' },
]

export default function ModuleNav({ current, className = '' }) {
  const navigate = useNavigate()

  return (
    <nav
      aria-label="Modules"
      className={`no-scrollbar -mx-1 flex shrink-0 items-center gap-1 overflow-x-auto rounded-xl bg-gray-100/80 p-1 px-1 sm:mx-0 ${className}`}
    >
      {MODULES.map((m) => {
        const active = m.id === current
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => !active && navigate(m.to)}
            aria-current={active ? 'page' : undefined}
            title={m.label}
            className={`focus-ring inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-bold transition-all duration-200 sm:px-3 ${
              active
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-900/[0.06] cursor-default'
                : 'text-gray-500 hover:bg-white/70 hover:text-gray-900 active:scale-95'
            }`}
          >
            <Icon name={m.icon} className="h-4 w-4 shrink-0" strokeWidth={active ? 2.2 : 1.9} />
            {/* Labels hide on the narrowest phones so three items still fit. */}
            <span className="hidden xs:inline">{m.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
