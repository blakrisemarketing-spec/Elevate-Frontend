interface StepCardProps {
  step: number;
  title: string;
  description: string;
}

export function StepCard({ step, title, description }: StepCardProps) {
  return (
    <article className="card relative pt-12">
      <span
        className="absolute -top-5 left-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-electric text-navy font-display text-xl font-bold shadow-soft"
        aria-hidden="true"
      >
        {step}
      </span>
      <h3 className="text-headline-md mb-3">{title}</h3>
      <p className="text-ink-muted leading-relaxed">{description}</p>
    </article>
  );
}
