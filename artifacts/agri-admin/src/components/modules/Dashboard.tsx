import { TrendingUp, TrendingDown, Users, ClipboardList, IndianRupee, Shield, CheckCircle, Cpu } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { monthlyAppData, schemeDistribution, activityFeed, pendingActions } from "@/data/dummyData";
import { useState } from "react";

const kpis = [
  { label: "Total Registered Farmers", value: "12,847", change: "+4.2%", up: true, icon: Users },
  { label: "Pending Applications", value: "342", change: "-8.1%", up: false, icon: ClipboardList },
  { label: "Subsidies Disbursed", value: "₹2.4 Cr", change: "+12.5%", up: true, icon: IndianRupee },
  { label: "Active Insurance Claims", value: "89", change: "+3.7%", up: true, icon: Shield },
  { label: "Grievances Resolved", value: "156/171", change: "+15.3%", up: true, icon: CheckCircle },
  { label: "AI Automation Rate", value: "73%", change: "+5.1%", up: true, icon: Cpu },
];

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

export default function Dashboard() {
  const [actionItems, setActionItems] = useState(pendingActions);

  const handleAction = (id: string, action: string) => {
    if (action === "Approve") {
      setActionItems(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className={`bg-card border border-border rounded-lg p-4 card-hover grain-bg animate-fade-in stagger-${i + 1}`} style={{ opacity: 0 }}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-4 w-4 text-secondary" />
                <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.up ? "text-success" : "text-destructive"}`}>
                  {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpi.change}
                </span>
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyAppData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 15% 82%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="approved" stackId="a" fill="#1B4332" name="Approved" radius={[0,0,0,0]} />
                <Bar dataKey="pending" stackId="a" fill="#D4A017" name="Pending" />
                <Bar dataKey="rejected" stackId="a" fill="#DC2626" name="Rejected" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 grain-bg animate-fade-in" style={{ opacity: 0, animationDelay: "0.25s" }}>
          <div className="relative z-10">
            <h3 className="font-heading text-lg mb-4">Scheme-wise Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={schemeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                  {schemeDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Feed + Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5 grain-bg animate-fade-in" style={{ opacity: 0, animationDelay: "0.3s" }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg">AI Activity Feed</h3>
              <button className="text-xs text-secondary hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {activityFeed.map((item, i) => (
                <div key={i} className="flex gap-3 text-sm py-2 border-b border-border last:border-0">
                  <span className="text-base">{item.icon}</span>
                  <div>
                    <span className="text-muted-foreground font-medium">{item.time}</span>
                    <span className="mx-1.5">—</span>
                    <span>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 grain-bg animate-fade-in" style={{ opacity: 0, animationDelay: "0.35s" }}>
          <div className="relative z-10">
            <h3 className="font-heading text-lg mb-4">Pending Action Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium">Farmer</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">AI Conf.</th>
                    <th className="pb-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {actionItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 table-row-alt">
                      <td className="py-2 font-mono text-xs">{item.id}</td>
                      <td className="py-2">{item.farmer}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.status === "Flagged" ? "bg-destructive/10 text-destructive" :
                          item.status === "Urgent" ? "bg-warning/20 text-warning" :
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
          </div>
        </div>
      </div>
    </div>
  );
}
