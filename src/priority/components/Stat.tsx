interface StatProps {
  value: string;
  label: string;
}

export function Stat({ value, label }: StatProps) {
  return (
    <div>
      <div className="text-display-lg text-primary leading-none">{value}</div>
      <div className="text-sm uppercase tracking-wide text-ink-muted mt-2">{label}</div>
    </div>
  );
}
