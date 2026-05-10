import { Router } from "express";
import { getDb } from "../lib/mongo";
import { logger } from "../lib/logger";

const router = Router();

const CATEGORY_PRIORITY: Record<string, string> = {
  "Subsidy Delay": "High",
  "Wrong Beneficiary": "High",
  "Officer Misconduct": "High",
  "Document Issue": "Medium",
  "Technical Error": "Medium",
  "Portal/App Issue": "Medium",
  "Other": "Low",
};

router.get("/grievances", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const { mobile, farmerId, status, search } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (mobile) filter["mobile"] = mobile;
    if (farmerId) filter["farmerId"] = farmerId;
    if (status) filter["status"] = status;
    if (search) {
      filter["$or"] = [
        { farmerName: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { grievanceId: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }
    const grievances = await db
      .collection("grievances")
      .find(filter, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(grievances);
  } catch (err) {
    logger.error({ err }, "Failed to fetch grievances");
    res.status(500).json({ error: "Failed to fetch grievances" });
  }
});

router.get("/grievances/:id", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const grievance = await db
      .collection("grievances")
      .findOne({ grievanceId: req.params["id"] }, { projection: { _id: 0 } });
    if (!grievance) { res.status(404).json({ error: "Grievance not found" }); return; }
    res.json(grievance);
  } catch (err) {
    logger.error({ err }, "Failed to fetch grievance");
    res.status(500).json({ error: "Failed to fetch grievance" });
  }
});

router.post("/grievances", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const {
      mobile, farmerId, farmerName, category, customCategory,
      subject, description, attachments, source, raisedBy, priority: reqPriority,
      assignedTo,
    } = req.body as {
      mobile?: string; farmerId?: string; farmerName?: string;
      category?: string; customCategory?: string; subject?: string; description?: string;
      attachments?: Array<{ name: string; base64: string; mimeType: string }>;
      source?: string; raisedBy?: string; priority?: string; assignedTo?: string;
    };

    if (!mobile || !subject || !description) {
      res.status(400).json({ error: "mobile, subject, and description are required" });
      return;
    }

    const effectiveCategory = category === "Other" && customCategory
      ? customCategory
      : (category ?? "General");
    const priority = reqPriority ?? CATEGORY_PRIORITY[category ?? ""] ?? "Medium";

    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    const grievanceId = `GRV-${ts.toString(36).toUpperCase()}-${rand}`;

    const grievance = {
      grievanceId,
      mobile,
      farmerId: farmerId ?? null,
      farmerName: farmerName ?? null,
      category: effectiveCategory,
      subject,
      description,
      attachments: (attachments ?? []).map(a => ({ name: a.name, base64: a.base64, mimeType: a.mimeType })),
      status: "Open",
      priority,
      assignedTo: assignedTo ?? null,
      adminReply: null,
      adminNotes: null,
      rejectionReason: null,
      resolvedAt: null,
      source: source ?? "farmer",
      raisedBy: raisedBy ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("grievances").insertOne(grievance);
    const { _id: _, ...clean } = grievance as typeof grievance & { _id?: unknown };
    res.status(201).json(clean);
  } catch (err) {
    logger.error({ err }, "Failed to create grievance");
    res.status(500).json({ error: "Failed to create grievance" });
  }
});

router.patch("/grievances/:id", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const { status, adminReply, adminNotes, priority, assignedTo, resolvedAt, rejectionReason } = req.body as {
      status?: string; adminReply?: string; adminNotes?: string;
      priority?: string; assignedTo?: string; resolvedAt?: string;
      rejectionReason?: string;
    };

    const validStatuses = ["Open", "In Progress", "Resolved", "Closed", "Escalated", "Rejected"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
      return;
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (status) updates["status"] = status;
    if (adminReply !== undefined) updates["adminReply"] = adminReply;
    if (adminNotes !== undefined) updates["adminNotes"] = adminNotes;
    if (priority) updates["priority"] = priority;
    if (assignedTo !== undefined) updates["assignedTo"] = assignedTo;
    if (resolvedAt !== undefined) updates["resolvedAt"] = resolvedAt;
    if (rejectionReason !== undefined) updates["rejectionReason"] = rejectionReason;

    const result = await db.collection("grievances").findOneAndUpdate(
      { grievanceId: req.params["id"] },
      { $set: updates },
      { returnDocument: "after", projection: { _id: 0 } }
    );
    if (!result) { res.status(404).json({ error: "Grievance not found" }); return; }
    res.json(result);
  } catch (err) {
    logger.error({ err }, "Failed to update grievance");
    res.status(500).json({ error: "Failed to update grievance" });
  }
});

router.delete("/grievances/:id", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const result = await db.collection("grievances").deleteOne({ grievanceId: req.params["id"] });
    if (result.deletedCount === 0) { res.status(404).json({ error: "Grievance not found" }); return; }
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete grievance");
    res.status(500).json({ error: "Failed to delete grievance" });
  }
});

export default router;
