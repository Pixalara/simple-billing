import { useMemo, useState } from 'react'
import { Button, Container, Icon, Reveal, SectionHeading, Stars } from './ui'
import {
  REVIEWS_ARE_PLACEHOLDER,
  REVIEW_SEGMENTS,
  reviewStats,
  testimonialsByRecency,
} from '../../data/testimonials'

const INITIAL_COUNT = 9

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

/** Deterministic avatar tint from the name, so it never changes between loads. */
const AVATAR_TONES = [
  'bg-brand-100 text-brand-700',
  'bg-mint-100 text-mint-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
]
function toneFor(name) {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_TONES[sum % AVATAR_TONES.length]
}

function ReviewCard({ review }) {
  return (
    <figure className="break-inside-avoid rounded-2xl bg-white p-5 shadow-sm-soft ring-1 ring-ink-900/[0.05] transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        <time
          dateTime={review.date}
          className="text-[10px] font-medium uppercase tracking-wide text-ink-400"
        >
          {formatDate(review.date)}
        </time>
      </div>

      <blockquote className="mt-3.5">
        <p className="text-body-sm text-ink-700">{review.body}</p>
      </blockquote>

      <figcaption className="mt-4 flex items-center gap-3 border-t border-ink-100 pt-4">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${toneFor(
            review.name
          )}`}
          aria-hidden="true"
        >
          {review.name.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-body-sm font-bold text-ink-900">{review.name}</span>
          <span className="block truncate text-[11px] text-ink-500">
            {review.role} · {review.business}
          </span>
          <span className="block text-[10px] text-ink-400">{review.city}</span>
        </span>
      </figcaption>
    </figure>
  )
}

export default function Reviews() {
  const [segment, setSegment] = useState('all')
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(
    () =>
      segment === 'all'
        ? testimonialsByRecency
        : testimonialsByRecency.filter((t) => t.segment === segment),
    [segment]
  )

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT)
  const remaining = filtered.length - visible.length

  return (
    <section id="reviews" className="scroll-mt-24 bg-white py-20 lg:py-26">
      <Container wide>
        <Reveal>
          <SectionHeading
            eyebrow="Customer reviews"
            title="What businesses say after switching"
            body="Freelancers, agencies, SaaS teams and traders. Sorted newest first, filterable by business type."
          />
        </Reveal>

        {/* Rating summary */}
        <Reveal delay={70} className="mt-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-3xl bg-cream px-6 py-6 ring-1 ring-ink-900/[0.05] sm:flex-row sm:justify-center sm:gap-8">
            <div className="flex items-center gap-4">
              <p className="tnum text-display-lg font-display text-ink-900">
                {reviewStats.average}
              </p>
              <div>
                <Stars rating={5} size="md" />
                <p className="mt-1 text-micro text-ink-500">
                  <span className="tnum font-semibold text-ink-700">{reviewStats.count}</span>{' '}
                  reviews
                </p>
              </div>
            </div>
            <span className="hidden h-12 w-px bg-ink-200 sm:block" />
            <dl className="flex gap-6 text-center">
              <div>
                <dt className="text-micro text-ink-500">5-star</dt>
                <dd className="tnum text-body-lg font-bold text-ink-900">
                  {reviewStats.fiveStar}
                </dd>
              </div>
              <div>
                <dt className="text-micro text-ink-500">Would recommend</dt>
                <dd className="tnum text-body-lg font-bold text-mint-600">
                  {Math.round((reviewStats.fiveStar / reviewStats.count) * 100)}%
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>

        {/* Placeholder disclosure. Vanishes once REVIEWS_ARE_PLACEHOLDER is false. */}
        {REVIEWS_ARE_PLACEHOLDER && (
          <Reveal delay={90} className="mt-5">
            <p className="mx-auto flex max-w-2xl items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-800 ring-1 ring-amber-200">
              <Icon name="clock" className="mt-px h-4 w-4 shrink-0" />
              <span>
                <strong className="font-bold">Illustrative reviews.</strong> These show the kind of
                feedback we collect and are being replaced with verified customer reviews. No real
                person or company is named.
              </span>
            </p>
          </Reveal>
        )}

        {/* Filters */}
        <Reveal delay={110} className="mt-8">
          <div
            role="group"
            aria-label="Filter reviews by business type"
            className="flex flex-wrap justify-center gap-2"
          >
            {REVIEW_SEGMENTS.map((s) => {
              const active = segment === s.id
              const count =
                s.id === 'all'
                  ? testimonialsByRecency.length
                  : testimonialsByRecency.filter((t) => t.segment === s.id).length
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSegment(s.id)
                    setExpanded(false)
                  }}
                  aria-pressed={active}
                  className={`focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-body-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-ink-900 text-white shadow-soft'
                      : 'bg-ink-50 text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100 hover:text-ink-900'
                  }`}
                >
                  {s.label}
                  <span
                    className={`tnum rounded-full px-1.5 text-[10px] font-bold ${
                      active ? 'bg-white/15 text-white' : 'bg-white text-ink-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </Reveal>

        {/* Masonry columns keep ragged-length reviews from leaving big gaps. */}
        <div className="review-columns mt-10" key={segment}>
          {visible.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {remaining > 0 && (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" size="md" onClick={() => setExpanded(true)}>
              Show {remaining} more {remaining === 1 ? 'review' : 'reviews'}
              <Icon name="plus" className="h-4 w-4" />
            </Button>
          </div>
        )}

        {expanded && filtered.length > INITIAL_COUNT && (
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
              Show fewer
            </Button>
          </div>
        )}
      </Container>
    </section>
  )
}
