/** Types for the 2027 platform endpoints (growth, finance, clients, work). */

export type Role = 'founder' | 'partner' | 'staff';

export const ROLE_LABELS: Record<Role, string> = { founder: 'Founder', partner: 'Partner / senior', staff: 'Staff' };

export function seesFinance(role?: Role): boolean {
  return role === 'founder' || role === 'partner';
}

export const CHANNEL_LABELS: Record<string, string> = {
  meta: 'Meta (FB / IG)',
  google_ads: 'Google Ads',
  organic_search: 'Organic search',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  email: 'Email',
  x: 'X / Twitter',
  youtube: 'YouTube',
  referral: 'Referral / word of mouth',
  events: 'Events',
  partnerships: 'Partnerships',
  direct: 'Direct / unknown',
  other: 'Other',
};

export const METHOD_LABELS: Record<string, string> = {
  paystack: 'Paystack',
  momo: 'Mobile money',
  bank: 'Bank transfer',
  cash: 'Cash',
  card: 'Card (other)',
  other: 'Other',
};

export function channelLabel(c: string): string {
  return CHANNEL_LABELS[c] || c;
}

// ── Growth ──────────────────────────────────────────────────────────────
export type GrowthMonth = {
  m: number; revenue: number; paystack: number; offline: number; orders: number; prevYear: number;
  newClients: number; spend: number; leads: number; target: number;
};
export type GrowthStats = {
  year: number;
  goal: { revenueTargetPesewas: number; clientsTarget: number | null; monthly: number[] };
  totals: {
    revenuePesewas: number; orders: number; paystackPesewas: number; offlinePesewas: number; newClients: number;
    activeClients: number; spendPesewas: number; leads: number; leadsConverted: number; prevYearRevenuePesewas: number;
    repeatClients: number; clientsWithOrders: number;
  };
  monthly: GrowthMonth[];
  byCategory: { category: string; revenue: number; orders: number }[];
  byProduct: { serviceId: string; name: string; category: string; revenue: number; orders: number }[];
  byMethod: { method: string; revenue: number; orders: number }[];
  byChannel: { channel: string; newClients: number; revenue: number; allRevenue: number; spend: number; leads: number }[];
  pairs: { from: string; to: string; count: number }[];
  availableYears: number[];
};
export type GrowthResponse = { ok: boolean; stats: GrowthStats; categories: Record<string, string> };

// ── Finance ─────────────────────────────────────────────────────────────
export type OfflineSale = {
  id: number; occurredAt: string; clientId: number; clientName: string; clientEmail: string; serviceId: string;
  itemName: string; amountPesewas: number; method: string; channel: string; reference: string; notes: string; recordedBy: string;
};
export type SpendRow = { id: number; spentOn: string; channel: string; campaign: string; amountPesewas: number; notes: string; recordedBy: string };
export type GoalRow = { period: string; revenueTargetPesewas: number; clientsTarget: number | null };
export type ServiceOption = { id: string; name: string; category: string; amountPesewas: number };
export type FinanceResponse = {
  ok: boolean; year: number; sales: OfflineSale[]; spend: SpendRow[]; goals: GoalRow[];
  services: ServiceOption[]; channels: string[]; methods: string[];
};

// ── Work ────────────────────────────────────────────────────────────────
export type EngagementStatus = 'intake' | 'in_progress' | 'client_review' | 'revisions' | 'delivered' | 'closed' | 'on_hold';

export const STATUS_LABELS: Record<EngagementStatus, string> = {
  intake: 'Intake',
  in_progress: 'In progress',
  client_review: 'Client review',
  revisions: 'Revisions',
  delivered: 'Delivered',
  closed: 'Closed',
  on_hold: 'On hold',
};

export const BOARD_COLUMNS: EngagementStatus[] = ['intake', 'in_progress', 'client_review', 'revisions', 'on_hold', 'delivered'];

export type Step = { id: number; label: string; done: boolean; doneAt: string | null; doneBy: string };
export type Engagement = {
  id: number; clientId: number; client: { id: number; name: string; email: string; phone: string } | null;
  sourceKind: string; sourceRef: string; serviceId: string; family: string; title: string; status: EngagementStatus;
  ownerId: number | null; ownerName: string; dueOn: string | null; overdue: boolean; clientMessage: string;
  steps: Step[]; stepsDone: number; stepsTotal: number; createdAt: string; statusUpdatedAt: string; deliveredAt: string | null;
};
export type TeamMember = { id: number; name: string; email: string; role: Role };
export type OpsSummary = {
  byStatus: Record<string, number>; overdue: number; unassigned: number; deliveredLast30: number;
  avgTurnaroundDays: number | null; byOwner: { ownerId: number | null; name: string; open: number; overdue: number }[];
};
export type WorkResponse = {
  ok: boolean; items: Engagement[]; summary: OpsSummary | null; team: TeamMember[];
  families: { id: string; label: string }[]; statuses: EngagementStatus[];
};
export type EngagementResponse = { ok: boolean; item: Engagement };

// ── Clients ─────────────────────────────────────────────────────────────
export type Client = {
  id: number; email: string; name: string; phone: string; acquisitionChannel: string; firstPurchaseAt: string | null;
  notes: string; portalEnabled: boolean; hasPassword: boolean; hasGoogle: boolean; lastLoginAt: string | null; createdAt: string;
  openWork?: number; revenuePesewas?: number;
};
export type Deliverable = {
  id: number; engagementId: number; title: string; fileName: string; mime: string; sizeBytes: number; version: number;
  clientVisible: boolean; uploadedBy: string; createdAt: string;
};
export type Application = {
  id: number; engagementId: number | null; kind: 'school' | 'job'; organization: string; title: string; location: string;
  url: string; deadline: string | null; status: string; clientNotes: string; internalNotes?: string; statusUpdatedAt: string; createdAt: string;
};
export type ActivityItem = { id: number; createdAt: string; actorName: string; kind: string; summary: string; clientVisible: boolean };
export type RevenueRow = { id: string; source: string; method: string; occurredAt: string; itemName: string; amountPesewas: number; channel: string };
export type ClientsResponse = { ok: boolean; items: Client[]; hasMore: boolean; channels: string[] };
export type ClientDetailResponse = {
  ok: boolean; client: Client; engagements: Engagement[]; deliverables: Deliverable[]; applications: Application[];
  activity: ActivityItem[]; revenue: RevenueRow[] | null;
  lead: { uid: string; createdAt: string; status: string; utmSource: string; utmCampaign: string } | null;
  schoolStatuses: string[]; jobStatuses: string[]; channels: string[];
};

export function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export function cedis(pesewas: number, compact = false): string {
  const v = pesewas / 100;
  if (compact && Math.abs(v) >= 1000) {
    return `GH₵${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: v >= 100000 ? 0 : 1 })}k`;
  }
  return `GH₵${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function pct(n: number, d: number): string {
  if (!d) return '–';
  return `${Math.round((n / d) * 100)}%`;
}
