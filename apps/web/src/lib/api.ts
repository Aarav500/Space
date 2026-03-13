const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("orbitshield_token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/* ─── Auth ─────────────────────────────────────────────────────────── */

export const authApi = {
  register: (email: string, password: string, orgName: string) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, orgName }) }),
  login: (email: string, password: string) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
};

/* ─── Satellites ───────────────────────────────────────────────────── */

export interface Satellite {
  id: string;
  norad_id: number;
  name: string;
  orbit_type: string;
  current_risk_score: number;
  risk_level: string;
  last_updated: string;
  created_at: string;
}

export interface Conjunction {
  id: string;
  secondary_norad_id: number;
  secondary_name: string;
  tca: string;
  miss_distance_km: string;
  relative_velocity_kms: string | null;
  collision_probability: string;
}

export const satelliteApi = {
  list: () => apiFetch<{ data: Satellite[] }>("/api/satellites"),
  add: (noradId: number, name?: string) =>
    apiFetch<{ data: Satellite }>("/api/satellites", { method: "POST", body: JSON.stringify({ noradId, name }) }),
  remove: (id: string) =>
    apiFetch("/api/satellites/" + id, { method: "DELETE" }),
  getRisk: (id: string) =>
    apiFetch<{ riskScore: number; riskLevel: string; forecast72h: { hour: number; predictedPc: number; riskLevel: string }[]; conjunctions: Conjunction[] }>(`/api/satellites/${id}/risk`),
  getConjunctions: (id: string, days = 7) =>
    apiFetch<{ data: Conjunction[] }>(`/api/satellites/${id}/conjunctions?days=${days}`),
  getRiskHistory: (id: string, hours = 168) =>
    apiFetch<{ data: Record<string, unknown>[] }>(`/api/satellites/${id}/risk-history?hours=${hours}`),
};

/* ─── Dashboard ────────────────────────────────────────────────────── */

export interface DashboardOverview {
  totalSats: number;
  avgRisk: number;
  criticalCount: number;
  activePolicies: number;
  riskDistribution: { risk_level: string; count: number }[];
  recentAlerts: { id: string; severity: string; message: string; satellite_name: string; created_at: string }[];
}

export const dashboardApi = {
  overview: () => apiFetch<DashboardOverview>("/api/dashboard/overview"),
};

/* ─── Space Weather ────────────────────────────────────────────────── */

export const weatherApi = {
  current: () => apiFetch<{ kp: number; f107: number; stormLevel: string | null; timestamp: string }>("/api/space-weather/current"),
  forecast: () => apiFetch<{ data: Record<string, unknown>[] }>("/api/space-weather/forecast"),
  history: (hours = 72) => apiFetch<{ data: Record<string, unknown>[] }>(`/api/space-weather/history?hours=${hours}`),
};

/* ─── Alerts ───────────────────────────────────────────────────────── */

export const alertApi = {
  list: (limit = 50) => apiFetch<{ data: Record<string, unknown>[] }>(`/api/alerts?limit=${limit}`),
  configure: (satelliteId: string | null, pcThreshold: number, channels: string[]) =>
    apiFetch("/api/alerts/configure", { method: "POST", body: JSON.stringify({ satelliteId, pcThreshold, channels }) }),
  getConfig: () => apiFetch<{ data: Record<string, unknown>[] }>("/api/alerts/config"),
};

/* ─── Coverage ─────────────────────────────────────────────────────── */

export interface CoveragePolicy {
  id: string;
  satellite_name: string;
  norad_id: number;
  coverage_start: string;
  coverage_end: string | null;
  hourly_premium_cents: number;
  max_payout_cents: number;
  status: string;
}

export const coverageApi = {
  quote: (satelliteId: string, hours: number) =>
    apiFetch<{ hourlyCents: number; totalCents: number; maxPayoutCents: number; currency: string }>("/api/coverage/quote", { method: "POST", body: JSON.stringify({ satelliteId, hours }) }),
  checkout: (satelliteId: string, hours: number) =>
    apiFetch<{ sessionId: string; url: string }>("/api/coverage/checkout", { method: "POST", body: JSON.stringify({ satelliteId, hours }) }),
  policies: () => apiFetch<{ data: CoveragePolicy[] }>("/api/coverage/policies"),
};
