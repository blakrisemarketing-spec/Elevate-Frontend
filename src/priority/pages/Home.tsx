import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { WhatsAppFAB } from '../components/WhatsAppFAB';
import { ServiceCard } from '../components/ServiceCard';
import { TestimonialCard } from '../components/TestimonialCard';
import { StepCard } from '../components/StepCard';
import { Stat } from '../components/Stat';

export function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader currentRoute="/" />

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div className="container-site pt-12 pb-16 lg:pt-20 lg:pb-24 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="inline-flex items-center text-sm font-semibold uppercase tracking-wider text-primary bg-primary-50 px-3 py-1 rounded-full mb-5">Welcome to Elevate</p>
              <h1 id="hero-heading" className="text-display-lg text-navy mb-5">
                Complete Hub for Unrivaled Career and Education Success
              </h1>
              <p className="text-lg text-ink-muted leading-relaxed mb-7 max-w-xl">
                Are you ready to ascend to new heights in your career or education? Welcome to Elevate Career Hub, your gateway to a transformative career experience.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a href="/contact-us/" className="btn-primary">Get Started</a>
                <a href="/career-services/" className="btn-secondary">Explore Services</a>
              </div>
            </div>
            <div className="lg:pl-6">
              <div className="rounded-xl bg-gradient-to-br from-primary to-navy text-white p-8 sm:p-10 shadow-soft">
                <p className="text-sm uppercase tracking-wider text-electric mb-3">Most of our clients are now in:</p>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <li>Harvard</li>
                  <li>EY</li>
                  <li>KPMG</li>
                  <li>PwC</li>
                  <li>McGill University</li>
                  <li>Simon Fraser University</li>
                  <li>University of British Columbia</li>
                  <li>Concordia University</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* About blurb + stats */}
        <section className="bg-surface" aria-labelledby="about-heading">
          <div className="container-site py-16 grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">About us</p>
              <h2 id="about-heading" className="text-headline-lg mb-5">Crafting Careers, Building Educational Futures</h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                Our story is one of dedication to empowering individuals on their career journeys and in achieving their educational goals. At Elevate, we believe in the transformative power of a thriving career and a world-class education.
              </p>
              <p className="text-ink-muted leading-relaxed mb-6">
                Whether you&rsquo;re seeking new opportunities, looking to enhance your skills, or craving mentorship to guide your path, Elevate is designed to be your ally in achieving your career and educational goals.
              </p>
              <a href="/about/" className="btn-secondary">Learn More</a>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <Stat value="5+" label="Years of experience" />
              <Stat value="2,000+" label="Satisfied clients" />
              <Stat value="99%" label="Positive reviews" />
            </div>
          </div>
        </section>

        {/* Services */}
        <section aria-labelledby="services-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Our Services</p>
              <h2 id="services-heading" className="text-headline-lg">Our Suite of Services for Career Ascension</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <ServiceCard
                title="Career Services"
                description="Elevate your career with our comprehensive Career Services. From professional resume writing to personalized interview coaching, we offer tailored solutions to help you navigate every stage of your career journey with confidence and success."
                href="/career-services/"
              />
              <ServiceCard
                title="Educational Services"
                description="Unlock your academic potential with our Educational Services. Whether you're selecting the perfect school or seeking expert guidance on academic planning, our dedicated team is here to support you in making informed decisions and achieving your educational goals."
                href="/educational-services/"
              />
              <ServiceCard
                title="DIY Products"
                description="Empower yourself with our range of DIY Products made to enhance your career and educational prospects. From resume templates to interview preparation guides, our products provide valuable resources to help you take control."
                href="/diy-products/"
              />
            </div>
          </div>
        </section>

        {/* Why choose us */}
        <section className="bg-surface" aria-labelledby="why-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Why choose us</p>
              <h2 id="why-heading" className="text-headline-lg">Unmatched and Unrivaled Excellence</h2>
              <p className="text-ink-muted leading-relaxed mt-4">
                Craft your unique success story with our trailblazing guidance, where your journey is an art of possibilities and achievements that paint the canvas of your future.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <article className="card text-center">
                <h3 className="text-headline-md mb-3">Professional Staff</h3>
                <p className="text-ink-muted leading-relaxed">Our expert staff ensures guidance with precision and excellence.</p>
              </article>
              <article className="card text-center">
                <h3 className="text-headline-md mb-3">Affordable Price</h3>
                <p className="text-ink-muted leading-relaxed">Competitive pricing tailored to your budget, ensuring accessibility without compromising quality.</p>
              </article>
              <article className="card text-center">
                <h3 className="text-headline-md mb-3">Complete Commitment</h3>
                <p className="text-ink-muted leading-relaxed">Experience our unwavering commitment to your success&mdash;every effort, every detail, meticulously aligned to propel you forward.</p>
              </article>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">How it works</p>
              <h2 id="how-heading" className="text-headline-lg">Unlocking Success: The Elevate Path Unveiled</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <StepCard step={1} title="Aspire, Consult, Elevate" description="Begin by selecting the specific service that aligns with your needs. Schedule a personalized consultation where our expert consultants will discuss your requirements, understand your aspirations, and provide insights into how our services can elevate your career or educational journey." />
              <StepCard step={2} title="Payment Prowess" description="Receive a transparent and detailed quote for the selected service. Once the payment is confirmed, our team initiates the tailored service, dedicating expert resources to deliver the personalized guidance, strategies, and solutions designed to meet your unique needs." />
              <StepCard step={3} title="Elevate Momentum" description="Experience the full spectrum of our service, complete with ongoing support. Track your progress, engage in further discussions, and receive additional insights as you implement our recommendations. Elevate Career Hub remains your dedicated partner on your journey toward success." />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-surface" aria-labelledby="testimonials-heading">
          <div className="container-site py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Testimonials</p>
              <h2 id="testimonials-heading" className="text-headline-lg">Positive Reviews From Our Clients</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <TestimonialCard
                author="Sarah"
                quote="Just wanted to shoot you a quick message to say a massive thank you for all your help getting me where I am now. Your help with my CV, LinkedIn tips and advice as well as that job application you practically held my hand through — it all made a huge difference. Three months into my new gig, and I'm loving it."
              />
              <TestimonialCard
                author="Samuella"
                quote="Thank you so much for your assistance with my SOP. I landed an unconditional offer with the University of Manchester!"
              />
              <TestimonialCard
                author="Nana Adjoa"
                quote="I just got an email this morning that I've been shortlisted to take the assessment by PwC. Thank you for that impeccable CV. Fingers crossed. I'll be back for interview tips."
              />
              <TestimonialCard
                author="Danielle"
                quote="This is a wonderful piece. It's as if you know my aspirations. The part about establishing a consultancy — spot on! A great work done. Thank you so much."
              />
              <TestimonialCard
                author="Davida"
                quote="I've looked at the LinkedIn Optimization SEVERAL TIMES. Emphasis on several times. I love it! And I just kept on smiling. It's like you took the words out of my head."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="cta-heading">
          <div className="container-site py-20">
            <div className="bg-gradient-to-br from-primary to-navy text-white rounded-xl p-10 sm:p-14 text-center shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-wider text-electric mb-3">Get started</p>
              <h2 id="cta-heading" className="text-headline-lg text-white mb-5">Take the First Step: Launch Your Success Story with Elevate</h2>
              <p className="text-white/90 text-lg max-w-xl mx-auto mb-8">
                Reach out and elevate your career journey today.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/contact-us/" className="btn-primary bg-electric text-navy hover:bg-electric-600">Let&rsquo;s talk</a>
                <a href="https://wa.me/233531113454" className="btn-secondary bg-transparent border-white text-white hover:bg-white/10" rel="noopener" target="_blank">WhatsApp us</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFAB />
    </>
  );
}
