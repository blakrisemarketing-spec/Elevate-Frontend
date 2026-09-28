/**
 * Dev-only preview entry (`npm run dev`).
 *
 * Production never ships this file: every route is pre-rendered to zero-JS
 * static HTML by scripts/build-priority-routes.mjs, and `npm run build` no
 * longer runs `vite build`. This entry exists so the page components can be
 * iterated on with HMR. It renders the registered component for the current
 * path, falling back to a plain not-found notice.
 */
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './priority/styles.css';
import { PRIORITY_PAGES } from './priority/registry';

function normalizeRoute(pathname: string): string {
  let route = pathname.replace(/\/index\.php(?=\/|$)/, '') || '/';
  if (!route.includes('.') && !route.endsWith('/')) route += '/';
  return route;
}

function App(): React.ReactElement {
  const route = normalizeRoute(window.location.pathname);
  const Page = PRIORITY_PAGES[route] as (() => React.ReactElement) | undefined;

  useEffect(() => {
    if (route === '/admin/') {
      import('./admin/admin-client');
    } else if (Page) {
      import('./checkout/checkout-client');
    }
  }, [route, Page]);

  if (!Page) {
    return (
      <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
        <h1>No page registered for {route}</h1>
        <p>Add it to src/priority/registry.ts (and PRIORITY_ROUTES in scripts/build-priority-routes.mjs).</p>
      </main>
    );
  }
  return <Page />;
}

createRoot(document.getElementById('root')!).render(<App />);
