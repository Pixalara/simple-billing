/* =============================================================================
 * Currency conversion and money formatting.
 * =============================================================================
 * Single home for both, so the dashboard, the expenses module and analytics
 * can never report different numbers for the same data. The FX map used to be
 * inlined in three separate memos inside Dashboard.jsx, and the formatters
 * lived in expenses.js, which analytics has no business importing from.
 * ========================================================================== */

/**
 * Indicative FX used to express multi-currency receipts in INR for reporting.
 *
 * These are hardcoded. Currencies not listed are counted 1:1, so GBP, CAD and
 * AUD are currently UNDERSTATED. Replace with fetched rates before treating
 * any of these figures as more than a trend.
 */
export const FX_TO_INR = { INR: 1, USD: 83, EUR: 90 }

export const fxToInr = (currency) => FX_TO_INR[currency] ?? 1

/** True when a currency has no real rate and is being counted at parity. */
export const isUnratedCurrency = (currency) =>
  Boolean(currency) && currency !== 'INR' && FX_TO_INR[currency] === undefined

export const formatINR = (n, { decimals = 2 } = {}) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`

/** Compact form for KPI tiles: ₹1.2L, ₹3.4Cr. Keeps the sign for losses. */
export const formatCompactINR = (n) => {
  const v = Number(n) || 0
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`
  return `${sign}${formatINR(abs, { decimals: 0 })}`
}

export const formatPercent = (n, decimals = 1) =>
  `${(Number(n) || 0).toFixed(decimals)}%`
