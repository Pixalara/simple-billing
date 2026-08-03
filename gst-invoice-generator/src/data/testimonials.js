/* =============================================================================
 * CUSTOMER REVIEWS
 * =============================================================================
 *
 * ⚠️  IMPORTANT — READ BEFORE LAUNCH
 *
 * The entries below are DRAFT copy, written to match the shape, tone and length
 * distribution of genuine Google reviews. They are NOT real customer reviews and
 * no real person or registered company is named.
 *
 * Replace them with your actual Google / in-product reviews before this page is
 * promoted. Publishing invented testimonials as if they were real is deceptive
 * and, in India, is actionable under the Consumer Protection Act 2019 and the
 * CCPA's guidelines on fake reviews (and ASCI's advertising code).
 *
 * HOW TO SWAP IN REAL ONES
 *   1. Keep the object shape below.
 *   2. Set REVIEWS_ARE_PLACEHOLDER = false once every entry is genuine.
 *   3. Set `sourceUrl` on the section (see landingContent.js) to your Google
 *      Business Profile so visitors can verify independently.
 *
 * The section is designed to look strong at ~8 reviews, so you do not need 30
 * real ones before going live. Trim freely.
 *
 * FIELD REFERENCE
 *   name     first name + last initial (how Google displays most reviewers)
 *   role     job title
 *   business generic business descriptor, deliberately not a brand name
 *   city     city, for regional credibility
 *   segment  'saas' | 'services' | 'retail' | 'freelance'  (drives filtering)
 *   rating   1-5
 *   date     ISO date, used for sorting and display
 *   body     the review text
 *   pull     optional short excerpt used when the card is featured
 * ========================================================================== */

export const REVIEWS_ARE_PLACEHOLDER = true

export const REVIEW_SEGMENTS = [
  { id: 'all', label: 'All reviews' },
  { id: 'saas', label: 'SaaS & subscriptions' },
  { id: 'services', label: 'Agencies & services' },
  { id: 'retail', label: 'Retail & trading' },
  { id: 'freelance', label: 'Freelancers' },
]

export const testimonials = [
  {
    id: 1,
    name: 'Rahul M.',
    role: 'Founder',
    business: 'Digital marketing agency',
    city: 'Bengaluru',
    segment: 'services',
    rating: 5,
    date: '2026-06-18',
    pull: 'The service billing finally matches how we actually work.',
    body: "We bill retainers that change every single month, so template-locked tools were useless to us. Being able to type the scope of work directly on the invoice, with line breaks that survive into the PDF, is the thing that made me switch. Took about ten minutes to move our client list over.",
  },
  {
    id: 2,
    name: 'Sneha K.',
    role: 'Chartered Accountant',
    business: 'Independent tax practice',
    city: 'Pune',
    segment: 'freelance',
    rating: 5,
    date: '2026-05-29',
    pull: 'The CGST/SGST versus IGST split is handled correctly.',
    body: "I review invoices from about forty small businesses. Most cheap generators get the place-of-supply logic wrong and I end up correcting the tax heads at filing time. This one splits CGST/SGST and IGST based on the two states properly. That alone saves me a fortnight every quarter.",
  },
  {
    id: 3,
    name: 'Imran S.',
    role: 'Proprietor',
    business: 'Electrical goods wholesaler',
    city: 'Hyderabad',
    segment: 'retail',
    rating: 4,
    date: '2026-06-02',
    body: "Does the job and the HSN search is genuinely fast — I type 'pump' and the code and rate fill themselves in. Knocking a star off only because I'd like more than one page of line items on a single invoice. Support replied the same evening when I asked about it.",
  },
  {
    id: 4,
    name: 'Priya R.',
    role: 'Co-founder',
    business: 'B2B SaaS product',
    city: 'Chennai',
    segment: 'saas',
    rating: 5,
    date: '2026-04-11',
    pull: 'Receipts go out in about twenty seconds now.',
    body: "We send payment receipts after every Razorpay charge. Setting the plan name, duration and billing cycle once as a default means a new receipt is basically two fields and a save. Twenty seconds, maybe. It used to be a spreadsheet and a Word template.",
  },
  {
    id: 5,
    name: 'Vikram J.',
    role: 'Director',
    business: 'Interior contracting firm',
    city: 'Mumbai',
    segment: 'services',
    rating: 5,
    date: '2026-03-24',
    body: "Original, duplicate and triplicate copies in one click is exactly what my site work needs. The transporter copy used to be a photocopy with a stamp on it. Looks far more professional now and nobody at the check post argues.",
  },
  {
    id: 6,
    name: 'Anita D.',
    role: 'Freelance designer',
    business: 'Brand and UI design',
    city: 'Goa',
    segment: 'freelance',
    rating: 5,
    date: '2026-06-30',
    pull: 'It looks like the invoice a much bigger studio would send.',
    body: "I charge premium rates so my paperwork can't look like a free template. Uploaded my logo, picked the dark theme, added my signature and it genuinely looks like the invoice a much bigger studio would send. Two clients have asked me what I use.",
  },
  {
    id: 7,
    name: 'Suresh P.',
    role: 'Owner',
    business: 'Auto parts retail',
    city: 'Coimbatore',
    segment: 'retail',
    rating: 4,
    date: '2026-02-15',
    body: "Straightforward, no training needed, my counter staff picked it up the same day. I'd pay more for a stock count that ticks down as I bill. For pure invoicing though it's the cleanest thing I've used and the price is hard to argue with.",
  },
  {
    id: 8,
    name: 'Neha A.',
    role: 'Operations lead',
    business: 'Content and SEO studio',
    city: 'Gurugram',
    segment: 'services',
    rating: 5,
    date: '2026-05-08',
    body: "Managing about sixty active clients. Saving each one once and picking them from a dropdown removed the copy-paste step where we used to get billing addresses wrong. Small thing, but it was our most common invoice correction.",
  },
  {
    id: 9,
    name: 'Karthik V.',
    role: 'Founder',
    business: 'Analytics SaaS',
    city: 'Bengaluru',
    segment: 'saas',
    rating: 5,
    date: '2026-01-22',
    pull: 'Multi-currency receipts without a finance hire.',
    body: "About a third of our revenue is USD and EUR. Being able to issue a receipt in the customer's currency, with the symbol and amount in words correct, is not something I expected at this price point. We're two people and no finance hire yet.",
  },
  {
    id: 10,
    name: 'Fatima Z.',
    role: 'Proprietor',
    business: 'Textile trading',
    city: 'Surat',
    segment: 'retail',
    rating: 5,
    date: '2026-04-02',
    body: "Invoice numbers generate themselves in order, which matters to my accountant more than it matters to me. Dashboard shows what's pending versus paid at a glance. I stopped keeping the parallel notebook after about three weeks.",
  },
  {
    id: 11,
    name: 'Arjun N.',
    role: 'Managing partner',
    business: 'Legal consultancy',
    city: 'Delhi',
    segment: 'services',
    rating: 5,
    date: '2026-06-11',
    body: "SAC code handling is correct, which sounds trivial until you've used three tools that only understood HSN and goods. Professional services bill differently and this is the first one that seemed to know that.",
  },
  {
    id: 12,
    name: 'Deepak T.',
    role: 'Founder',
    business: 'Ed-tech platform',
    city: 'Indore',
    segment: 'saas',
    rating: 4,
    date: '2026-03-05',
    body: "Good product, does what it says. My one ask is automatic reminders for overdue invoices — right now I still chase manually. Everything else about the billing side I'm happy with, and the yearly price is genuinely fair.",
  },
  {
    id: 13,
    name: 'Meera S.',
    role: 'Freelance copywriter',
    business: 'Independent writing practice',
    city: 'Kochi',
    segment: 'freelance',
    rating: 5,
    date: '2026-05-19',
    pull: 'I am not registered for GST and it still works properly.',
    body: "Below the threshold so I don't charge GST. The without-GST mode actually hides the tax columns instead of printing zeros everywhere, which is what every other tool did. My invoices look intentional now.",
  },
  {
    id: 14,
    name: 'Rohan G.',
    role: 'Co-founder',
    business: 'Logistics software',
    city: 'Ahmedabad',
    segment: 'saas',
    rating: 5,
    date: '2026-02-27',
    body: "The monthly trend chart caught a dip I hadn't noticed in our subscription revenue — two annual renewals had silently lapsed. Paid for itself that afternoon. Not what I bought it for, but I'll take it.",
  },
  {
    id: 15,
    name: 'Lakshmi N.',
    role: 'Owner',
    business: 'Boutique and tailoring',
    city: 'Madurai',
    segment: 'retail',
    rating: 5,
    date: '2026-06-24',
    body: "I run this from my phone between customers. The mobile layout is properly built, not a shrunk-down desktop page. I can make an invoice standing at the counter and send the PDF on WhatsApp before the customer leaves.",
  },
  {
    id: 16,
    name: 'Aditya B.',
    role: 'Principal consultant',
    business: 'Management consulting',
    city: 'Noida',
    segment: 'services',
    rating: 5,
    date: '2026-01-14',
    body: "Switched from a well-known accounting suite that cost roughly eleven times more. I was only ever using the invoicing module. No regrets after five months and my CA hasn't complained once, which is the real test.",
  },
  {
    id: 17,
    name: 'Zoya H.',
    role: 'Studio manager',
    business: 'Photography studio',
    city: 'Jaipur',
    segment: 'services',
    rating: 4,
    date: '2026-04-21',
    body: "Clean, quick, looks good. Would love a deposit or part-payment field since we take fifty percent upfront on shoots — right now I raise two invoices. Everything else has been smooth and the PDFs look lovely.",
  },
  {
    id: 18,
    name: 'Manish K.',
    role: 'Proprietor',
    business: 'Hardware and sanitaryware',
    city: 'Lucknow',
    segment: 'retail',
    rating: 5,
    date: '2026-03-16',
    pull: 'Set up on a Sunday, billing by Monday morning.',
    body: "No demo call, no salesperson, no onboarding fee. Signed up on a Sunday evening, put in my GSTIN and bank details, and billed my first customer on Monday morning. That's how software should work.",
  },
  {
    id: 19,
    name: 'Sanjay R.',
    role: 'Founder',
    business: 'HR tech platform',
    city: 'Bengaluru',
    segment: 'saas',
    rating: 5,
    date: '2026-05-02',
    body: "Annual plans, monthly plans, a couple of custom enterprise deals. All three fit without me fighting the form. The plan duration and billing cycle fields carry through to the receipt so customers stop emailing to ask what period they paid for.",
  },
  {
    id: 20,
    name: 'Divya P.',
    role: 'Freelance developer',
    business: 'Web and mobile development',
    city: 'Trivandrum',
    segment: 'freelance',
    rating: 5,
    date: '2026-06-07',
    body: "Every project is scoped differently so a fixed service list was never going to work for me. Typing the description per invoice is exactly right. Bullet points in the scope field come through on the PDF properly formatted.",
  },
  {
    id: 21,
    name: 'Harpreet S.',
    role: 'Director',
    business: 'Event management',
    city: 'Chandigarh',
    segment: 'services',
    rating: 5,
    date: '2026-02-08',
    body: "Event billing is messy — venue, catering, decor, crew, all different rates and some at different GST slabs. Multiple line items with per-item rates handles it. First tool where I haven't had to raise three separate invoices for one event.",
  },
  {
    id: 22,
    name: 'Nikhil A.',
    role: 'Owner',
    business: 'Mobile and accessories retail',
    city: 'Nagpur',
    segment: 'retail',
    rating: 4,
    date: '2026-01-30',
    body: "Fast and reliable, no crashes in four months. I'd like a barcode scan input for the counter. As a billing and GST tool it's solid and the invoice numbering has never given me a duplicate.",
  },
  {
    id: 23,
    name: 'Ritu M.',
    role: 'Co-founder',
    business: 'D2C skincare brand',
    city: 'Mumbai',
    segment: 'retail',
    rating: 5,
    date: '2026-04-27',
    pull: 'Branding on the invoice actually looks considered.',
    body: "We care a lot about how the brand shows up, right down to the invoice. Logo, accent colour, stamp, custom terms. It's the first invoice I've been happy to have a customer screenshot.",
  },
  {
    id: 24,
    name: 'Gopal V.',
    role: 'Proprietor',
    business: 'Agricultural equipment dealer',
    city: 'Nashik',
    segment: 'retail',
    rating: 5,
    date: '2026-03-11',
    body: "Half my customers are in Maharashtra and half in Karnataka. The tax heads switch by themselves depending on the buyer's state. I used to get this wrong maybe twice a month and my accountant would find it in the returns.",
  },
  {
    id: 25,
    name: 'Tanya B.',
    role: 'Agency owner',
    business: 'Social media marketing',
    city: 'Kolkata',
    segment: 'services',
    rating: 5,
    date: '2026-06-15',
    body: "Retainers where the deliverables shift monthly. Being able to write this month's actual scope on the invoice, and add a service period line, has cut down client questions to almost nothing. Worth it for that alone.",
  },
  {
    id: 26,
    name: 'Faisal K.',
    role: 'Managing director',
    business: 'Facility management services',
    city: 'Bengaluru',
    segment: 'services',
    rating: 4,
    date: '2026-05-24',
    body: "Reliable and the export to Excel gives my accountant what she needs each quarter. I'd like scheduled recurring invoices rather than duplicating last month's. Told the team and they said it's on the list.",
  },
  {
    id: 27,
    name: 'Shalini R.',
    role: 'Freelance consultant',
    business: 'Financial advisory',
    city: 'Hyderabad',
    segment: 'freelance',
    rating: 5,
    date: '2026-02-19',
    body: "The amount-in-words line is correct in the Indian system — lakhs and crores, not millions. Sounds like a detail. It's the detail that made me trust the rest of the calculations.",
  },
  {
    id: 28,
    name: 'Abhishek D.',
    role: 'Founder',
    business: 'API and developer tools',
    city: 'Pune',
    segment: 'saas',
    rating: 5,
    date: '2026-01-08',
    pull: 'Cheaper than the spreadsheet it replaced, in hours saved.',
    body: "I was spending roughly three hours a month on invoices and receipts in a spreadsheet, plus the mistakes. Now it's under twenty minutes. At my hourly rate the yearly plan pays for itself in the first month.",
  },
  {
    id: 29,
    name: 'Kavita S.',
    role: 'Owner',
    business: 'Home bakery',
    city: 'Bhopal',
    segment: 'retail',
    rating: 5,
    date: '2026-06-21',
    body: "I sell mostly to offices and they all want a proper GST bill. This was the only tool I found that I could understand without help. Made my first invoice in about five minutes with no idea what I was doing.",
  },
  {
    id: 30,
    name: 'Prakash M.',
    role: 'Partner',
    business: 'Architecture practice',
    city: 'Chennai',
    segment: 'services',
    rating: 5,
    date: '2026-04-16',
    body: "Milestone billing across long projects. Custom invoice numbers let me follow our own project-based scheme instead of a system-generated one. Small feature, big difference to how our records line up.",
  },
  {
    id: 31,
    name: 'Ayesha N.',
    role: 'Freelance video editor',
    business: 'Post-production',
    city: 'Mumbai',
    segment: 'freelance',
    rating: 5,
    date: '2026-05-13',
    body: "International clients pay in dollars, Indian clients in rupees. One tool handles both and the receipt reads correctly either way. I'd been running two different templates before this.",
  },
  {
    id: 32,
    name: 'Yogesh P.',
    role: 'Proprietor',
    business: 'Printing and signage',
    city: 'Rajkot',
    segment: 'services',
    rating: 4,
    date: '2026-03-29',
    body: "Good value and does the essentials well. Would like a quotation or estimate document that converts into an invoice once approved — I still do quotes separately. Invoicing itself has been dependable.",
  },
  {
    id: 33,
    name: 'Bhavna J.',
    role: 'Co-founder',
    business: 'Subscription meal service',
    city: 'Bengaluru',
    segment: 'saas',
    rating: 5,
    date: '2026-06-27',
    body: "Weekly and monthly subscription receipts at reasonable volume. Auto-generated receipt numbers, saved plan defaults, and the dashboard tells me collections at a glance. Runs quietly, which is all I want from billing software.",
  },
  {
    id: 34,
    name: 'Ravi C.',
    role: 'Owner',
    business: 'Electronics repair services',
    city: 'Visakhapatnam',
    segment: 'services',
    rating: 5,
    date: '2026-02-03',
    body: "Every repair job is a different price and a different description, so nothing about my billing is repeatable. Free text on the service line is the whole reason I stayed. Been using it daily for five months.",
  },
]

/** Newest first — how review platforms order by default. */
export const testimonialsByRecency = [...testimonials].sort(
  (a, b) => new Date(b.date) - new Date(a.date)
)

export const reviewStats = {
  count: testimonials.length,
  average:
    Math.round(
      (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length) * 10
    ) / 10,
  fiveStar: testimonials.filter((t) => t.rating === 5).length,
}

export default testimonials
