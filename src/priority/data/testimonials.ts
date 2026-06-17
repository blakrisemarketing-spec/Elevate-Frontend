/**
 * Real client testimonials (sourced from elevatecareerhub.com). Shared by the
 * homepage and the TestimonialsBlock used on the service pages so the two can't
 * drift. These replaced the earlier placeholder/demo testimonials.
 */

export interface Testimonial {
  author: string;
  /** Outcome / company shown under the name for credibility. */
  role?: string;
  /** Avatar photo (optimised webp). */
  image?: string;
  quote: string;
}

export interface VideoTestimonial {
  /** Vimeo video id. */
  vimeoId: string;
  /** Optional caption shown under the video. */
  caption?: string;
}

/**
 * Video testimonials (Vimeo). Embedded with loading="lazy" below the fold so
 * they never affect the LCP metric. Requires `player.vimeo.com` in the CSP
 * frame-src (see deploy/htaccess.conf). The videos must allow embedding on
 * elevatecareerhub.com in their Vimeo privacy settings.
 */
export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  { vimeoId: '1162498182' },
  { vimeoId: '1162498148' },
  { vimeoId: '1162498076' },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    author: 'Helen Wanki',
    role: 'Account Executive, fintech · Canada',
    image: '/assets/testimonials/helen-wanki.webp',
    quote:
      'Elevate Career Hub, and especially Naa and Rosemary, have honestly changed my life in Canada. When I first arrived I felt completely lost, I had the determination, but not the tools. Within just two weeks, I got my very first job here, and because of their guidance I later secured an Account Executive role at a major fintech company. It’s everything I prayed for.',
  },
  {
    author: 'Enoch Dwomoh',
    role: 'JP Morgan',
    image: '/assets/testimonials/enoch-dwomoh.webp',
    quote:
      'Right after school, with the help of Elevate, I got my first role with JP Morgan. Elevate has been my go-to partner for everything career-related, one of the best, if not the best, in the industry.',
  },
  {
    author: 'Maria Yalley',
    role: 'Remote Customer Care Manager · Canada',
    image: '/assets/testimonials/maria-yalley.webp',
    quote:
      'Just about two weeks after I got my CV back, I applied for a remote Customer Care Manager role with a Canadian-based wellness centre, and I got the job. I actually got 3 offers and chose this one. I can’t believe how fast it happened after I used the new CV.',
  },
  {
    author: 'Clive Annan',
    role: 'Dutch Relief Alliance · Netherlands',
    image: '/assets/testimonials/clive-annan.webp',
    quote:
      'As an immigrant in the Netherlands, Elevate helped me land an enviable role with the Dutch Relief Alliance. They’re the best in the game!',
  },
  {
    author: 'Esther Aflakpui',
    role: 'KPMG',
    image: '/assets/testimonials/esther-aflakpui.webp',
    quote:
      'Elevate guided me through every step of the way till I landed a role at KPMG. I couldn’t have done it without them. So grateful!',
  },
];
