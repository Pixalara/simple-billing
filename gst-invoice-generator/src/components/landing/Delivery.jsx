import { Container, Icon, Reveal, SectionHeading, StatusChip } from './ui'
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
            body="Download and share work today. WhatsApp, email and SMS delivery are in build — and we label them plainly rather than pretending they already ship."
          />
        </Reveal>

        {/* Available now */}
        <Reveal delay={80} className="mt-14">
          <div className="flex items-center gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              Available today
            </h3>
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </Reveal>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {live.map((channel, i) => (
            <Reveal
              key={channel.id}
              delay={i * 60}
              className="group rounded-2xl bg-white/[0.05] p-5 ring-1 ring-white/10 backdrop-blur transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:bg-white/[0.08] hover:ring-white/20"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${TONE[channel.icon]}`}
                >
                  <Icon name={channel.icon} className="h-5 w-5" />
                </span>
                <StatusChip status="live" label={channel.tagline} />
              </div>
              <h4 className="mt-4 text-display-sm font-display text-white">{channel.name}</h4>
              <p className="mt-1.5 text-body-sm text-ink-300">{channel.body}</p>
            </Reveal>
          ))}
        </div>

        {/* Coming soon */}
        <Reveal delay={80} className="mt-12">
          <div className="flex items-center gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              On the way
            </h3>
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </Reveal>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {soon.map((channel, i) => (
            <Reveal
              key={channel.id}
              delay={i * 55}
              className="relative flex h-full flex-col rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-5 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.045]"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${TONE[channel.icon]}`}
                >
                  <Icon name={channel.icon} className="h-5 w-5" />
                </span>
                <StatusChip status="soon" label={channel.tagline} />
              </div>
              <h4 className="mt-4 text-body-lg font-bold text-white">{channel.name}</h4>
              <p className="mt-1.5 text-body-sm text-ink-400">{channel.body}</p>
            </Reveal>
          ))}
        </div>

        {/* Honest footnote */}
        <Reveal delay={120} className="mt-10">
          <p className="mx-auto flex max-w-prose-mid items-start justify-center gap-2.5 rounded-2xl bg-white/[0.04] px-5 py-4 text-body-sm text-ink-300 ring-1 ring-white/10">
            <Icon name="shield" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-mint-400" />
            <span>
              We only mark something &ldquo;available today&rdquo; if it works in the product right
              now. Anything in build says so, so you can decide based on what exists.
            </span>
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
