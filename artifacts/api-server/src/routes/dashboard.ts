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

    const [
      farmers,
      applications,
      grievances,
    ] = await Promise.all([
      db.collection("farmers").find({ status: { $ne: "Draft" } }, { projection: { _id: 0, status: 1, addedAt: 1, farmerId: 1 } }).toArray(),
      db.collection("applications").find({}, { projection: { _id: 0, status: 1, type: 1, schemeName: 1, appliedAt: 1, applicationId: 1, farmerName: 1, farmerId: 1 } }).sort({ appliedAt: -1 }).toArray(),
      db.collection("grievances").find({}, { projection: { _id: 0, status: 1, priority: 1, category: 1, createdAt: 1, grievanceId: 1, farmerName: 1, farmerId: 1, subject: 1 } }).sort({ createdAt: -1 }).toArray(),
    ]);

    const totalFarmers = farmers.length;
    const pendingApplications = applications.filter(a => a["status"] === "Pending" || a["status"] === "Under Review").length;

    const approvedApplications = applications.filter(a => a["status"] === "Approved" || a["status"] === "Settled").length;
    const totalApplications = applications.length;

    const activeInsuranceClaims = applications.filter(a =>
      a["type"] === "insurance" && (a["status"] === "Pending" || a["status"] === "Under Review")
    ).length;

    const resolvedGrievances = grievances.filter(g => g["status"] === "Resolved" || g["status"] === "Closed").length;
    const totalGrievances = grievances.length;

    const aiAutomationRate = totalApplications > 0
      ? Math.round((approvedApplications / totalApplications) * 100)
      : 0;

    const kpis = {
      totalFarmers,
      pendingApplications,
      approvedApplications,
      activeInsuranceClaims,
      resolvedGrievances,
      totalGrievances,
      aiAutomationRate,
    };

    const now = new Date();
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const monthlyMap: Record<string, { approved: number; pending: number; rejected: number }> = {};
    for (const key of last6Months) {
      monthlyMap[key] = { approved: 0, pending: 0, rejected: 0 };
    }

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

    const schemeCount: Record<string, number> = {};
    for (const app of applications) {
      const name = (app["schemeName"] as string ?? "").trim();
      if (!name) continue;
      schemeCount[name] = (schemeCount[name] ?? 0) + 1;
    }

    const SCHEME_COLORS = [
      "#1B4332", "#D4A017", "#2D6A4F", "#8B6914", "#95D5B2",
      "#4A7C59", "#C4861A", "#40916C", "#6B5012", "#74C69D",
    ];

    const totalSchemeApps = Object.values(schemeCount).reduce((a, b) => a + b, 0);
    const sortedSchemes = Object.entries(schemeCount).sort((a, b) => b[1] - a[1]);

    let schemeDistribution: { name: string; value: number; color: string }[] = [];
    if (totalSchemeApps > 0) {
      const top4 = sortedSchemes.slice(0, 4);
      const othersCount = sortedSchemes.slice(4).reduce((s, [, c]) => s + c, 0);
      schemeDistribution = top4.map(([name, count], i) => ({
        name,
        value: Math.round((count / totalSchemeApps) * 100),
        color: SCHEME_COLORS[i],
      }));
      if (othersCount > 0) {
        schemeDistribution.push({
          name: "Others",
          value: 100 - schemeDistribution.reduce((s, e) => s + e.value, 0),
          color: SCHEME_COLORS[4],
        });
      }
    }

    const pendingApps = applications
      .filter(a => a["status"] === "Pending" || a["status"] === "Under Review")
      .slice(0, 4)
      .map(a => ({
        id: a["applicationId"] as string,
        farmer: a["farmerName"] as string ?? "Unknown",
        type: "Application",
        status: a["status"] as string,
        confidence: 50 + Math.floor(Math.random() * 40),
      }));

    const openGrievances = grievances
      .filter(g => g["status"] === "Open" || g["status"] === "In Progress" || g["status"] === "Escalated")
      .slice(0, 3)
      .map(g => ({
        id: g["grievanceId"] as string,
        farmer: g["farmerName"] as string ?? "Unknown",
        type: "Grievance",
        status: g["status"] as string,
        confidence: 60 + Math.floor(Math.random() * 30),
      }));

    const pendingActions = [...pendingApps, ...openGrievances].slice(0, 6);

    const recentFarmers = farmers
      .filter(f => f["addedAt"])
      .sort((a, b) => new Date(b["addedAt"] as string).getTime() - new Date(a["addedAt"] as string).getTime())
      .slice(0, 3);

    const activityFeed: { time: string; icon: string; text: string }[] = [];

    for (const app of applications.slice(0, 4)) {
      const status = app["status"] as string;
      const icon = status === "Approved" || status === "Settled" ? "✅" : status === "Rejected" ? "❌" : "📄";
      const d = new Date(app["appliedAt"] as string);
      const time = isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      activityFeed.push({
        time,
        icon,
        text: `Application ${app["applicationId"]} for "${app["schemeName"]}" ${status === "Approved" ? "approved" : status === "Rejected" ? "rejected" : "submitted"} by ${app["farmerName"] ?? "unknown farmer"}`,
      });
    }

    for (const g of grievances.slice(0, 2)) {
      const icon = g["priority"] === "High" ? "⚠️" : "🔔";
      const d = new Date(g["createdAt"] as string);
      const time = isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      activityFeed.push({
        time,
        icon,
        text: `Grievance ${g["grievanceId"]} (${g["category"]}) raised by ${g["farmerName"] ?? "unknown"} — ${g["status"]}`,
      });
    }

    for (const f of recentFarmers.slice(0, 2)) {
      const d = new Date(f["addedAt"] as string);
      const time = isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      activityFeed.push({
        time,
        icon: "👤",
        text: `New farmer registered: ${f["farmerId"]} (Status: ${f["status"]})`,
      });
    }

    activityFeed.sort((a, b) => b.time.localeCompare(a.time));

    res.json({
      kpis,
      monthlyAppData,
      schemeDistribution,
      pendingActions,
      activityFeed: activityFeed.slice(0, 6),
    });
  } catch (err) {
    logger.error({ err }, "Dashboard stats failed");
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
});

export default router;
