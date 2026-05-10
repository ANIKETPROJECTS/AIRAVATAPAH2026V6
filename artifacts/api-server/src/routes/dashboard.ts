import { Router } from "express";
import { getDb } from "../lib/mongo";
import { logger } from "../lib/logger";

const router = Router();

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [, m] = key.split("-");
  return MONTH_NAMES[parseInt(m, 10) - 1] ?? key;
}

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  try {
    const db = getDb();

    const [farmers, applications, grievances] = await Promise.all([
      db.collection("farmers")
        .find({ status: { $ne: "Draft" } }, {
          projection: { _id: 0, status: 1, addedAt: 1, farmerId: 1, name: 1, district: 1, source: 1 }
        }).toArray(),
      db.collection("applications")
        .find({}, {
          projection: { _id: 0, status: 1, type: 1, schemeName: 1, appliedAt: 1, applicationId: 1, farmerName: 1, farmerId: 1, mobile: 1 }
        }).sort({ appliedAt: -1 }).toArray(),
      db.collection("grievances")
        .find({}, {
          projection: { _id: 0, status: 1, priority: 1, category: 1, createdAt: 1, grievanceId: 1, farmerName: 1, farmerId: 1, subject: 1 }
        }).sort({ createdAt: -1 }).toArray(),
    ]);

    /* ── KPIs ─────────────────────────────────────────────── */
    const totalFarmers = farmers.length;
    const pendingApplications = applications.filter(a => a["status"] === "Pending" || a["status"] === "Under Review").length;
    const approvedApplications = applications.filter(a => a["status"] === "Approved" || a["status"] === "Settled").length;
    const rejectedApplications = applications.filter(a => a["status"] === "Rejected").length;
    const totalApplications = applications.length;
    const activeInsuranceClaims = applications.filter(a =>
      a["type"] === "insurance" && (a["status"] === "Pending" || a["status"] === "Under Review")
    ).length;
    const resolvedGrievances = grievances.filter(g => g["status"] === "Resolved" || g["status"] === "Closed").length;
    const openGrievancesCount = grievances.filter(g => g["status"] === "Open" || g["status"] === "In Progress" || g["status"] === "Escalated").length;
    const totalGrievances = grievances.length;
    const approvalRate = totalApplications > 0 ? Math.round((approvedApplications / totalApplications) * 100) : 0;

    /* ── Farmer breakdown by status ───────────────────────── */
    const farmersByStatus: Record<string, number> = {};
    for (const f of farmers) {
      const s = (f["status"] as string) ?? "Unknown";
      farmersByStatus[s] = (farmersByStatus[s] ?? 0) + 1;
    }

    /* ── Applications breakdown by type ──────────────────── */
    const appTypes = ["scheme", "subsidy", "insurance"] as const;
    const applicationsByType: Record<string, { total: number; pending: number; approved: number; rejected: number; underReview: number }> = {};
    for (const type of appTypes) {
      const subset = applications.filter(a => a["type"] === type);
      applicationsByType[type] = {
        total: subset.length,
        pending: subset.filter(a => a["status"] === "Pending").length,
        underReview: subset.filter(a => a["status"] === "Under Review").length,
        approved: subset.filter(a => a["status"] === "Approved" || a["status"] === "Settled").length,
        rejected: subset.filter(a => a["status"] === "Rejected").length,
      };
    }

    /* ── Grievance breakdowns ─────────────────────────────── */
    const grievancesByStatus: Record<string, number> = {};
    const grievancesByPriority: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
    for (const g of grievances) {
      const s = (g["status"] as string) ?? "Unknown";
      grievancesByStatus[s] = (grievancesByStatus[s] ?? 0) + 1;
      const p = (g["priority"] as string) ?? "Medium";
      if (p in grievancesByPriority) grievancesByPriority[p]++;
    }

    /* ── Monthly application volume (last 6 months) ───────── */
    const now = new Date();
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const monthlyMap: Record<string, { approved: number; pending: number; rejected: number }> = {};
    for (const key of last6Months) monthlyMap[key] = { approved: 0, pending: 0, rejected: 0 };
    for (const app of applications) {
      const key = monthKey(app["appliedAt"] as string ?? "");
      if (!monthlyMap[key]) continue;
      const status = (app["status"] as string ?? "").toLowerCase();
      if (status === "approved" || status === "settled") monthlyMap[key].approved++;
      else if (status === "rejected") monthlyMap[key].rejected++;
      else monthlyMap[key].pending++;
    }
    const monthlyAppData = last6Months.map(key => ({
      month: monthLabel(key),
      approved: monthlyMap[key].approved,
      pending: monthlyMap[key].pending,
      rejected: monthlyMap[key].rejected,
    }));

    /* ── Scheme distribution ──────────────────────────────── */
    const SCHEME_COLORS = ["#1B4332", "#D4A017", "#2D6A4F", "#8B6914", "#95D5B2"];
    const schemeCount: Record<string, number> = {};
    for (const app of applications) {
      const name = (app["schemeName"] as string ?? "").trim();
      if (!name) continue;
      schemeCount[name] = (schemeCount[name] ?? 0) + 1;
    }
    const totalSchemeApps = Object.values(schemeCount).reduce((a, b) => a + b, 0);
    const sortedSchemes = Object.entries(schemeCount).sort((a, b) => b[1] - a[1]);
    let schemeDistribution: { name: string; value: number; color: string }[] = [];
    if (totalSchemeApps > 0) {
      const top4 = sortedSchemes.slice(0, 4);
      const othersCount = sortedSchemes.slice(4).reduce((s, [, c]) => s + c, 0);
      let usedPct = 0;
      schemeDistribution = top4.map(([name, count], i) => {
        const pct = Math.round((count / totalSchemeApps) * 100);
        usedPct += pct;
        return { name, value: pct, color: SCHEME_COLORS[i] };
      });
      if (othersCount > 0) {
        schemeDistribution.push({ name: "Others", value: Math.max(0, 100 - usedPct), color: SCHEME_COLORS[4] });
      }
    }

    /* ── Recent registrations ─────────────────────────────── */
    const recentFarmers = farmers
      .filter(f => f["addedAt"])
      .sort((a, b) => new Date(b["addedAt"] as string).getTime() - new Date(a["addedAt"] as string).getTime())
      .slice(0, 5)
      .map(f => ({
        farmerId: f["farmerId"] as string,
        name: f["name"] as string ?? "Unknown",
        district: f["district"] as string ?? "—",
        status: f["status"] as string,
        source: f["source"] as string,
        addedAt: f["addedAt"] as string,
      }));

    /* ── Pending actions ──────────────────────────────────── */
    const pendingApps = applications
      .filter(a => a["status"] === "Pending" || a["status"] === "Under Review")
      .slice(0, 4)
      .map(a => ({
        id: a["applicationId"] as string,
        farmer: a["farmerName"] as string ?? "Unknown",
        type: (a["type"] as string ?? "scheme").charAt(0).toUpperCase() + (a["type"] as string ?? "scheme").slice(1),
        status: a["status"] as string,
        priority: "Medium",
      }));
    const openGrievanceItems = grievances
      .filter(g => g["status"] === "Open" || g["status"] === "Escalated")
      .slice(0, 3)
      .map(g => ({
        id: g["grievanceId"] as string,
        farmer: g["farmerName"] as string ?? "Unknown",
        type: "Grievance",
        status: g["status"] as string,
        priority: g["priority"] as string ?? "Medium",
      }));
    const pendingActions = [...pendingApps, ...openGrievanceItems].slice(0, 6);

    /* ── Activity feed ────────────────────────────────────── */
    const feedItems: { time: string; icon: string; text: string; category: string }[] = [];
    for (const app of applications.slice(0, 5)) {
      const status = app["status"] as string;
      const icon = status === "Approved" || status === "Settled" ? "✅" : status === "Rejected" ? "❌" : "📋";
      const d = new Date(app["appliedAt"] as string);
      const time = isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const typeLabel = (app["type"] as string ?? "scheme") === "insurance" ? "Insurance" : (app["type"] as string ?? "scheme") === "subsidy" ? "Subsidy" : "Scheme";
      feedItems.push({ time, icon, text: `${typeLabel} application for "${app["schemeName"]}" ${status === "Approved" ? "approved" : status === "Rejected" ? "rejected" : "submitted"} by ${app["farmerName"] ?? "a farmer"}`, category: "application" });
    }
    for (const g of grievances.slice(0, 3)) {
      const icon = g["priority"] === "High" ? "🔴" : g["status"] === "Escalated" ? "⚠️" : "📣";
      const d = new Date(g["createdAt"] as string);
      const time = isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      feedItems.push({ time, icon, text: `Grievance (${g["category"]}) raised by ${g["farmerName"] ?? "a farmer"} — ${g["status"]}`, category: "grievance" });
    }
    for (const f of recentFarmers.slice(0, 3)) {
      const d = new Date(f.addedAt);
      const time = isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      feedItems.push({ time, icon: "👤", text: `New farmer registered: ${f.name} (${f.district}) — ${f.status}`, category: "farmer" });
    }
    feedItems.sort((a, b) => b.time.localeCompare(a.time));

    res.json({
      kpis: {
        totalFarmers, pendingApplications, approvedApplications, rejectedApplications,
        totalApplications, activeInsuranceClaims,
        resolvedGrievances, openGrievancesCount, totalGrievances, approvalRate,
      },
      farmersByStatus,
      applicationsByType,
      grievancesByStatus,
      grievancesByPriority,
      monthlyAppData,
      schemeDistribution,
      recentFarmers,
      pendingActions,
      activityFeed: feedItems.slice(0, 8),
    });
  } catch (err) {
    logger.error({ err }, "Dashboard stats failed");
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
});

export default router;
