const API = "/api";

export interface GrievanceAttachment {
  name: string;
  base64: string;
  mimeType: string;
}

export interface GrievanceRecord {
  grievanceId: string;
  mobile: string;
  farmerId: string | null;
  farmerName: string | null;
  category: string;
  subject: string;
  description: string;
  attachments: GrievanceAttachment[];
  status: "Open" | "In Progress" | "Resolved" | "Closed" | "Escalated" | "Rejected";
  priority: "High" | "Medium" | "Low";
  assignedTo: string | null;
  adminReply: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  resolvedAt: string | null;
  source: "farmer" | "admin";
  raisedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function apiFetchGrievances(params?: {
  status?: string;
  mobile?: string;
  farmerId?: string;
  search?: string;
}): Promise<GrievanceRecord[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.mobile) qs.set("mobile", params.mobile);
  if (params?.farmerId) qs.set("farmerId", params.farmerId);
  if (params?.search) qs.set("search", params.search);
  const res = await fetch(`${API}/grievances?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch grievances");
  return res.json();
}

export async function apiCreateGrievance(data: {
  mobile: string;
  farmerId?: string | null;
  farmerName?: string | null;
  category: string;
  customCategory?: string;
  subject: string;
  description: string;
  priority?: string;
  assignedTo?: string;
  attachments?: GrievanceAttachment[];
  source?: string;
  raisedBy?: string;
}): Promise<GrievanceRecord> {
  const res = await fetch(`${API}/grievances`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? "Failed to create grievance"); }
  return res.json();
}

export async function apiUpdateGrievance(
  grievanceId: string,
  patch: {
    status?: string;
    adminReply?: string;
    adminNotes?: string;
    priority?: string;
    assignedTo?: string | null;
    resolvedAt?: string;
    rejectionReason?: string;
  }
): Promise<GrievanceRecord> {
  const res = await fetch(`${API}/grievances/${encodeURIComponent(grievanceId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update grievance");
  return res.json();
}

export async function apiDeleteGrievance(grievanceId: string): Promise<void> {
  const res = await fetch(`${API}/grievances/${encodeURIComponent(grievanceId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete grievance");
}
