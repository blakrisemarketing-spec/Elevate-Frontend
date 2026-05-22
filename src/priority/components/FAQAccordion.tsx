interface FAQ {
  question: string;
  answer: string;
}

interface FAQGroup {
  heading: string;
  items: FAQ[];
}

interface FAQAccordionProps {
  groups: FAQGroup[];
}

export function FAQAccordion({ groups }: FAQAccordionProps) {
  return (
    <div className="grid gap-10 lg:gap-12">
      {groups.map((group, gi) => (
        <div key={gi}>
          <h3 className="text-headline-md text-navy mb-5">{group.heading}</h3>
          <ul className="flex flex-col gap-3">
            {group.items.map((item, ii) => (
              <li key={ii}>
                <details className="group bg-white rounded-xl border border-black/5 open:shadow-soft">
                  <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 font-semibold text-navy">
                    <span>{item.question}</span>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary transition-transform group-open:rotate-45 shrink-0" aria-hidden="true">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-ink-muted leading-relaxed">{item.answer}</div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
