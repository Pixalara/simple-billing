import { Container, Icon, Reveal, SectionHeading } from './ui'
import { DELIVERY_CHANNELS } from '../../data/landingContent'

/* Channel accents. Kept muted so six cards side by side don't turn into a
 * fruit salad — the status chip carries the signal, not the colour. */
const TONE = {
  download: 'text-brand-300 bg-brand-500/10 ring-brand-400/20',
  share: 'text-brand-300 bg-brand-500/10 ring-brand-400/20',
  whatsapp: 'text-mint-300 bg-mint-500/10 ring-mint-400/20',
  mail: 'text-amber-300 bg-amber-500/10 ring-amber-400/20',
  sms: 'text-violet-300 bg-violet-500/10 ring-violet-400/20',
  bell: 'text-rose-300 bg-rose-500/10 ring-rose-400/20',
}

export default function Delivery() {
  const live = DELIVERY_CHANNELS.filter((c) => c.status === 'live')
  const soon = DELIVERY_CHANNELS.filter((c) => c.status === 'soon')

  return (
    <section id="delivery" className="relative scroll-mt-24 overflow-hidden bg-ink-950 py-20 lg:py-26">
      {/* Ambient light */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-ink bg-grid-lg opacity-[0.35] invert [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000,transparent)]" />
        <div className="absolute -top-32 left-1/4 h-[420px] w-[620px] rounded-full bg-brand-600/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[340px] w-[440px] rounded-full bg-mint-600/12 blur-[130px]" />
      </div>

      <Container wide className="relative">
        <Reveal>
          <SectionHeading
            light
            eyebrowTone="light"
            eyebrow="Getting it to your customer"
            title="Deliver on the channels your customers actually use"
            body="PDF download and native share work today. WhatsApp send, email delivery, SMS alerts and automatic reminders are in build and arrive free in your plan — we label what ships when, so you always know what you are buying."
          />
        </Reveal>

        {/* Available today */}
        <Reveal delay={80} className="mt-14">
          <div className="flex items-center gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              Available today
            </h3>
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </Reveal>

        <div className="mt-5 grid gap-4 xs:grid-cols-2">
          {live.map((channel, i) => (
            <Reveal
              key={channel.id}
              delay={i * 60}
              className="group rounded-2xl bg-white/[0.05] p-5 ring-1 ring-white/10 backdrop-blur transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:bg-white/[0.08] hover:ring-white/20"
            >
              {/* Tile sized to match the in-build cards, so both groups read as
                  one family now that neither carries a status chip. */}
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-transform duration-300 ease-out-back group-hover:scale-110 ${TONE[channel.icon]}`}
              >
                <Icon name={channel.icon} className="h-5.5 w-5.5" />
              </span>
              <h4 className="mt-4 text-display-sm font-display text-white">{channel.name}</h4>
              <p className="mt-1.5 text-body-sm text-ink-300">{channel.body}</p>
            </Reveal>
          ))}
        </div>

        {/* --- In build -----------------------------------------------------
            Highlighted rather than de-emphasised: a gradient hairline frame
            and full-strength cards, so the roadmap reads as capability
            arriving, not capability missing.

            Per-card badges were deliberately removed — six identical chips was
            visual noise. The "not live yet" fact is stated once, in the panel
            heading and subcopy. Keep that statement if this markup changes. */}
        <Reveal delay={100} className="mt-14">
          <div className="relative overflow-hidden rounded-4xl bg-gradient-to-b from-brand-400/40 via-mint-400/15 to-white/5 p-px shadow-hero">
            <div className="relative overflow-hidden rounded-4xl bg-ink-950/85 px-5 py-8 backdrop-blur-xl sm:px-8 sm:py-10">
              {/* Inner glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[560px] -translate-x-1/2 rounded-full bg-brand-500/25 blur-[90px]"
              />

              <div className="relative flex flex-col items-center text-center">
                <h3 className="text-display-md font-display text-white text-balance">
                  Four more ways to get paid, currently in build
                </h3>
                <p className="mt-3 max-w-prose-tight text-body text-ink-300">
                  These are not live yet. Each one switches on inside your plan the day it ships —
                  no upgrade, no migration, no extra charge.
                </p>
              </div>

              {/* Held at 2-up even on wide screens — four narrow cards could not
                  carry the heading plus two bullets without feeling cramped. */}
              <div className="relative mt-9 grid gap-4 xs:grid-cols-2">
                {soon.map((channel, i) => (
                  <Reveal
                    key={channel.id}
                    delay={i * 60}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/12 transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:bg-white/[0.11] hover:ring-white/25"
                  >
                    {/* Top accent, brightens on hover */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-opacity duration-300 group-hover:via-white/60"
                    />

                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-transform duration-300 ease-out-back group-hover:scale-110 ${TONE[channel.icon]}`}
                    >
                      <Icon name={channel.icon} className="h-5.5 w-5.5" />
                    </span>

                    <h4 className="mt-4 text-display-sm font-display text-white">{channel.name}</h4>
                    <p className="mt-1.5 text-body-sm text-ink-300">{channel.body}</p>

                    {channel.bullets && (
                      <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                        {channel.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2">
                            <Icon
                              name="check"
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-400"
                              strokeWidth={3}
                            />
                            <span className="text-[12px] font-medium text-ink-200">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Honest footnote */}
        <Reveal delay={120} className="mt-10">
          <p className="mx-auto flex max-w-prose-mid items-start justify-center gap-2.5 rounded-2xl bg-white/[0.04] px-5 py-4 text-body-sm text-ink-300 ring-1 ring-white/10">
            <Icon name="shield" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-mint-400" />
            <span>
              We only mark something &ldquo;available today&rdquo; if it works in the product right
              now. Everything in build says so plainly, so you can decide on what exists rather
              than on a promise.
            </span>
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
