import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { PageHero } from '../components/PageHero';
import { PAST_EVENTS, UPCOMING_EVENTS, type EventCard } from '../data/events';

function EventVisual({ title, muted = false }: { title: string; muted?: boolean }) {
  return (
    <div className={`relative overflow-hidden border-b ${muted ? 'border-slate-200 bg-slate-100' : 'border-primary/20 bg-primary/10'}`}>
      <div className={`aspect-[16/10] flex items-center justify-center ${muted ? 'opacity-60 grayscale' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-navy to-electric" aria-hidden="true" />
        <div className="absolute inset-0 opacity-25" aria-hidden="true">
          <svg viewBox="0 0 400 250" className="h-full w-full" role="presentation" focusable="false">
            <circle cx="58" cy="56" r="42" fill="white" />
            <circle cx="330" cy="186" r="64" fill="white" />
            <path d="M82 190C140 96 230 90 314 48" fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" />
          </svg>
        </div>
        <div className="relative z-10 text-center px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-electric mb-3">Elevate Event</p>
          <p className="text-headline-md text-white leading-tight">{title}</p>
        </div>
      </div>
    </div>
  );
}

function EventCardView({ event }: { event: EventCard }) {
  const isPast = event.status === 'past';

  return (
    <article className={`card flex h-full flex-col gap-0 overflow-hidden p-0 ${isPast ? 'bg-white/80' : 'ring-1 ring-primary/10'}`}>
      <EventVisual title={event.title} muted={isPast} />
      <div className="flex flex-1 flex-col p-7">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${isPast ? 'bg-slate-100 text-slate-600' : 'bg-electric text-navy'}`}>
            {isPast ? 'Past Event' : 'Upcoming Event'}
          </span>
          <span className="text-sm font-semibold text-primary">{event.date}</span>
        </div>
        <h3 className="text-headline-md mb-3">{event.title}</h3>
        <p className="text-ink-muted leading-relaxed mb-6">{event.description}</p>
        {event.href ? (
          <a href={event.href} className={isPast ? 'btn-secondary mt-auto self-start' : 'btn-primary mt-auto self-start'}>
            {event.ctaLabel}
          </a>
        ) : (
          <span className="mt-auto inline-flex self-start rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            {event.ctaLabel}
          </span>
        )}
      </div>
    </article>
  );
}

export function EventsPage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/events/" />

      <main id="main">
        <PageHero
          eyebrow="Events"
          title="Join upcoming Elevate programs and revisit past sessions"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Events' }]}
          intro={
            <p>
              Find the bootcamps, workshops, and live sessions designed to help you move with more clarity, stronger documents, and better strategy.
            </p>
          }
        />

        <section className="container-site py-16 lg:py-20" aria-labelledby="upcoming-events-heading">
          <div className="max-w-3xl mb-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Section 1</p>
            <h2 id="upcoming-events-heading" className="text-headline-lg mb-4">Upcoming Events</h2>
            <p className="text-ink-muted leading-relaxed">
              Register for live programmes currently open or coming up soon. Each event card points you to the dedicated registration page.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {UPCOMING_EVENTS.map((event) => <EventCardView key={event.title} event={event} />)}
          </div>
        </section>

        <section className="bg-surface" aria-labelledby="past-events-heading">
          <div className="container-site py-16 lg:py-20">
            <div className="max-w-3xl mb-10">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Section 2</p>
              <h2 id="past-events-heading" className="text-headline-lg mb-4">Past Events</h2>
              <p className="text-ink-muted leading-relaxed">
                Explore previous Elevate programmes and archived sessions. Closed events stay visible so visitors can see the track record behind future cohorts.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {PAST_EVENTS.map((event) => <EventCardView key={event.title} event={event} />)}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
