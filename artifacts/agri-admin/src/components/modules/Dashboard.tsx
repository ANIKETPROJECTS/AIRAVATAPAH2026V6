import {
  ClipboardList, Shield, CheckCircle,
  TrendingUp, AlertTriangle, UserPlus, FileText, Coins,
  ArrowUpRight, Users,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useState, useEffect, useCallback } from "react";

/* ── Types ────────────────────────────────────────────────── */
interface AppTypeStats { total: number; pending: number; approved: number; rejected: number; underReview: number }
interface DashboardStats {
  kpis: {
    totalFarmers: number; pendingApplications: number; approvedApplications: number;
    rejectedApplications: number; totalApplications: number; activeInsuranceClaims: number;
    resolvedGrievances: number; openGrievancesCount: number; totalGrievances: number; approvalRate: number;
  };
  farmersByStatus: Record<string, number>;
  applicationsByType: { scheme: AppTypeStats; subsidy: AppTypeStats; insurance: AppTypeStats };
  grievancesByStatus: Record<string, number>;
  grievancesByPriority: { High: number; Medium: number; Low: number };
  monthlyAppData: { month: string; approved: number; pending: number; rejected: number }[];
  schemeDistribution: { name: string; value: number; color: string }[];
  recentFarmers: { farmerId: string; name: string; district: string; status: string; source: string; addedAt: string }[];
  pendingActions: { id: string; farmer: string; type: string; status: string; priority: string }[];
  activityFeed: { time: string; icon: string; text: string; category: string }[];
}

/* ── Skeleton ─────────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

/* ── KPI Card (no icon) ───────────────────────────────────── */
function KpiCard({
  label, value, sub, delay = 0,
}: {
  label: string; value: string | number; sub?: string; delay?: number;
}) {
  return (
    <div
      className="bg-white border border-black rounded-xl p-4 flex flex-col gap-1.5 animate-fade-in"
      style={{ opacity: 0, animationDelay: `${delay}s` }}
    >
      <div className="text-3xl font-heading text-black leading-none mb-1">{value}</div>
      <div className="text-sm text-black font-medium">{label}</div>
      {sub && <div className="text-[11px] text-black/60 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Status Badge ─────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-800",
    Verified: "bg-teal-100 text-teal-800",
    Pending: "bg-yellow-100 text-yellow-900",
    Inactive: "bg-gray-100 text-gray-700",
    Cancelled: "bg-red-100 text-red-800",
    Open: "bg-yellow-100 text-yellow-900",
    "In Progress": "bg-blue-100 text-blue-800",
    Resolved: "bg-emerald-100 text-emerald-800",
    Escalated: "bg-red-100 text-red-800",
    Closed: "bg-gray-100 text-gray-700",
    Grievance: "bg-orange-100 text-orange-800",
    Scheme: "bg-teal-100 text-teal-800",
    Subsidy: "bg-violet-100 text-violet-800",
    Insurance: "bg-blue-100 text-blue-800",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

/* ── Priority Dot ─────────────────────────────────────────── */
function PriorityDot({ priority }: { priority: string }) {
  const color = priority === "High" ? "bg-red-500" : priority === "Medium" ? "bg-yellow-500" : "bg-green-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`} />;
}

/* ── App Type Card ────────────────────────────────────────── */
function AppTypeCard({
  icon: Icon, label, stats, color, delay,
}: {
  icon: React.ElementType; label: string; stats: AppTypeStats; color: string; delay: number;
}) {
  const pct = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
  return (
    <div className="bg-white border border-black rounded-xl p-5 animate-fade-in flex flex-col gap-4" style={{ opacity: 0, animationDelay: `${delay}s` }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div>
          <div className="font-heading text-sm text-black">{label}</div>
          <div className="text-xs text-black/60">{stats.total} total applications</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg py-2">
          <div className="text-lg font-bold text-black">{stats.pending + stats.underReview}</div>
          <div className="text-xs text-black/70">Pending</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg py-2">
          <div className="text-lg font-bold text-black">{stats.approved}</div>
          <div className="text-xs text-black/70">Approved</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg py-2">
          <div className="text-lg font-bold text-black">{stats.rejected}</div>
          <div className="text-xs text-black/70">Rejected</div>
        </div>
      </div>
      {stats.total > 0 && (
        <div>
          <div className="flex justify-between text-xs text-black/60 mb-1">
            <span>Approval rate</span>
            <span className="font-semibold text-black">{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-emerald-600 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Custom Pie Tooltip ───────────────────────────────────── */
function SchemeTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-black rounded-lg px-3 py-2 shadow-lg text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.payload.color }} />
        <span className="font-medium text-black max-w-[180px] leading-tight">{d.name}</span>
      </div>
      <div className="text-black/60 mt-0.5 pl-4">{d.value}% of applications</div>
    </div>
  );
}

/* ── Farmer Status Row ────────────────────────────────────── */
function FarmerStatusRow({ byStatus }: { byStatus: Record<string, number> }) {
  const statuses = ["Active", "Verified", "Pending", "Inactive", "Cancelled"];
  const colors: Record<string, string> = {
    Active: "#10B981", Verified: "#0D9488", Pending: "#F59E0B", Inactive: "#9CA3AF", Cancelled: "#EF4444",
  };
  const total = Object.values(byStatus).reduce((s, v) => s + v, 0);
  if (total === 0) return <div className="text-sm text-black">No farmer data</div>;
  return (
    <div className="space-y-3">
      <div className="flex rounded-full h-3 overflow-hidden gap-0.5">
        {statuses.map(s => {
          const count = byStatus[s] ?? 0;
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return <div key={s} className="h-full rounded-sm" style={{ width: `${pct}%`, backgroundColor: colors[s] }} title={`${s}: ${count}`} />;
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {statuses.map(s => {
          const count = byStatus[s] ?? 0;
          if (count === 0) return null;
          return (
            <div key={s} className="flex items-center gap-1.5 text-xs text-black">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[s] }} />
              {s}: <span className="font-semibold text-black">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────── */
export default function Dashboard({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<DashboardStats["pendingActions"]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/dashboard/stats");
      if (!r.ok) throw new Error("Failed to load dashboard data");
      const data = await r.json() as DashboardStats;
      setStats(data);
      setActionItems(data.pendingActions);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
        <p className="text-black text-sm">{error}</p>
        <button className="text-sm px-4 py-1.5 rounded-lg border border-black bg-white text-black hover:bg-gray-50" onClick={() => load()}>
          Retry
        </button>
      </div>
    );
  }

  const s = stats;
  const nav = (key: string) => onNavigate?.(key);

  const activeScheme   = s ? (s.applicationsByType.scheme?.pending ?? 0) + (s.applicationsByType.scheme?.underReview ?? 0) : 0;
  const activeSubsidy  = s ? (s.applicationsByType.subsidy?.pending ?? 0) + (s.applicationsByType.subsidy?.underReview ?? 0) : 0;
  const activeInsurance = s ? (s.applicationsByType.insurance?.pending ?? 0) + (s.applicationsByType.insurance?.underReview ?? 0) : 0;

  const grievanceStatusData = s?.grievancesByStatus
    ? Object.entries(s.grievancesByStatus).map(([name, value], i) => ({
        name, value,
        color: ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#6B7280", "#DC2626"][i % 6],
      }))
    : [];

  const grievancePriorityData = s?.grievancesByPriority
    ? [
        { name: "High",   value: s.grievancesByPriority.High ?? 0,   color: "#EF4444" },
        { name: "Medium", value: s.grievancesByPriority.Medium ?? 0, color: "#F59E0B" },
        { name: "Low",    value: s.grievancesByPriority.Low ?? 0,    color: "#10B981" },
      ].filter(d => d.value > 0)
    : [];

  return (
    <div className="space-y-6 pb-6">

      {/* ── Section 1: 8-card KPI row ── */}
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-3">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-black rounded-xl p-4 flex flex-col gap-2">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))
        ) : (
          <>
            {/* Original 5 */}
            <KpiCard
              label="Registered Farmers"
              value={s!.kpis.totalFarmers.toLocaleString("en-IN")}
              sub="All statuses"
              delay={0.04}
            />
            <KpiCard
              label="Pending Applications"
              value={s!.kpis.pendingApplications.toLocaleString("en-IN")}
              sub={`of ${s!.kpis.totalApplications} total`}
              delay={0.08}
            />
            <KpiCard
              label="Approved Applications"
              value={s!.kpis.approvedApplications.toLocaleString("en-IN")}
              sub={`${s!.kpis.approvalRate}% approval rate`}
              delay={0.12}
            />
            <KpiCard
              label="Open Grievances"
              value={s!.kpis.openGrievancesCount.toLocaleString("en-IN")}
              sub={`${s!.kpis.resolvedGrievances} resolved`}
              delay={0.16}
            />
            <KpiCard
              label="Active Insurance Claims"
              value={s!.kpis.activeInsuranceClaims.toLocaleString("en-IN")}
              sub="Pending / Under Review"
              delay={0.20}
            />
            {/* 3 new cards */}
            <KpiCard
              label="Active Scheme Apps"
              value={activeScheme.toLocaleString("en-IN")}
              sub={`of ${s!.applicationsByType.scheme?.total ?? 0} scheme total`}
              delay={0.24}
            />
            <KpiCard
              label="Active Subsidy Apps"
              value={activeSubsidy.toLocaleString("en-IN")}
              sub={`of ${s!.applicationsByType.subsidy?.total ?? 0} subsidy total`}
              delay={0.28}
            />
            <KpiCard
              label="Active Insurance Apps"
              value={activeInsurance.toLocaleString("en-IN")}
              sub={`of ${s!.applicationsByType.insurance?.total ?? 0} insurance total`}
              delay={0.32}
            />
          </>
        )}
      </div>

      {/* ── Section 2: Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Monthly volume */}
        <div className="lg:col-span-3 bg-white border border-black rounded-xl p-5 animate-fade-in" style={{ opacity: 0, animationDelay: "0.36s" }}>
          <h3 className="font-heading text-base mb-4 text-black">Monthly Application Volume</h3>
          {loading ? (
            <Skeleton className="h-60 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={s?.monthlyAppData ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#000" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#000" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #000" }} />
                <Bar dataKey="approved" stackId="a" fill="#1B4332" name="Approved" />
                <Bar dataKey="pending"  stackId="a" fill="#D4A017" name="Pending" />
                <Bar dataKey="rejected" stackId="a" fill="#EF4444" name="Rejected" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-5 mt-2 justify-center">
            {[{ color: "#1B4332", label: "Approved" }, { color: "#D4A017", label: "Pending" }, { color: "#EF4444", label: "Rejected" }].map(d => (
              <div key={d.label} className="flex items-center gap-1.5 text-xs text-black">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                {d.label}
              </div>
            ))}
          </div>
        </div>

        {/* Scheme distribution */}
        <div className="lg:col-span-2 bg-white border border-black rounded-xl p-5 animate-fade-in" style={{ opacity: 0, animationDelay: "0.4s" }}>
          <h3 className="font-heading text-base mb-2 text-black">Scheme Distribution</h3>
          {loading ? (
            <Skeleton className="h-60 w-full" />
          ) : !s?.schemeDistribution?.length ? (
            <div className="h-60 flex flex-col items-center justify-center text-black text-sm gap-2">
              <FileText className="h-8 w-8 opacity-30" />
              <span>No applications yet</span>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={s.schemeDistribution}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {s.schemeDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<SchemeTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {s.schemeDistribution.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-black truncate" title={entry.name}>{entry.name}</span>
                    </div>
                    <span className="font-semibold text-black ml-2 flex-shrink-0">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Section 3: Quick Actions ── */}
      <div className="bg-white border border-black rounded-xl p-5 animate-fade-in" style={{ opacity: 0, animationDelay: "0.44s" }}>
        <h3 className="font-heading text-base mb-3 text-black">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: UserPlus,      label: "New Registration",    key: "newregistration", color: "#1B4332" },
            { icon: ClipboardList, label: "Review Applications", key: "applications",    color: "#D4A017" },
            { icon: AlertTriangle, label: "Manage Grievances",   key: "grievances",      color: "#EF4444" },
            { icon: FileText,      label: "Reports & Analytics", key: "reports",         color: "#3B82F6" },
          ].map(({ icon: Icon, label, key, color }) => (
            <button
              key={key}
              onClick={() => nav(key)}
              className="flex items-center gap-3 p-3 rounded-lg border border-black bg-white hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <span className="text-sm font-semibold text-black">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 4: Application type breakdown ── */}
      <div>
        <h3 className="font-heading text-base mb-3 text-black">Application Pipeline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-black rounded-xl p-5 flex flex-col gap-4">
                <Skeleton className="h-9 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-6 w-full" />
              </div>
            ))
          ) : (
            <>
              <AppTypeCard icon={FileText} label="Scheme Applications" stats={s!.applicationsByType.scheme ?? { total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 }} color="#0D9488" delay={0.48} />
              <AppTypeCard icon={Coins}    label="Subsidy Applications" stats={s!.applicationsByType.subsidy ?? { total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 }} color="#7C3AED" delay={0.52} />
              <AppTypeCard icon={Shield}   label="Insurance Claims"     stats={s!.applicationsByType.insurance ?? { total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 }} color="#2563EB" delay={0.56} />
            </>
          )}
        </div>
      </div>

      {/* ── Section 5: Farmer status + Grievance overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Farmer Status */}
        <div className="bg-white border border-black rounded-xl p-5 animate-fade-in" style={{ opacity: 0, animationDelay: "0.6s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-base text-black">Farmer Status Overview</h3>
            <button onClick={() => nav("farmers")} className="text-xs text-black hover:underline flex items-center gap-1 font-medium">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          {loading ? <Skeleton className="h-28 w-full" /> : (
            <>
              <FarmerStatusRow byStatus={s!.farmersByStatus} />
              {s!.recentFarmers.length > 0 && (
                <div className="mt-4 border-t border-black/10 pt-4">
                  <div className="text-xs font-semibold text-black mb-2">Recent Registrations</div>
                  <div className="space-y-2">
                    {s!.recentFarmers.slice(0, 4).map(f => (
                      <div key={f.farmerId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center font-semibold text-xs flex-shrink-0 text-black">
                            {f.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-black truncate">{f.name}</div>
                            <div className="text-xs text-black/60">{f.district} · {f.farmerId}</div>
                          </div>
                        </div>
                        <StatusPill status={f.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Grievance Overview */}
        <div className="bg-white border border-black rounded-xl p-5 animate-fade-in" style={{ opacity: 0, animationDelay: "0.64s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-base text-black">Grievance Overview</h3>
            <button onClick={() => nav("grievances")} className="text-xs text-black hover:underline flex items-center gap-1 font-medium">
              Manage <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          {loading ? <Skeleton className="h-28 w-full" /> : s!.kpis.totalGrievances === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-black text-sm gap-2">
              <CheckCircle className="h-8 w-8 text-emerald-600 opacity-60" />
              <span>No grievances filed yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* By status */}
              <div>
                <div className="text-xs font-semibold text-black mb-2">By Status</div>
                <div className="space-y-1.5">
                  {grievanceStatusData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-black">{d.name}</span>
                      </div>
                      <span className="font-semibold text-black">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* By priority + mini chart */}
              <div>
                <div className="text-xs font-semibold text-black mb-2">By Priority</div>
                {grievancePriorityData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={80}>
                      <PieChart>
                        <Pie data={grievancePriorityData} cx="50%" cy="50%" innerRadius={22} outerRadius={38} paddingAngle={2} dataKey="value">
                          {grievancePriorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "6px", border: "1px solid #000" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-1 mt-1">
                      {grievancePriorityData.map(d => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <PriorityDot priority={d.name} />
                            <span className="text-black">{d.name}</span>
                          </div>
                          <span className="font-semibold text-black">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-black">No data</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 6: Pending Actions + Activity Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Actions */}
        <div className="bg-white border border-black rounded-xl p-5 animate-fade-in" style={{ opacity: 0, animationDelay: "0.68s" }}>
          <h3 className="font-heading text-base mb-4 text-black">Pending Action Items</h3>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : actionItems.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-black text-sm gap-2">
              <CheckCircle className="h-8 w-8 text-emerald-600 opacity-60" />
              <span>All clear — no pending actions!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {actionItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-black/10 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-black/60">{item.id}</span>
                      <StatusPill status={item.type} />
                    </div>
                    <div className="text-sm font-semibold text-black truncate mt-0.5">{item.farmer}</div>
                    <div className="flex items-center gap-1 text-xs text-black/60 mt-0.5">
                      <PriorityDot priority={item.priority} />
                      {item.priority} priority · {item.status}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => nav(item.type === "Grievance" ? "grievances" : "applications")}
                      className="text-xs px-2.5 py-1 rounded-full bg-black text-white hover:bg-black/80 transition-opacity font-medium"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => setActionItems(prev => prev.filter(a => a.id !== item.id))}
                      className="text-xs px-2.5 py-1 rounded-full border border-black text-black hover:bg-gray-100 transition-colors font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white border border-black rounded-xl p-5 animate-fade-in" style={{ opacity: 0, animationDelay: "0.72s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-base text-black">Recent Activity</h3>
            <span className="text-xs text-black font-medium bg-gray-100 border border-black/20 px-2 py-0.5 rounded-full">Live</span>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (s?.activityFeed ?? []).length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-black text-sm gap-2">
              <TrendingUp className="h-8 w-8 opacity-30" />
              <span>No recent activity to show</span>
            </div>
          ) : (
            <div className="space-y-0">
              {(s?.activityFeed ?? []).map((item, i) => (
                <div key={i} className="flex gap-3 py-2.5 border-b border-black/10 last:border-0">
                  <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-black leading-snug">{item.text}</p>
                    {item.time && (
                      <p className="text-xs text-black/50 mt-0.5">{item.time}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
