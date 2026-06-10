import { LegalLayout, LH2, LP, LUL, LA } from '../components/LegalLayout';

const LAST_UPDATED = '9 June 2026';

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      currentRoute="/privacy-policy/"
      eyebrow="Legal"
      title="Privacy Policy"
      crumbLabel="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro={<p>How Elevate Career Hub collects, uses, and protects your personal information.</p>}
    >
      <LP>
        This Privacy Policy explains how Elevate Career Hub (&ldquo;Elevate Career Hub&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), located at No. 14 Street
        Adjah Adjonton, East Legon, Accra, Ghana, handles information about you when you visit
        our website, contact us, or purchase our services and digital products. By using our
        website or services, you agree to the practices described here.
      </LP>

      <LH2>Information we collect</LH2>
      <LP>We collect information in the following ways:</LP>
      <LUL>
        <li><strong>Information you give us</strong> — your name, email address, phone number,
          and any details you share when you message us on WhatsApp or by email, book a
          service, or submit documents such as CVs, essays, or applications for us to work on.</li>
        <li><strong>Payment information</strong> — when you buy a service or digital product,
          payment is processed by our payment provider, Paystack. We receive a transaction
          reference and confirmation of payment, but we do not collect or store your full
          card or bank details.</li>
        <li><strong>Information collected automatically</strong> — basic technical data such as
          your browser type, device, and pages visited, which may be gathered through cookies
          or similar technologies to keep the site working and understand how it is used.</li>
      </LUL>

      <LH2>How we use your information</LH2>
      <LP>We use the information we collect to:</LP>
      <LUL>
        <li>Provide the services and digital products you request and communicate with you about them.</li>
        <li>Prepare and review your documents (for example CVs, cover letters, statements, and applications).</li>
        <li>Process payments and send purchase confirmations and receipts.</li>
        <li>Respond to your enquiries and provide support.</li>
        <li>Improve our website, services, and customer experience.</li>
        <li>Meet legal, tax, and regulatory obligations.</li>
      </LUL>

      <LH2>How we share information</LH2>
      <LP>
        We do not sell your personal information. We share it only where necessary, including with:
      </LP>
      <LUL>
        <li><strong>Paystack</strong>, to process your payments securely.</li>
        <li><strong>Our email provider</strong> (toSend), to deliver confirmations, receipts, and digital products.</li>
        <li><strong>Service providers</strong> who help us operate our business under appropriate confidentiality obligations.</li>
        <li><strong>Authorities or advisers</strong>, where required by law or to protect our legal rights.</li>
      </LUL>

      <LH2>Payments and security</LH2>
      <LP>
        Card and mobile-money payments are handled on Paystack&rsquo;s secure, PCI-compliant
        platform. We verify each transaction with Paystack before fulfilling an order. While we
        take reasonable measures to protect the information we hold, no method of transmission or
        storage is completely secure, and we cannot guarantee absolute security.
      </LP>

      <LH2>Cookies</LH2>
      <LP>
        Our website may use cookies and similar technologies to function correctly and to help us
        understand site usage. You can control or disable cookies through your browser settings,
        though some parts of the site may not work as intended if you do.
      </LP>

      <LH2>Data retention</LH2>
      <LP>
        We keep your personal information only for as long as needed to provide our services, meet
        legal and accounting requirements, and resolve disputes. When information is no longer
        required, we delete or anonymise it.
      </LP>

      <LH2>Your rights</LH2>
      <LP>
        Subject to applicable law, you may request access to the personal information we hold about
        you, ask us to correct or delete it, or object to certain uses. To make a request, contact
        us using the details below. We may need to verify your identity before acting on a request.
      </LP>

      <LH2>Children</LH2>
      <LP>
        Our services are intended for adults and students of working or university age. We do not
        knowingly collect personal information from children under 16 without appropriate consent.
      </LP>

      <LH2>Changes to this policy</LH2>
      <LP>
        We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at
        the top of this page shows when it was last revised. Significant changes will be reflected
        on this page.
      </LP>

      <LH2>Contact us</LH2>
      <LP>
        If you have questions about this Privacy Policy or how we handle your information, contact us
        at <LA href="mailto:hello@elevatecareerhub.com">hello@elevatecareerhub.com</LA> or on WhatsApp
        at <LA href="https://wa.me/233531113454">+233 53 111 3454</LA>.
      </LP>
    </LegalLayout>
  );
}
