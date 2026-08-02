import { BILLING_KIND_OPTIONS, normalizeBillingKind } from '../constants'

/**
 * Segmented radio group that picks how a document is billed:
 * a SaaS subscription (plan + duration + cycle) or a Service (no plan/duration).
 *
 * Rendered as a real fieldset/legend with radio inputs so it is keyboard
 * operable and announced correctly by screen readers.
 */
export default function BillingKindSelector({
  value,
  onChange,
  name,
  legend = 'Billing Type',
  accent = '#2563eb',
  className = '',
}) {
  const selected = normalizeBillingKind(value)

  return (
    <fieldset className={`border border-gray-200 rounded-xl p-3 bg-gray-50 ${className}`}>
      <legend className="text-[10px] uppercase font-bold text-gray-500 tracking-widest px-1">
        {legend}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        {BILLING_KIND_OPTIONS.map((opt) => {
          const isActive = selected === opt.value
          const inputId = `${name}-${opt.value}`
          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              className={`cursor-pointer rounded-lg border-2 p-2.5 transition-all bg-white ${
                isActive ? 'shadow-sm' : 'border-gray-200 hover:border-gray-300'
              }`}
              style={isActive ? { borderColor: accent } : undefined}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  id={inputId}
                  name={name}
                  value={opt.value}
                  checked={isActive}
                  onChange={() => onChange(opt.value)}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: accent }}
                />
                <span
                  className="text-xs font-bold"
                  style={{ color: isActive ? accent : '#374151' }}
                >
                  {opt.label}
                </span>
              </span>
              <span className="block text-[10px] text-gray-500 font-medium mt-1 leading-snug pl-6">
                {opt.hint}
              </span>
              <span className="block text-[10px] text-gray-400 italic mt-0.5 leading-snug pl-6">
                {opt.example}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
