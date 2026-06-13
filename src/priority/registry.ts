import type { ReactElement } from 'react';
import { HomePage } from './pages/Home';
import { AboutPage } from './pages/About';
import { CareerServicesPage } from './pages/CareerServices';
import { EducationalServicesPage } from './pages/EducationalServices';
import { DIYProductsPage } from './pages/DIYProducts';
import { ContactUsPage } from './pages/ContactUs';
import { PaymentConfirmedPage } from './pages/PaymentConfirmed';
import { PrivacyPolicyPage } from './pages/PrivacyPolicy';
import { TermsPage } from './pages/Terms';
import { RefundPolicyPage } from './pages/RefundPolicy';
import { FaqsPage } from './pages/Faqs';
import { BlogIndexPage } from './pages/BlogIndex';
import { BlogPostPage } from './pages/BlogPost';
import { JobReadinessBootcampPage } from './pages/JobReadinessBootcamp';
import { JrbThankYouPage } from './pages/JrbThankYou';
import { LetsKeepInTouchPage } from './pages/LetsKeepInTouch';
import { GradSchoolBootcampPage } from './pages/GradSchoolBootcamp';
import { ProductDetailPage } from './pages/ProductDetail';
import { ServiceDetailPage } from './pages/ServiceDetail';
import { PRODUCTS } from './data/products';
import { SERVICES } from './data/services';
import { BLOG_POSTS } from './data/blog';

/**
 * Route → redesigned React page component.
 *
 * Single source of truth for the dev server (src/main.tsx renders these with
 * HMR) AND a mirror of the SSG list in scripts/build-priority-routes.mjs
 * (which renders the same components to static HTML for production). Keep the
 * two in sync when adding a route.
 *
 * The data-driven product/service/blog detail routes are generated from the
 * same data/*.ts files the build reads, so the two stay aligned automatically.
 */
const STATIC_PAGES: Record<string, () => ReactElement> = {
  '/': HomePage,
  '/about/': AboutPage,
  '/career-services/': CareerServicesPage,
  '/educational-services/': EducationalServicesPage,
  '/diy-products/': DIYProductsPage,
  '/contact-us/': ContactUsPage,
  '/payment/confirmed/': PaymentConfirmedPage,
  '/privacy-policy/': PrivacyPolicyPage,
  '/terms/': TermsPage,
  '/refund-policy/': RefundPolicyPage,
  '/faqs/': FaqsPage,
  '/blog/': BlogIndexPage,
  '/job-readiness-bootcamp/': JobReadinessBootcampPage,
  '/jrb-thank-you/': JrbThankYouPage,
  '/lets-keep-in-touch/': LetsKeepInTouchPage,
  '/get-into-grad-school-bootcamp/': GradSchoolBootcampPage,
};

const PRODUCT_PAGES: Record<string, () => ReactElement> = Object.fromEntries(
  PRODUCTS.map((p) => [p.route, () => ProductDetailPage({ slug: p.catalogId })]),
);

const SERVICE_PAGES: Record<string, () => ReactElement> = Object.fromEntries(
  SERVICES.map((s) => [s.route, () => ServiceDetailPage({ slug: s.slug })]),
);

const BLOG_PAGES: Record<string, () => ReactElement> = Object.fromEntries(
  BLOG_POSTS.map((p) => [p.route, () => BlogPostPage({ slug: p.slug })]),
);

export const PRIORITY_PAGES: Record<string, () => ReactElement> = {
  ...STATIC_PAGES,
  ...PRODUCT_PAGES,
  ...SERVICE_PAGES,
  ...BLOG_PAGES,
};
