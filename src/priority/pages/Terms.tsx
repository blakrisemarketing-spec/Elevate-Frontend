import { LegalLayout, LH2, LP, LUL, LA } from '../components/LegalLayout';

const LAST_UPDATED = '9 June 2026';

export function TermsPage() {
  return (
    <LegalLayout
      currentRoute="/terms/"
      eyebrow="Legal"
      title="Terms &amp; Services"
      crumbLabel="Terms & Services"
      lastUpdated={LAST_UPDATED}
      intro={<p>The terms that govern your use of the Elevate Career Hub website, services, and digital products.</p>}
    >
      <LP>
        These Terms of Service (&ldquo;Terms&rdquo;) form an agreement between you and Elevate Career
        Hub (&ldquo;Elevate Career Hub&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;),
        located at No. 14 Street Adjah Adjonton, East Legon, Accra, Ghana. By accessing our website or
        purchasing our services or digital products, you agree to these Terms. If you do not agree,
        please do not use our website or services.
      </LP>

      <LH2>Our services</LH2>
      <LP>
        Elevate Career Hub provides career and education support, including CV and cover-letter writing,
        LinkedIn optimisation, interview preparation, graduate-school and scholarship application support,
        coaching and consultation sessions, and downloadable do-it-yourself (DIY) digital products. Service
        descriptions and prices are shown on our website and may be updated from time to time.
      </LP>

      <LH2>No guarantee of outcomes</LH2>
      <LP>
        We provide professional guidance, preparation, and document support to help you put your best
        foot forward. We do <strong>not</strong> guarantee any specific outcome, including a job offer,
        interview, shortlisting, admission, scholarship, visa, or relocation. Results depend on many
        factors outside our control, including your qualifications, the decisions of employers and
        institutions, and timing.
      </LP>

      <LH2>Bookings, payment, and pricing</LH2>
      <LUL>
        <li>Prices are listed in Ghanaian cedis (&#8373;) and are payable in full at the time of purchase
          unless we agree otherwise in writing.</li>
        <li>Payments are processed securely by Paystack. By paying, you also agree to Paystack&rsquo;s
          applicable terms.</li>
        <li>We may update our prices and offerings at any time, but changes will not affect orders already
          paid for.</li>
      </LUL>

      <LH2>Service delivery and your responsibilities</LH2>
      <LP>
        To deliver our services well, we rely on you to provide accurate, complete, and timely information
        and materials. Delays in providing what we need, or providing inaccurate information, may affect
        delivery timelines. You confirm that any documents or content you share with us are truthful and
        that you have the right to share them.
      </LP>

      <LH2>Digital products</LH2>
      <LP>
        DIY digital products are licensed to you for your own personal, non-commercial use. You may not
        resell, redistribute, share, or publish them, in whole or in part, without our written permission.
        Delivery and refund terms for digital products are set out in our{' '}
        <LA href="/refund-policy/">Refund &amp; Delivery Policy</LA>.
      </LP>

      <LH2>Intellectual property</LH2>
      <LP>
        All content on our website and in our products — including text, templates, guides, graphics, and
        branding — belongs to Elevate Career Hub or its licensors and is protected by applicable laws. You
        may not copy, reproduce, or reuse it except as expressly permitted.
      </LP>

      <LH2>Acceptable use</LH2>
      <LP>
        You agree not to misuse our website or services, including by attempting to disrupt the site,
        gain unauthorised access, infringe others&rsquo; rights, or use our materials for unlawful purposes.
      </LP>

      <LH2>Limitation of liability</LH2>
      <LP>
        To the fullest extent permitted by law, Elevate Career Hub will not be liable for any indirect,
        incidental, or consequential losses arising from your use of our website, services, or products.
        Nothing in these Terms excludes liability that cannot be excluded under applicable law.
      </LP>

      <LH2>Third-party links</LH2>
      <LP>
        Our website may link to third-party sites (such as Paystack or our social media). We are not
        responsible for the content or practices of those sites.
      </LP>

      <LH2>Governing law</LH2>
      <LP>
        These Terms are governed by the laws of the Republic of Ghana, and any disputes will be subject to
        the jurisdiction of the Ghanaian courts.
      </LP>

      <LH2>Changes to these Terms</LH2>
      <LP>
        We may revise these Terms from time to time. The &ldquo;Last updated&rdquo; date above shows when
        they were last changed. Continued use of our website or services after changes means you accept the
        updated Terms.
      </LP>

      <LH2>Contact us</LH2>
      <LP>
        Questions about these Terms? Contact us at{' '}
        <LA href="mailto:hello@elevatecareerhub.com">hello@elevatecareerhub.com</LA> or on WhatsApp at{' '}
        <LA href="https://wa.me/233531113454">+233 53 111 3454</LA>.
      </LP>
    </LegalLayout>
  );
}
