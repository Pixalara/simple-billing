/* =============================================================================
 * Icon set for the Expenses module.
 * 24x24 grid, 1.75 stroke, round caps — consistent optical weight throughout.
 * Kept separate from the marketing icon set so neither can break the other.
 * ========================================================================== */

const PATHS = {
  // Categories
  building: <><path d="M4 21V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v15" /><path d="M15 10h4a1 1 0 0 1 1 1v10" /><path d="M3 21h18" /><path d="M7.5 9h3M7.5 13h3M7.5 17h3" /></>,
  users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7.5" r="3.5" /><path d="M16.5 4.2a3.5 3.5 0 0 1 0 6.6" /><path d="M18 20v-1.5a4 4 0 0 0-2-3.4" /></>,
  userPlus: <><path d="M14 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" /><circle cx="8" cy="7.5" r="3.5" /><path d="M18 7v6M15 10h6" /></>,
  cloud: <><path d="M7 18h9.5a3.5 3.5 0 0 0 .3-6.98A5.5 5.5 0 0 0 6.5 10.2A3.9 3.9 0 0 0 7 18Z" /></>,
  megaphone: <><path d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1Z" /><path d="M17 9.5a3.5 3.5 0 0 1 0 5" /><path d="M19.5 7a7 7 0 0 1 0 10" /></>,
  bolt: <path d="M13.5 3L6 13.5h4.5L10.5 21 18 10.5h-4.5L13.5 3Z" />,
  plane: <path d="M10.5 20l1.5-5.5 7 2.5v-2l-5.5-4L15 4.5a1.2 1.2 0 0 0-2.2-.9L9.5 9.5 4 8v2l4.5 3-1 5.5 1.5.5Z" />,
  briefcase: <><rect x="3" y="7.5" width="18" height="12" rx="2" /><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" /><path d="M3 12h18" /></>,
  box: <><path d="M20 8.5L12 4.5 4 8.5v7L12 19.5l8-4v-7Z" /><path d="M4 8.5l8 4 8-4M12 12.5v7" /></>,
  monitor: <><rect x="3" y="4.5" width="18" height="12" rx="2" /><path d="M8.5 20h7M12 16.5V20" /></>,
  bank: <><path d="M3.5 9.5L12 4.5l8.5 5" /><path d="M5.5 9.5v9M18.5 9.5v9M9.5 12v6M14.5 12v6" /><path d="M3 19.5h18" /></>,
  receipt: <><path d="M6 3h12a1 1 0 0 1 1 1v17l-3.5-2-3.5 2-3.5-2L5 21V4a1 1 0 0 1 1-1Z" /><path d="M9 8h6M9 12h6" /></>,
  dots: <><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /></>,

  // UI
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10.5h18" /><circle cx="16.5" cy="14.5" r="1.2" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></>,
  filter: <path d="M4 6h16l-6 7v6l-4-2v-4L4 6Z" />,
  edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="M14.5 5.5l4 4" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13h10l1-13" /><path d="M10.5 11v6M13.5 11v6" /></>,
  trendUp: <><path d="M4 17l6-6 4 4 6-6" /><path d="M15 9h5v5" /></>,
  trendDown: <><path d="M4 7l6 6 4-4 6 6" /><path d="M15 15h5v-5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8.5 3.5v3M15.5 3.5v3" /></>,
  chart: <><path d="M4 20h16" /><path d="M7 20v-6M12 20V6M17 20v-9" /></>,
  download: <><path d="M12 3v12" /><path d="M7.5 10.5L12 15l4.5-4.5" /><path d="M4 20h16" /></>,
  repeat: <><path d="M17 3.5L20.5 7L17 10.5" /><path d="M20.5 7H8a4 4 0 0 0-4 4v1" /><path d="M7 20.5L3.5 17L7 13.5" /><path d="M3.5 17H16a4 4 0 0 0 4-4v-1" /></>,
  shield: <><path d="M12 3l7.5 3v6c0 4.2-3 7.6-7.5 9-4.5-1.4-7.5-4.8-7.5-9V6L12 3Z" /><path d="M9 12l2 2 4-4" /></>,
  arrowLeft: <><path d="M20 12H5" /><path d="M10.5 5.5L4 12l6.5 6.5" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.75v.5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  tag: <><path d="M4 11.5V5a1 1 0 0 1 1-1h6.5L20 12.5 12.5 20 4 11.5Z" /><circle cx="8" cy="8" r="1.3" /></>,
  // Circle plus two radii = a pie with a slice marked out. The previous version
  // used arc flags that only read correctly when filled; stroked, it collapsed
  // into a hook shape.
  pie: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5V12h8.5" /></>,
  scale: <><path d="M12 4v16M7 20h10" /><path d="M12 6.5L4.5 9M12 6.5L19.5 9" /><path d="M4.5 9L2.5 14a3 3 0 0 0 4 0L4.5 9Z" /><path d="M19.5 9L17.5 14a3 3 0 0 0 4 0L19.5 9Z" /></>,
  arrowUpRight: <><path d="M7 17L17 7" /><path d="M9 7h8v8" /></>,
  arrowDownRight: <><path d="M7 7l10 10" /><path d="M17 9v8H9" /></>,
}

export default function Icon({ name, className = 'w-5 h-5', strokeWidth = 1.75 }) {
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
