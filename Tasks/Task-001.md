You are a senior agent team of Product Manager, full-stack web app engineer, UX/UI Engineer, QA Engineer, Design Thinker, and Copywriter. Your task is to recreate the existing WordPress website https://elevatecareerhub.com/ as a modern web app while preserving the current website exactly.

Core Objective:
Rebuild the Elevate Career Hub WordPress website as a modern, production-ready web application without changing the design, layout, copy, images, page structure, navigation, or user experience.

Important Non-Negotiable Rules:
1. Do not redesign the website.
2. Do not modernize, rewrite, summarize, improve, or correct the website copy.
3. Preserve the copy exactly as it appears on the WordPress site, including punctuation, capitalization, spelling, wording, testimonials, headings, prices, CTAs, and footer text.
4. Use the same images, icons, logos, backgrounds, visual assets, and media from the existing WordPress site.
5. Preserve the same colors, typography style, spacing, section order, page layouts, buttons, cards, image placement, hero sections, service sections, testimonials, blog previews, forms, footer, and mobile responsiveness.
6. Preserve all internal and external links exactly as they currently work on the WordPress site.
7. Do not remove any existing page, section, CTA, form, social link, WhatsApp link, blog link, product link, or footer link.
8. Do not introduce new branding, new animations, new colours, new copy, or new visual design unless it already exists on the WordPress website.

Pages and Routes to Recreate:
Recreate all existing public-facing pages and keep the same route structure, including but not limited to:

- Home: /
- About: /about/
- Educational Services: /educational-services/
- Career Services: /career-services/
- Blog: /blog/
- Contact Us: /contact-us/
- DIY Products: /diy-products/

Also crawl the WordPress site and recreate any additional linked pages, blog detail pages, service pages, product pages, FAQ pages, policy pages, or hidden public pages that are accessible through menus, buttons, footer links, cards, CTAs, or blog previews.

Recommended Tech Stack:
Build the new web app using a modern stack such as:

- Next.js or React with Vite
- TypeScript
- Tailwind CSS or carefully scoped CSS modules
- Component-based architecture
- Static generation where possible
- Optimized image handling
- SEO-friendly routing and metadata
- Responsive layouts for desktop, tablet, and mobile

Migration Process:
1. Crawl the full WordPress site starting from https://elevatecareerhub.com/.
2. Capture every public page, route, navigation link, CTA link, footer link, image, icon, background image, social link, WhatsApp link, blog URL, and form destination.
3. Create a complete page inventory before building.
4. Create an asset inventory showing every image/media file used on each page.
5. Download and reuse the same website images and assets. Store them properly in the new web app project.
6. Recreate the site page by page using reusable components where sensible, but do not alter the visual output.
7. Maintain the exact order of sections on every page.
8. Preserve the exact wording and visual hierarchy of all headings, paragraphs, service descriptions, testimonials, prices, CTAs, and footer content.
9. Ensure the navigation menu, dropdowns, mobile menu, buttons, links, forms, and footer links work correctly.
10. Preserve existing external links, including Instagram, X/Twitter, LinkedIn, YouTube, email, WhatsApp, and any product/payment links.

Design Preservation Requirements:
The new app should visually match the current WordPress site as closely as possible. Pay attention to:

- Header layout
- Logo placement
- Navigation menu
- Dropdown menu behaviour
- Hero section layout
- Background colours
- Button style
- Font size hierarchy
- Section spacing
- Image dimensions and cropping
- Card layouts
- Service grids
- Testimonial layouts
- Blog card design
- Footer layout
- Mobile responsiveness
- WhatsApp floating button
- Forms and contact sections

Copy Preservation Requirements:
Extract all visible copy directly from the WordPress website and place it into the new web app exactly. Do not rewrite or polish anything. This includes:

- Hero headings and subheadings
- About page text
- Service names and descriptions
- Educational service packages
- Career service packages
- Product names and descriptions
- Prices
- FAQs
- Testimonials
- Blog titles and excerpts
- Contact details
- Footer text
- CTA labels
- Button text
- Legal/footer links

Image Preservation Requirements:
Use the same images currently used on the WordPress site. Do not replace them with stock photos, AI-generated images, new illustrations, or placeholders unless an original asset cannot be retrieved. If an asset cannot be retrieved, clearly document it in an “Asset Issues” section and use a temporary placeholder only as a last resort.

Link Preservation Requirements:
Create a link mapping table and verify that every link from the WordPress site has an equivalent working link in the new web app.

For internal links:
- Preserve the same route where possible.
- If the WordPress site uses trailing slashes, configure the app to support them.
- If the WordPress site has old /index.php/ URLs, support redirects to the clean equivalent routes.

For external links:
- Preserve the exact destination.
- Open external social/payment/WhatsApp links as they currently behave.
- Preserve email and phone/WhatsApp interactions.

Functional Requirements:
- Recreate all static pages.
- Recreate blog listing and blog detail pages if available.
- Recreate service/product listing pages.
- Recreate contact forms visually and functionally.
- Ensure form submissions are connected to an appropriate backend, form handler, or documented integration point.
- Preserve the WhatsApp floating contact button.
- Preserve responsive behaviour across mobile, tablet, and desktop.
- Ensure all navigation menus work on desktop and mobile.
- Ensure images are optimized without visually changing them.

Performance Requirements:
The web app should be faster than the WordPress version while maintaining the same visual design.

Optimize:
- Image loading
- JavaScript bundle size
- CSS structure
- Lazy loading
- Font loading
- Static rendering
- Caching
- Core Web Vitals

Do not remove content or visual sections just to improve performance.

SEO Requirements:
Preserve or recreate:
- Page titles
- Meta descriptions where available
- Heading hierarchy
- Alt text where available
- Blog URLs
- Canonical URLs where appropriate
- Open Graph metadata where available
- Sitemap
- Robots.txt

Accessibility Requirements:
Improve accessibility only where it does not change the visual design or copy. Ensure:
- Images have alt text where possible
- Buttons and links are keyboard accessible
- Forms have labels
- Colour contrast is not worsened
- Mobile navigation is accessible
- Semantic HTML is used

Quality Assurance Checklist:
Before completing the project, perform the following checks:

1. Visual comparison:
   - Compare the WordPress site and new web app side by side.
   - Test desktop, tablet, and mobile views.
   - Confirm that section order, spacing, images, cards, buttons, and footer match.

2. Copy audit:
   - Confirm all copy matches the original WordPress website exactly.
   - Do not correct typos or grammar unless explicitly instructed later.

3. Image audit:
   - Confirm all images match the original site.
   - Confirm no image has been replaced unnecessarily.

4. Link audit:
   - Confirm all internal page links work.
   - Confirm all external links work.
   - Confirm footer links work.
   - Confirm CTA buttons go to the correct destinations.
   - Confirm WhatsApp and email links work.

5. Responsive audit:
   - Test on common screen sizes:
     - Mobile: 360px, 390px, 430px
     - Tablet: 768px, 1024px
     - Desktop: 1280px, 1440px, 1920px

6. Performance audit:
   - Run Lighthouse or an equivalent performance test.
   - Optimize without changing the design or copy.

7. Build audit:
   - Ensure the app builds successfully.
   - Ensure there are no broken imports, missing assets, console errors, or route errors.

Deliverables:
Provide the following:

1. Complete modern web app codebase.
2. Recreated pages matching the WordPress website.
3. Downloaded image/media assets organized in the project.
4. Reusable component structure.
5. Route map showing original WordPress URL and new web app route.
6. Link map showing every preserved internal and external link.
7. Asset inventory showing all images used.
8. README with setup, development, build, and deployment instructions.
9. Notes on any assets, pages, links, or forms that could not be fully migrated.

Final Acceptance Criteria:
The project is complete only when the new modern web app looks, reads, and navigates like the current WordPress website, while running on a cleaner, faster, modern web app architecture. The design, copy, images, and links must remain the same.