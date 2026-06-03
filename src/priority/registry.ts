import type { ReactElement } from 'react';
import { HomePage } from './pages/Home';
import { AboutPage } from './pages/About';
import { CareerServicesPage } from './pages/CareerServices';
import { EducationalServicesPage } from './pages/EducationalServices';
import { DIYProductsPage } from './pages/DIYProducts';
import { ContactUsPage } from './pages/ContactUs';
import { PaymentConfirmedPage } from './pages/PaymentConfirmed';

/**
 * Route → redesigned React page component.
 *
 * Single source of truth for the dev server (src/main.tsx renders these with
 * HMR) AND a mirror of the SSG list in scripts/build-priority-routes.mjs
 * (which renders the same components to static HTML for production). Keep the
 * two in sync when adding a route.
 */
export const PRIORITY_PAGES: Record<string, () => ReactElement> = {
  '/': HomePage,
  '/about/': AboutPage,
  '/career-services/': CareerServicesPage,
  '/educational-services/': EducationalServicesPage,
  '/diy-products/': DIYProductsPage,
  '/contact-us/': ContactUsPage,
  '/payment/confirmed/': PaymentConfirmedPage,
};
