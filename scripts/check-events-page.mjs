import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const distHtmlPath = path.join(projectRoot, 'dist', 'events', 'index.html');
const registryPath = path.join(projectRoot, 'src', 'priority', 'registry.ts');
const footerPath = path.join(projectRoot, 'src', 'priority', 'components', 'SiteFooter.tsx');
const sitemapPath = path.join(projectRoot, 'dist', 'sitemap.xml');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const read = async (file) => fs.readFile(file, 'utf8');

const html = await read(distHtmlPath);
const registry = await read(registryPath);
const footer = await read(footerPath);
const sitemap = await read(sitemapPath);

assert(registry.includes("'/events/': EventsPage"), 'Events page must be registered for the dev priority router.');
assert(footer.includes('href="/events/"'), 'Footer quick links must include the Events page.');
assert(sitemap.includes('<loc>https://elevatecareerhub.com/events/</loc>'), 'Sitemap must include /events/.');

for (const text of [
  'Upcoming Events',
  'Past Events',
  'Get into Grad School Bootcamp',
  'Job Readiness Bootcamp',
  'Career Clarity Workshop',
  'Register Now',
  'View Highlights',
  'Closed',
]) {
  assert(html.includes(text), `Events page HTML is missing: ${text}`);
}

const upcomingIndex = html.indexOf('Upcoming Events');
const pastIndex = html.indexOf('Past Events');
assert(upcomingIndex !== -1 && pastIndex !== -1 && upcomingIndex < pastIndex, 'Upcoming Events must appear before Past Events.');
assert(html.includes('href="/get-into-grad-school-bootcamp/"'), 'Upcoming bootcamp Register Now button must link to the grad school bootcamp page.');
assert(!html.includes('\u2014'), 'Events page output must not contain em dashes.');

console.log('Events page check passed.');
