/* =============================================================================
 * LANDING PAGE CONTENT
 * =============================================================================
 * Copy lives here so the section components stay presentational.
 *
 * HONESTY RULE: anything not shipped yet carries `status: 'soon'` and renders
 * with a visible "Coming soon" chip. Do not promote a capability to shipped
 * until it actually works in the product.
 * ========================================================================== */

export const NAV_LINKS = [
  { label: 'Solutions', href: '#solutions' },
  { label: 'Features', href: '#features' },
  { label: 'Delivery', href: '#delivery' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faqs' },
]

export const HERO_ROTATION = [
  'GST-compliant invoices',
  'payment receipts',
  'service billing',
  'subscription receipts',
]

/* --- Trust bar ---------------------------------------------------------- */
export const TRUST_POINTS = [
  { label: 'DPIIT recognised', detail: 'Govt. of India' },
  { label: 'CGST / SGST / IGST', detail: 'Auto-routed by state' },
  { label: 'HSN & SAC', detail: 'Built-in code search' },
  { label: 'Encrypted', detail: 'In transit and at rest' },
]

/* --- Who it's for ------------------------------------------------------- */
export const SEGMENTS = [
  {
    id: 'saas',
    tab: 'SaaS & Subscriptions',
    title: 'Receipts for every renewal, without the spreadsheet',
    body: 'Save a plan once with its price, duration and billing cycle. Issuing the next receipt becomes two fields and a save. Multi-currency for overseas customers, with amounts in words that read correctly.',
    points: [
      'Plan name, duration and billing cycle on every receipt',
      'Six currencies with the right symbol and wording',
      'Saved plan defaults to prefill new receipts',
      'Payment method and transaction reference captured',
    ],
  },
  {
    id: 'services',
    tab: 'Agencies & Services',
    title: 'Bill work that changes every month',
    body: "Web design, marketing retainers, consulting — the scope moves per client. Service billing is free text by design, so you describe exactly what was agreed. No plan, no duration, no fields that don't apply.",
    points: [
      'Free-text scope of work, line breaks preserved on the PDF',
      'Optional service period for retainers',
      'SAC codes instead of HSN, correctly labelled',
      'Multiple line items at different GST slabs',
    ],
  },
  {
    id: 'retail',
    tab: 'Retail & Trading',
    title: 'Counter-speed billing with the tax heads right',
    body: 'Search an HSN code and the rate fills itself in. Buyer state decides CGST/SGST versus IGST automatically. Original, duplicate and triplicate copies in one action for goods that move.',
    points: [
      'HSN search across common goods categories',
      'Automatic intra-state vs inter-state tax routing',
      'Original / duplicate / triplicate copies',
      'Works properly on a phone at the counter',
    ],
  },
]

/* --- Core features ------------------------------------------------------ */
export const FEATURES = [
  {
    icon: 'receipt',
    title: 'GST invoices that hold up',
    body: 'CGST, SGST and IGST routed from the buyer’s state. HSN for goods, SAC for services. Amounts in words in the Indian lakh-crore system.',
    status: 'live',
  },
  {
    icon: 'sparkles',
    title: 'Two billing modes',
    body: 'SaaS subscriptions carry a plan and cycle. Services are free text with no plan fields at all. The form changes to match the work.',
    status: 'live',
  },
  {
    icon: 'palette',
    title: 'Your brand on the document',
    body: 'Logo, accent colour, signature, stamp and custom terms. Five themes. The PDF is the one your customer keeps.',
    status: 'live',
  },
  {
    icon: 'users',
    title: 'Customer and item records',
    body: 'Save customers and products once, pick them from a dropdown after. Stops the copy-paste mistakes in billing addresses.',
    status: 'live',
  },
  {
    icon: 'chart',
    title: 'Collections at a glance',
    body: 'Invoiced value, receipts collected, tax collected and monthly trend. Pending, paid and overdue in one view.',
    status: 'live',
  },
  {
    icon: 'sheet',
    title: 'Excel export for your CA',
    body: 'A GSTR-shaped sheet with taxable value and tax split per invoice. Hand it over at quarter end instead of rebuilding it.',
    status: 'live',
  },
  {
    icon: 'copies',
    title: 'Triplicate copies',
    body: 'Original for recipient, duplicate for transporter, triplicate for supplier — each labelled correctly, generated together.',
    status: 'live',
  },
  {
    icon: 'lock',
    title: 'Encrypted cloud storage',
    body: 'Your data is encrypted in transit and at rest, scoped to your account. Sign in from any device and it is there.',
    status: 'live',
  },
]

/* --- Delivery channels --------------------------------------------------
 * `status: 'live'`  → works in the product today
 * `status: 'soon'`  → NOT built yet, renders a visible "Coming soon" chip
 */
export const DELIVERY_CHANNELS = [
  {
    id: 'download',
    icon: 'download',
    name: 'PDF download',
    status: 'live',
    tagline: 'Available now',
    body: 'A print-ready A4 PDF at 2× resolution, named after the customer and document number so your folders stay sorted.',
  },
  {
    id: 'share',
    icon: 'share',
    name: 'Share sheet',
    status: 'live',
    tagline: 'Available now',
    body: 'On mobile, hand the PDF straight to your phone’s share sheet — WhatsApp, Drive, Telegram, anywhere it can go.',
  },
  {
    id: 'whatsapp',
    icon: 'whatsapp',
    name: 'WhatsApp send',
    status: 'soon',
    tagline: 'Coming soon',
    body: 'Send the invoice to a saved customer number with a prefilled message, straight from the invoice screen. No share sheet detour.',
  },
  {
    id: 'email',
    icon: 'mail',
    name: 'Email delivery',
    status: 'soon',
    tagline: 'Coming soon',
    body: 'Email the PDF to your customer as a real attachment, from your business address, with delivery status on the invoice.',
  },
  {
    id: 'sms',
    icon: 'sms',
    name: 'SMS notification',
    status: 'soon',
    tagline: 'Coming soon',
    body: 'A short SMS with the amount, due date and a secure link to the invoice — for customers who do not use WhatsApp.',
  },
  {
    id: 'reminders',
    icon: 'bell',
    name: 'Payment reminders',
    status: 'soon',
    tagline: 'Coming soon',
    body: 'Automatic nudges on overdue invoices across WhatsApp and email, so you stop chasing payments by hand.',
  },
]

/* --- Pricing ------------------------------------------------------------
 * Prices confirmed accurate by the business owner.
 * `soon: true` on a line marks a plan benefit that is not shipped yet.
 */
export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For freelancers and sole proprietors starting with local billing.',
    price: '0',
    priceNote: '/ month, paid yearly',
    cta: 'Get started free',
    variant: 'secondary',
    features: [
      { label: '5 invoices per month', included: true },
      { label: 'Standard invoice templates', included: true },
      { label: 'Manual GST routing', included: true },
      { label: 'Customer & product records', included: true },
      { label: 'Custom branding & themes', included: false },
      { label: 'Unlimited users', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Pro Growth',
    description: 'For growing businesses that bill every day and need it to look right.',
    price: '199',
    priceNote: '/ month, paid yearly',
    cta: 'Start Pro Growth',
    variant: 'primary',
    featured: true,
    badge: 'Most popular',
    features: [
      { label: 'Unlimited invoices & receipts', included: true },
      { label: 'Full branding: logo, signature, stamp', included: true },
      { label: 'Automatic GST routing by state', included: true },
      { label: 'SaaS & service billing modes', included: true },
      { label: 'Excel export for your accountant', included: true },
      { label: 'WhatsApp, email & SMS delivery', included: true, soon: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For larger organisations needing custom reporting and integrations.',
    price: 'Custom',
    isCustomPrice: true,
    cta: 'Talk to us',
    variant: 'secondary',
    features: [
      { label: 'Everything in Pro Growth', included: true },
      { label: 'Dedicated account manager', included: true },
      { label: 'Custom SLAs', included: true },
      { label: 'Multi-organisation ledgers', included: true, soon: true },
      { label: 'E-Way bills & API access', included: true, soon: true },
    ],
  },
]

/* --- FAQ ---------------------------------------------------------------- */
export const FAQS = [
  {
    q: 'Are the invoices actually GST compliant?',
    a: 'Yes. Invoices carry your GSTIN and your customer’s, HSN codes for goods or SAC codes for services, and the tax split as CGST/SGST for intra-state supplies or IGST for inter-state. Set your business state in your profile so the routing is correct — that field decides which tax heads apply.',
  },
  {
    q: 'How does the SaaS versus service billing difference work?',
    a: 'Pick one when you create the document. SaaS carries a plan name, duration and billing cycle, which print on the receipt. Service billing removes those entirely and gives you a free-text scope of work plus an optional service period, because agency and consulting work changes per client. Saved items remember which they are, so the right fields appear automatically.',
  },
  {
    q: 'Can I bill without charging GST?',
    a: 'Yes. Switch the invoice to without-GST mode and the tax columns, HSN fields and GST rates come off the document rather than printing as zeros. Useful if you are below the registration threshold or billing an exempt supply.',
  },
  {
    q: 'Do you support customers outside India?',
    a: 'Receipts support Indian Rupee, US Dollar, Euro, British Pound, Canadian Dollar and Australian Dollar, with the correct symbol on the document. Note that the amount-in-words line currently reads correctly for INR and USD.',
  },
  {
    q: 'Can I send invoices on WhatsApp or by email?',
    a: 'Today you can download the PDF, and on a mobile device you can pass it to your phone’s share sheet, which includes WhatsApp. Direct WhatsApp send, email delivery as a real attachment, and SMS notifications are in build and marked "coming soon" on this page. We would rather show you what works now than claim otherwise.',
  },
  {
    q: 'What happens to my data?',
    a: 'It is stored encrypted in transit and at rest, scoped to your account, and reachable from any device you sign in on. We do not sell it and we do not share it with third parties.',
  },
  {
    q: 'Is there a contract or a setup fee?',
    a: 'No setup fee, no demo call and no salesperson. Starter is free forever within its limits. Paid plans are billed yearly and you can stop at the end of a term.',
  },
  {
    q: 'Will my accountant be able to work with this?',
    a: 'Yes. Invoice numbering runs in sequence, every document is retained with its stored tax figures, and the Excel export gives a per-invoice sheet with taxable value alongside the IGST, CGST and SGST split for filing.',
  },
]

export const FOOTER_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Solutions', href: '#solutions' },
      { label: 'Features', href: '#features' },
      { label: 'Delivery', href: '#delivery' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    heading: 'Built for',
    links: [
      { label: 'SaaS & subscriptions', href: '#solutions' },
      { label: 'Agencies & services', href: '#solutions' },
      { label: 'Retail & trading', href: '#solutions' },
      { label: 'Freelancers', href: '#reviews' },
    ],
  },
  {
    heading: 'Compliance',
    links: [
      { label: 'GST tax routing', href: '#features' },
      { label: 'HSN & SAC codes', href: '#features' },
      { label: 'Triplicate copies', href: '#features' },
      { label: 'Excel export', href: '#features' },
    ],
  },
]
