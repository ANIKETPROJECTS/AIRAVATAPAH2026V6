import { TrendingUp, TrendingDown, Users, ClipboardList, IndianRupee, Shield, CheckCircle, Cpu } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useState, useEffect } from "react";

interface DashboardStats {
  kpis: {
    totalFarmers: number;
    pendingApplications: number;
    approvedApplications: number;
    activeInsuranceClaims: number;
    resolvedGrievances: number;
    totalGrievances: number;
    aiAutomationRate: number;
  };
  monthlyAppData: { month: string; approved: number; pending: number; rejected: number }[];
  schemeDistribution: { name: string; value: number; color: string }[];
  pendingActions: { id: string; farmer: string; type: string; status: string; confidence: number }[];
  activityFeed: { time: string; icon: string; text: string }[];
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium">{value}%</span>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
      <div className="h-4 w-24 bg-muted rounded mb-3" />
      <div className="h-7 w-16 bg-muted rounded mb-2" />
      <div className="h-3 w-32 bg-muted rounded" />
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<DashboardStats["pendingActions"]>([]);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(r => {
        if (!r.ok) throw new Error("Failed to load dashboard data");
        return r.json() as Promise<DashboardStats>;
      })
      .then(data => {
        setStats(data);
        setActionItems(data.pendingActions);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleAction = (id: string, action: string) => {
    if (action === "Approve") {
      setActionItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const kpiDefs = stats
    ? [
        { label: "Total Registered Farmers", value: stats.kpis.totalFarmers.toLocaleString("en-IN"), change: null, up: true, icon: Users },
        { label: "Pending Applications", value: stats.kpis.pendingApplications.toLocaleString("en-IN"), change: null, up: false, icon: ClipboardList },
        { label: "Approved Applications", value: stats.kpis.approvedApplications.toLocaleString("en-IN"), change: null, up: true, icon: IndianRupee },
        { label: "Active Insurance Claims", value: stats.kpis.activeInsuranceClaims.toLocaleString("en-IN"), change: null, up: true, icon: Shield },
        {
          label: "Grievances Resolved",
          value: `${stats.kpis.resolvedGrievances}/${stats.kpis.totalGrievances}`,
          change: null,
          up: true,
          icon: CheckCircle,
        },
        { label: "Approval Rate", value: `${stats.kpis.aiAutomationRate}%`, change: null, up: true, icon: Cpu },
      ]
    : [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-destructive">
          <p className="font-medium">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button
            className="mt-3 text-sm px-4 py-1.5 rounded bg-primary text-primary-foreground"
            onClick={() => { setLoading(true); setError(null); fetch("/api/dashboard/stats").then(r => r.json()).then(d => { setStats(d); setActionItems(d.pendingActions); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); }); }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpiDefs.map((kpi, i) => (
            <div key={kpi.label} className={`bg-card border border-border rounded-lg p-4 card-hover grain-bg animate-fade-in stagger-${i + 1}`} style={{ opacity: 0 }}>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className="h-4 w-4 text-secondary" />
                  {kpi.change ? (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.up ? "text-success" : "text-destructive"}`}>
                      {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {kpi.change}
                    </span>
                  ) : (
                    <span className={`text-xs font-medium ${kpi.up ? "text-success" : "text-destructive"}`}>
                      {kpi.up ? "↑" : "↓"} live
                    </span>
                  )}
                </div>
                <div className="text-2xl font-heading text-foreground animate-count-up">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
              </div>
            </div>
          ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5 grain-bg animate-fade-in" style={{ opacity: 0, animationDelay: "0.2s" }}>
          <div className="relative z-10">
            <h3 className="font-heading text-lg mb-4">Monthly Application Volume</h3>
            {loading ? (
              <div className="h-[280px] bg-muted/30 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats?.monthlyAppData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 15% 82%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="approved" stackId="a" fill="#1B4332" name="Approved" radius={[0,0,0,0]} />
                  <Bar dataKey="pending" stackId="a" fill="#D4A017" name="Pending" />
                  <Bar dataKey="rejected" stackId="a" fill="#DC2626" name="Rejected" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 grain-bg animate-fade-in" style={{ opacity: 0, animationDelay: "0.25s" }}>
          <div className="relative z-10">
            <h3 className="font-heading text-lg mb-4">Scheme-wise Distribution</h3>
            {loading ? (
              <div className="h-[280px] bg-muted/30 rounded animate-pulse" />
            ) : stats?.schemeDistribution && stats.schemeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.schemeDistribution}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                  >
                    {stats.schemeDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                No application data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed + Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5 grain-bg animate-fade-in" style={{ opacity: 0, animationDelay: "0.3s" }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg">Activity Feed</h3>
              <span className="text-xs text-muted-foreground">Live data</span>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
            ) : (stats?.activityFeed ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {(stats?.activityFeed ?? []).map((item, i) => (
                  <div key={i} className="flex gap-3 text-sm py-2 border-b border-border last:border-0">
                    <span className="text-base">{item.icon}</span>
                    <div>
                      {item.time && (
                        <span className="text-muted-foreground font-medium">{item.time}</span>
                      )}
                      {item.time && <span className="mx-1.5">—</span>}
                      <span>{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 grain-bg animate-fade-in" style={{ opacity: 0, animationDelay: "0.35s" }}>
          <div className="relative z-10">
            <h3 className="font-heading text-lg mb-4">Pending Action Items</h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
            ) : actionItems.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No pending items — all clear! ✅
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 font-medium">ID</th>
                      <th className="pb-2 font-medium">Farmer</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Conf.</th>
                      <th className="pb-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionItems.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 table-row-alt">
                        <td className="py-2 font-mono text-xs">{item.id}</td>
                        <td className="py-2 max-w-[100px] truncate">{item.farmer}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            item.type === "Grievance" ? "bg-destructive/10 text-destructive" :
                            item.status === "Under Review" ? "bg-warning/20 text-warning" :
                            "bg-info/10 text-info"
                          }`}>{item.type}</span>
                        </td>
                        <td className="py-2"><ConfidenceBar value={item.confidence} /></td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            <button className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-80">Review</button>
                            <button onClick={() => handleAction(item.id, "Approve")} className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:opacity-80">Approve</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
