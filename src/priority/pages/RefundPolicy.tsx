import { LegalLayout, LH2, LP, LUL, LA } from '../components/LegalLayout';

const LAST_UPDATED = '9 June 2026';

export function RefundPolicyPage() {
  return (
    <LegalLayout
      currentRoute="/refund-policy/"
      eyebrow="Legal"
      title="Refund &amp; Delivery Policy"
      crumbLabel="Refund & Delivery Policy"
      lastUpdated={LAST_UPDATED}
      intro={<p>How we deliver our services and digital products, and when refunds apply.</p>}
    >
      <LP>
        This Refund &amp; Delivery Policy explains how Elevate Career Hub, located at No. 14 Street
        Adjah Adjonton, East Legon, Accra, Ghana, delivers its services and digital products and the
        circumstances in which refunds are available. It should be read together with our{' '}
        <LA href="/terms/">Terms &amp; Services</LA>.
      </LP>

      <LH2>How we deliver</LH2>
      <LUL>
        <li><strong>Services</strong> (CV writing, coaching, application support, interview prep, and
          similar) are delivered remotely. After payment, we contact you using the details you provide
          — usually by email or WhatsApp — to begin work, agree on what is needed, and schedule any
          sessions.</li>
        <li><strong>Digital products</strong> (DIY guides and templates) are delivered electronically.
          Where a download is available, a link is sent to the email address used at checkout. If a
          product is not yet available as an instant download, our team will email it to you shortly
          after purchase.</li>
      </LUL>

      <LH2>Delivery timelines</LH2>
      <LP>
        We aim to make first contact for services within one business day of payment, and to deliver
        digital products promptly after purchase. Specific turnaround times for completed work depend on
        the service and on how quickly you provide the information and materials we need.
      </LP>

      <LH2>Refunds on digital products</LH2>
      <LP>
        Because digital products are delivered instantly and cannot be returned, all sales of digital
        products are <strong>final and non-refundable</strong> once the product has been delivered or the
        download has been accessed. If you experience a technical problem accessing a product, contact us
        and we will make sure you receive it.
      </LP>

      <LH2>Refunds on services</LH2>
      <LUL>
        <li>If you cancel a service <strong>before we have begun work</strong>, you may request a refund.
          A small payment-processing fee may be deducted.</li>
        <li>Once work has started (for example, drafting has begun or a session has been held), fees for
          the completed or in-progress portion are non-refundable, as the work reflects time and expertise
          already provided.</li>
        <li>If we are unable to deliver a service you have paid for, we will offer a suitable alternative
          or a refund for the undelivered portion.</li>
      </LUL>

      <LH2>How to request a refund</LH2>
      <LP>
        To request a refund or raise an issue with an order, email{' '}
        <LA href="mailto:hello@elevatecareerhub.com">hello@elevatecareerhub.com</LA> with your name and
        your Paystack payment reference. We will review your request and respond within a reasonable time.
        Approved refunds are returned to the original payment method through Paystack.
      </LP>

      <LH2>Chargebacks</LH2>
      <LP>
        If you believe a charge is incorrect, please contact us first so we can resolve it directly.
        Raising a chargeback without contacting us may delay resolution.
      </LP>

      <LH2>Contact us</LH2>
      <LP>
        For anything to do with delivery or refunds, reach us at{' '}
        <LA href="mailto:hello@elevatecareerhub.com">hello@elevatecareerhub.com</LA> or on WhatsApp at{' '}
        <LA href="https://wa.me/233531113454">+233 53 111 3454</LA>.
      </LP>
    </LegalLayout>
  );
}
