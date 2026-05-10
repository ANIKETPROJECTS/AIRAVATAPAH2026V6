import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis } from "recharts";
import { registrationTrend, approvalRates, grievanceByDistrict, aiConfidenceOverride } from "@/data/dummyData";
import { TrendingUp, Brain, Download } from "lucide-react";

const insights = [
  { icon: "📈", text: "Application volume expected to rise 34% in July (Kharif season). Recommend pre-deploying 2 additional verification staff." },
  { icon: "⚠️", text: "Nagpur district showing 18% higher claim rate than average. Satellite data suggests locust risk — alert district officer." },
  { icon: "💡", text: "67 farmers eligible for KCC scheme have not applied. Suggest targeted SMS outreach campaign." },
];

export default function ReportsAnalytics() {
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  return (
    <div className="space-y-6 animate-fade-in" style={{ opacity: 0 }}>
      {toast && <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>{toast}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" defaultValue="2024-01-01" className="text-sm bg-card border border-border rounded-lg px-3 py-2" />
        <span className="text-muted-foreground">to</span>
        <input type="date" defaultValue="2024-06-30" className="text-sm bg-card border border-border rounded-lg px-3 py-2" />
        <select className="text-sm bg-card border border-border rounded-lg px-3 py-2"><option>All Districts</option></select>
        <select className="text-sm bg-card border border-border rounded-lg px-3 py-2"><option>All Schemes</option></select>
        <button className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Generate Report</button>
        <div className="ml-auto relative group">
          <button className="text-sm px-3 py-2 bg-secondary text-secondary-foreground rounded-lg flex items-center gap-1.5"><Download className="h-4 w-4" /> Export</button>
          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg hidden group-hover:block z-10">
            {["PDF", "Excel", "CSV"].map(f => (
              <button key={f} onClick={() => showToast(`📁 ${f} export started...`)} className="block w-full text-left text-sm px-4 py-2 hover:bg-muted">{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5 grain-bg">
          <div className="relative z-10">
            <h3 className="font-heading text-base mb-4">Farmer Registrations Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 15% 82%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newReg" stroke="#1B4332" strokeWidth={2} name="New Registrations" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="verified" stroke="#D4A017" strokeWidth={2} name="Verified" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 grain-bg">
          <div className="relative z-10">
            <h3 className="font-heading text-base mb-4">Scheme-wise Approval Rate</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={approvalRates} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 15% 82%)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="scheme" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="rate" fill="#1B4332" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 grain-bg">
          <div className="relative z-10">
            <h3 className="font-heading text-base mb-4">Grievance Resolution by District</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={grievanceByDistrict}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 15% 82%)" />
                <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="resolved" stackId="a" fill="#1B4332" name="Resolved" />
                <Bar dataKey="pending" stackId="a" fill="#D4A017" name="Pending" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 grain-bg">
          <div className="relative z-10">
            <h3 className="font-heading text-base mb-4">AI Confidence vs Manual Override Rate</h3>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 15% 82%)" />
                <XAxis type="number" dataKey="confidence" name="AI Confidence" unit="%" tick={{ fontSize: 11 }} domain={[60, 100]} />
                <YAxis type="number" dataKey="overrideRate" name="Override Rate" unit="%" tick={{ fontSize: 11 }} />
                <ZAxis range={[60, 200]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={aiConfidenceOverride} fill="#D4A017" name="Schemes" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-secondary" />
          <h3 className="font-heading text-lg">AI Predictive Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 card-hover">
              <span className="text-xl mb-2 block">{ins.icon}</span>
              <p className="text-sm">{ins.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
