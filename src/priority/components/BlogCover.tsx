import type { BlogCoverKey } from '../data/blog';

/**
 * Decorative, on-brand cover art for blog cards and post headers.
 * Pure inline SVG (zero extra requests, a few hundred bytes each) so the blog
 * keeps its zero-JS / fast-3G budget. Each key pairs a brand gradient with a
 * simple line motif. Decorative only — the post title carries the meaning, so
 * the SVG is aria-hidden.
 */

const GRADIENTS: Record<BlogCoverKey, [string, string]> = {
  network: ['#2A4876', '#0077B6'],
  cv: ['#0077B6', '#3FA9F5'],
  scholarship: ['#005f92', '#3FA9F5'],
  toolkit: ['#152740', '#2A4876'],
};

function Motif({ cover }: { cover: BlogCoverKey }) {
  const stroke = 'rgba(255,255,255,0.92)';
  const faint = 'rgba(255,255,255,0.55)';
  const common = { fill: 'none', stroke, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (cover === 'network') {
    const nodes: [number, number][] = [[180, 95], [420, 90], [120, 215], [300, 175], [480, 210], [305, 285]];
    const edges: [number, number][] = [[0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [0, 1], [2, 5]];
    return (
      <g>
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={faint} strokeWidth={5} />
        ))}
        {nodes.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 3 ? 20 : 13} fill={i === 3 ? stroke : 'rgba(255,255,255,0.18)'} stroke={stroke} strokeWidth={5} />
        ))}
      </g>
    );
  }

  if (cover === 'cv') {
    return (
      <g>
        <rect x={222} y={78} width={150} height={196} rx={12} {...common} />
        {[120, 150, 180, 210].map((y) => (
          <line key={y} x1={250} y1={y} x2={344} y2={y} stroke={faint} strokeWidth={6} />
        ))}
        <line x1={250} y1={108} x2={320} y2={108} {...common} strokeWidth={8} />
        <circle cx={372} cy={250} r={34} fill="#2A4876" stroke={stroke} strokeWidth={6} />
        <path d="M357 250 l11 12 l20 -24" {...common} strokeWidth={7} />
      </g>
    );
  }

  if (cover === 'scholarship') {
    return (
      <g>
        <polygon points="300,92 418,140 300,188 182,140" {...common} />
        <path d="M236 161 v44 c0 22 128 22 128 0 v-44" {...common} />
        <path d="M418 140 v60" {...common} strokeWidth={6} />
        <circle cx={418} cy={208} r={9} fill={stroke} />
        <path d="M470 96 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6 z" fill={faint} />
      </g>
    );
  }

  // toolkit — checklist
  return (
    <g>
      {[110, 172, 234].map((y, i) => (
        <g key={y}>
          <rect x={196} y={y} width={46} height={46} rx={10} {...common} strokeWidth={6} />
          <path d={`M205 ${y + 24} l11 12 l20 -24`} {...common} strokeWidth={6} />
          <line x1={266} y1={y + 23} x2={i === 1 ? 392 : 410} y2={y + 23} stroke={faint} strokeWidth={8} />
        </g>
      ))}
    </g>
  );
}

export function BlogCover({ cover, className }: { cover: BlogCoverKey; className?: string }) {
  const [from, to] = GRADIENTS[cover];
  const gid = `bg-${cover}`;
  const dotId = `dots-${cover}`;
  return (
    <svg
      viewBox="0 0 600 340"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <pattern id={dotId} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="2.4" fill="rgba(255,255,255,0.16)" />
        </pattern>
      </defs>
      <rect width="600" height="340" fill={`url(#${gid})`} />
      <rect width="220" height="200" fill={`url(#${dotId})`} />
      <Motif cover={cover} />
    </svg>
  );
}
