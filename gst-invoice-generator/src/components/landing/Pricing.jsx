import { useNavigate } from 'react-router-dom'
import { Button, Container, Icon, Reveal, SectionHeading } from './ui'
import { PLANS } from '../../data/landingContent'

function FeatureLine({ feature }) {
  const { label, included, soon } = feature
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full ${
          included ? 'bg-mint-100 text-mint-700' : 'bg-ink-100 text-ink-400'
        }`}
      >
        <Icon
          name={included ? 'check' : 'x'}
          className="h-2.5 w-2.5"
          strokeWidth={included ? 3.5 : 2.5}
        />
      </span>
      <span
        className={`text-body-sm ${included ? 'text-ink-700' : 'text-ink-400 line-through decoration-ink-300'}`}
      >
        {label}
        {soon && (
          <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
            Soon
          </span>
        )}
      </span>
    </li>
  )
}

export default function Pricing() {
  const navigate = useNavigate()
  const goSignup = () => navigate('/login', { state: { initialView: 'SIGNUP' } })

  return (
    <section id="pricing" className="scroll-mt-24 bg-cream py-20 lg:py-26">
      <Container wide>
        <Reveal>
          <SectionHeading
            eyebrow="Pricing"
            title="Priced for a small business, not an enterprise"
            body="Billed yearly. Start free and stay free if the limits suit you. Features marked “Soon” are in build and not yet available."
          />
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-5xl items-stretch gap-5 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal
              key={plan.id}
              delay={i * 70}
              className={`relative flex ${plan.featured ? 'lg:-my-3' : ''}`}
            >
              <div
                className={`relative flex w-full flex-col rounded-3xl p-6 transition-all duration-300 ease-out-expo sm:p-7 ${
                  plan.featured
                    ? 'bg-ink-900 text-white shadow-hero ring-1 ring-ink-900'
                    : 'bg-white shadow-sm-soft ring-1 ring-ink-900/[0.06] hover:shadow-lift'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500 to-mint-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-lift">
                    {plan.badge}
                  </span>
                )}

                <h3
                  className={`text-display-sm font-display ${plan.featured ? 'text-white' : 'text-ink-900'}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-1.5 min-h-[2.75rem] text-body-sm ${
                    plan.featured ? 'text-ink-300' : 'text-ink-500'
                  }`}
                >
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mt-5 flex items-end gap-1.5">
                  {plan.isCustomPrice ? (
                    <span
                      className={`text-display-md font-display ${plan.featured ? 'text-white' : 'text-ink-900'}`}
                    >
                      {plan.price}
                    </span>
                  ) : (
                    <>
                      <span
                        className={`text-display-sm font-display ${plan.featured ? 'text-ink-300' : 'text-ink-400'}`}
                      >
                        ₹
                      </span>
                      <span
                        className={`tnum text-display-xl font-display leading-none ${
                          plan.featured ? 'text-white' : 'text-ink-900'
                        }`}
                      >
                        {plan.price}
                      </span>
                    </>
                  )}
                </div>
                {plan.priceNote && (
                  <p
                    className={`mt-1.5 text-micro font-medium ${plan.featured ? 'text-ink-400' : 'text-ink-500'}`}
                  >
                    {plan.priceNote}
                  </p>
                )}

                <div
                  className={`my-6 h-px ${plan.featured ? 'bg-white/12' : 'bg-ink-100'}`}
                />

                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <FeatureLine key={feature.label} feature={feature} />
                  ))}
                </ul>

                <Button
                  onClick={goSignup}
                  variant={plan.featured ? 'light' : 'secondary'}
                  size="md"
                  className="mt-7 w-full"
                >
                  {plan.cta}
                </Button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={140} className="mt-10">
          <p className="mx-auto flex max-w-prose-mid items-center justify-center gap-2 text-center text-body-sm text-ink-500">
            <Icon name="shield" className="h-4 w-4 shrink-0 text-mint-600" />
            No setup fee, no demo call, no salesperson. Cancel at the end of any term.
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
