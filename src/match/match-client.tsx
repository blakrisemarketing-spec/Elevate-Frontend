/**
 * Grad School Match island entry.
 *
 * The page (src/priority/pages/GradSchoolMatch.tsx) ships a static, pre-rendered
 * intro screen inside #match-root as a no-JS fallback. This script, loaded only
 * on /grad-school-match/, client-renders the interactive tool over it. We use
 * createRoot().render (not hydrate) because the page is emitted with
 * renderToStaticMarkup, so a fresh client render avoids any hydration mismatch.
 */
import { createRoot } from 'react-dom/client';
import { MatchTool } from './MatchTool';

const mount = document.getElementById('match-root');
if (mount) {
  createRoot(mount).render(<MatchTool />);
}
