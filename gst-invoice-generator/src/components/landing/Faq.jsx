import { useState } from 'react'
import { Container, Icon, Reveal, SectionHeading } from './ui'
import { FAQS } from '../../data/landingContent'

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faqs" className="scroll-mt-24 bg-white py-20 lg:py-26">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Questions"
              title="Answers before you sign up"
              body="If something is not covered here, ask us before you pay. We would rather set expectations correctly."
            />
          </Reveal>

          <Reveal delay={80}>
            <dl className="divide-y divide-ink-100 border-y border-ink-100">
              {FAQS.map((faq, i) => {
                const isOpen = open === i
                return (
                  <div key={faq.q}>
                    <dt>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? -1 : i)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${i}`}
                        id={`faq-button-${i}`}
                        className="focus-ring flex w-full items-start justify-between gap-4 py-5 text-left transition-colors hover:text-brand-700"
                      >
                        <span
                          className={`text-body-lg font-semibold transition-colors ${
                            isOpen ? 'text-brand-700' : 'text-ink-900'
                          }`}
                        >
                          {faq.q}
                        </span>
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-out-expo ${
                            isOpen
                              ? 'rotate-45 bg-brand-600 text-white'
                              : 'bg-ink-100 text-ink-600'
                          }`}
                        >
                          <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                      </button>
                    </dt>
                    <dd
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-button-${i}`}
                      className="faq-panel"
                      data-open={isOpen}
                    >
                      <div>
                        <p className="max-w-prose-mid pb-5 pr-8 text-body text-ink-600">{faq.a}</p>
                      </div>
                    </dd>
                  </div>
                )
              })}
            </dl>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
