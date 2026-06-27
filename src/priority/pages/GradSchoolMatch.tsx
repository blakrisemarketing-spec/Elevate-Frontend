import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { MatchTool } from '../../match/MatchTool';

/**
 * Grad School Match, lead-gen tool page.
 *
 * The page chrome (header, footer, section) is static, zero-JS, pre-rendered to
 * HTML like every other priority route. The interactive tool lives inside
 * #match-root: in dev it renders here directly (HMR); in production the build
 * emits MatchTool's intro screen as a no-JS fallback and the match island
 * (src/match/match-client.tsx) client-renders the full tool over it.
 */
export function GradSchoolMatchPage() {
  return (
    <>
      <a className="skip-link" href="#match-root">Skip to the tool</a>
      <SiteHeader currentRoute="" />

      <main id="main" className="bg-gradient-to-b from-surface-tint/60 to-canvas">
        <section className="container-site py-12 lg:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="eyebrow text-primary mb-3">Get Into Grad School Bootcamp</p>
            <h1 className="text-display-lg mb-4">Your free grad school and scholarship match</h1>
            <p className="text-ink-muted leading-relaxed">
              Most funding goes to people who know where to look. This quick tool shows you the funded programs and
              scholarships that fit your profile, then points you to the next step.
            </p>
          </div>

          <div id="match-root">
            <MatchTool />
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
