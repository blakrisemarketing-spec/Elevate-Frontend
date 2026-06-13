import { VIDEO_TESTIMONIALS } from '../data/testimonials';

/**
 * Video testimonials row (Vimeo). Lazy-loaded iframes — below the fold, so they
 * don't affect LCP. Keeps the zero-JS rule: the page ships no JS; the player
 * runs inside Vimeo's sandboxed iframe. Needs `player.vimeo.com` in the CSP.
 */
export function VideoTestimonials() {
  if (VIDEO_TESTIMONIALS.length === 0) return null;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
      {VIDEO_TESTIMONIALS.map((v, i) => (
        <figure key={v.vimeoId} className="flex flex-col">
          <div className="aspect-[4/5] rounded-xl overflow-hidden bg-navy shadow-card">
            <iframe
              src={`https://player.vimeo.com/video/${v.vimeoId}?title=0&byline=0&portrait=0&dnt=1`}
              className="w-full h-full"
              loading="lazy"
              allow="fullscreen; picture-in-picture; clipboard-write"
              allowFullScreen
              title={v.caption || `Client video testimonial ${i + 1}`}
            />
          </div>
          {v.caption && <figcaption className="mt-3 text-sm font-semibold text-navy text-center">{v.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
