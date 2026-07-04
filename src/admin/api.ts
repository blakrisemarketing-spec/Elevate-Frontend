import type { Scholarship } from '../match/match-data';

export type { Scholarship };

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'lost';

export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'interested', 'converted', 'lost'];

export type MatchRef = { id: string; name: string; blurb?: string; tier?: string; fundingType?: string };

export type LeadItem = {
  id?: number | string;
  uid: string;
  ts?: string;
  createdAt?: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneNormalized?: string;
  consent?: boolean;
  linkedin?: string;
  portfolio?: string;
  answers?: Record<string, string | string[]>;
  pathwayIds?: string[];
  scholarshipIds?: string[];
  pathways?: MatchRef[];
  scholarships?: MatchRef[];
  cvFile?: string;
  cvMeta?: { originalName?: string; mime?: string; size?: number; uploadedAt?: string };
  cvUploaded?: boolean;
  suspectedBot?: boolean;
  campaignEnrolled?: boolean;
  source?: string;
  status?: LeadStatus;
  statusUpdatedAt?: string;
  notesCount?: number;
  lastStep?: string;
  suppressed?: boolean;
  converted?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};

export type Purchase = {
  ts?: string;
  reference?: string;
  serviceId?: string;
  itemName?: string;
  type?: string;
  amountPesewas?: number;
  currency?: string;
  buyerName?: string;
  buyerEmail?: string;
  sessions?: string[];
  paystackStatus?: string;
};

export type LeadNote = { id: number | string; body: string; createdAt: string };

export type TimelineEntry = { step: string; dueAt?: string | null; status: 'sent' | 'skipped' | 'upcoming'; sentAt: string | null };

export type SuppressionInfo = { email: string; reason: string; created_at?: string };

export type LeadsResponse = { ok: boolean; total: number; items: LeadItem[] };

export type LeadDetailResponse = {
  ok: boolean;
  lead: LeadItem;
  notes: LeadNote[];
  timeline: TimelineEntry[];
  purchases: Purchase[];
  suppressed: SuppressionInfo | null;
  campaignEnrolled: boolean;
  unsubscribeUrl?: string;
};

export type PurchasesResponse = { ok: boolean; total?: number; items: Purchase[] };

export type ScholarshipsResponse = { ok: boolean; scholarships: Scholarship[] };

export type SourceFunnelRow = { source: string; leads: number; converted: number; revenuePesewas: number };

export type AdminStats = {
  leadsTotal: number;
  leadsRealTotal: number;
  leadsByStatus: Record<string, number>;
  leadsOverTime: { d: string; c: number }[];
  enrolled: number;
  convertedLeads: number;
  revenueFromLeadsPesewas: number;
  funnel: Record<string, number>;
  suppressions: Record<string, number>;
  purchasesTotal: number;
  revenueTotalPesewas: number;
  legacyImportDoneAt: string | null;
  leadsBySource: Record<string, number>;
  sourceFunnel: SourceFunnelRow[];
};

export type StatsResponse = { ok: boolean; stats: AdminStats };

export type LegacyImportResponse = { ok: boolean; report: Record<string, unknown> };

export type BulkAction =
  | { action: 'status'; uids: string[]; status: LeadStatus }
  | { action: 'suppress' | 'unsuppress'; uids: string[] };

export type BulkStatusResponse = { ok: boolean; updated: number };
export type BulkSuppressResponse = { ok: boolean; affected: number };

export type SavedViewFilter = { q: string; status: string };
export type SavedView = { id: number; name: string; filter: SavedViewFilter };
export type ViewsResponse = { ok: boolean; views: SavedView[] };
export type ViewSaveResponse = { ok: boolean; view: SavedView };

export type BroadcastHistoryItem = {
  id: number | string;
  createdAt: string;
  subject: string;
  recipientCount: number;
  sentCount: number;
  skippedCount: number;
  status: string;
};
export type BroadcastHistoryResponse = { ok: boolean; history: BroadcastHistoryItem[] };
export type BroadcastPreviewResponse = {
  ok: boolean;
  recipientCount: number;
  skipped: number;
  cap: number;
  sample: { name: string; email: string }[];
};
export type BroadcastSendResponse = {
  ok: boolean;
  sent: number;
  failed: number;
  skipped: number;
  cap: number;
  segmentEligible: number;
};

export type CurrentUser = { id: number; email: string; name: string };
export type LoginUser = { email: string; name: string };
export type LoginResponse = { ok: boolean; user: LoginUser };
export type MeResponse = { ok: boolean; user: CurrentUser };

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string;
};

export type AdminUsersResponse = { ok: boolean; users: AdminUser[] };

export type AdminUserAction =
  | { action: 'create'; email: string; name?: string; password?: string }
  | { action: 'reset'; id: number; password?: string }
  | { action: 'active'; id: number; active: boolean }
  | { action: 'delete'; id: number };

export type CreateUserResponse = { ok: boolean; user: AdminUser; password: string; generated: boolean };
export type ResetUserResponse = { ok: boolean; password: string; generated: boolean };
export type ActiveUserResponse = { ok: boolean; active: boolean };
export type DeleteUserResponse = { ok: boolean };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function isAuthError(e: unknown): boolean {
  return e instanceof ApiError && e.status === 401;
}

export function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError && e.status === 503) return 'The database is unreachable right now. Try again in a moment.';
  return e instanceof Error && e.message ? e.message : fallback;
}

export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new ApiError(data.message || 'Request failed', res.status);
  return data as T;
}
