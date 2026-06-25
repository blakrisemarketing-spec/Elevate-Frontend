export interface EventCard {
  title: string;
  date: string;
  href?: string;
  status: 'upcoming' | 'past';
  ctaLabel: string;
  description: string;
}

export const UPCOMING_EVENTS: EventCard[] = [
  {
    title: 'Get into Grad School Bootcamp',
    date: '26 Jul to 18 Aug 2026',
    href: '/get-into-grad-school-bootcamp/',
    status: 'upcoming',
    ctaLabel: 'Register Now',
    description: 'A live, 8-session bootcamp for applicants who want a clearer graduate school strategy, stronger essays, and a realistic funding plan.',
  },
];

export const PAST_EVENTS: EventCard[] = [
  {
    title: 'Job Readiness Bootcamp',
    date: 'Past bootcamp',
    href: '/job-readiness-bootcamp/',
    status: 'past',
    ctaLabel: 'View Highlights',
    description: 'A practical career sprint covering CV positioning, job search strategy, interview readiness, and confidence for competitive applications.',
  },
  {
    title: 'Career Clarity Workshop',
    date: 'Past workshop',
    status: 'past',
    ctaLabel: 'Closed',
    description: 'A guided workshop for professionals and students who needed sharper direction, clearer goals, and a more intentional career next step.',
  },
];
