import { Container, IconTile, Reveal, SectionHeading } from './ui'
import { FEATURES } from '../../data/landingContent'

export default function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 overflow-hidden bg-cream py-20 lg:py-26">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-dots-ink bg-dots-sm opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000,transparent)]"
      />

      <Container wide className="relative">
        <Reveal>
          <SectionHeading
            eyebrow="What you get"
            title="The details that decide whether an invoice is accepted"
            body="Nothing here is decorative. Each of these exists because getting it wrong costs you a correction at filing time, or a customer asking for a reissue."
          />
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <Reveal
              key={feature.title}
              delay={i * 50}
              className="group relative flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm-soft ring-1 ring-ink-900/[0.05] transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-lift hover:ring-ink-900/[0.08]"
            >
              <IconTile
                name={feature.icon}
                className="transition-transform duration-300 ease-out-back group-hover:scale-110"
              />
              <h3 className="mt-4 text-display-sm font-display text-ink-900">{feature.title}</h3>
              <p className="mt-2 text-body-sm text-ink-500">{feature.body}</p>
            </Reveal>
          ))}
        </div>

        {/* Metric band */}
        <Reveal delay={120} className="mt-14">
          <div className="grid gap-px overflow-hidden rounded-3xl bg-ink-800 ring-1 ring-ink-800 sm:grid-cols-3">
            {[
              { value: '60s', label: 'From blank page to sent PDF', sub: 'Typical first invoice' },
              { value: '3', label: 'Copies generated together', sub: 'Original, duplicate, triplicate' },
              { value: '6', label: 'Currencies on receipts', sub: 'INR, USD, EUR, GBP, CAD, AUD' },
            ].map((stat) => (
              <div key={stat.label} className="bg-ink-900 px-6 py-8 text-center">
                <p className="tnum text-display-lg font-display text-white">{stat.value}</p>
                <p className="mt-1.5 text-body-sm font-semibold text-ink-200">{stat.label}</p>
                <p className="mt-0.5 text-micro text-ink-400">{stat.sub}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
