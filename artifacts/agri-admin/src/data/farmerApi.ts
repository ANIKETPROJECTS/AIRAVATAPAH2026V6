export interface LandParcelRecord {
  state?: string;
  district: string;
  taluka?: string;
  village: string;
  surveyNo: string;
  totalArea: string;
  areaUnit?: string;
  irrigatedArea?: string;
  ownershipType?: string;
  soilType?: string;
  irrigationSources?: string[];
  primaryCrop: string;
  secondaryCrop?: string;
  farmingType?: string;
}

export interface DocRecord {
  name: string;
  fileName: string;
  size: string;
  status: "uploaded" | "failed" | "none";
}

export interface SavedDocState {
  filename: string;
  sections: Array<{
    title: string;
    fields: Array<{ key: string; label: string; value: string }>;
    tables: Array<{
      key: string;
      label: string;
      columns: Array<{ key: string; label: string }>;
      rows: Array<{ values: Record<string, string> }>;
    }>;
  }>;
  rawTables: Array<{ blockId?: string; headers: string[]; rows: string[][]; html: string }>;
  textBlocks: string[];
  aadharPhoto?: { base64: string; mimeType: string } | null;
}

export interface OcrDocSection {
  [field: string]: unknown;
}

export interface FarmerRecord {
  farmerId: string;
  name: string;
  village: string;
  district: string;
  taluka?: string;
  land: number | string;
  crop: string;
  aadhaar: string;
  khateNumber?: string;
  surveyNumber: string;
  bankAccount: string;
  status: "Active" | "Inactive" | "Pending" | "Verified" | "Cancelled";
  source: "ocr" | "manual" | "seed" | "mobile_ocr";
  addedAt: string;
  fatherName?: string;
  dob?: string;
  gender?: string;
  category?: string;
  religion?: string;
  mobile?: string;
  altMobile?: string;
  email?: string;
  diffAbled?: boolean;
  disabilityType?: string;
  landParcels?: LandParcelRecord[];
  bankName?: string;
  branchName?: string;
  ifsc?: string;
  accountNo?: string;
  accountType?: string;
  aadhaarLinked?: string;
  npciStatus?: string;
  docs?: DocRecord[];
  aiRiskScore?: number;
  extractionData?: Record<string, SavedDocState>;
  farmerProfile?: Record<string, string>;
  rejectionReason?: string;
  address?: string;
  state?: string;
  farmerNames?: string[];
  ocr?: {
    aadhar?: OcrDocSection;
    passbook?: OcrDocSection;
    form7?: OcrDocSection;
    form12?: OcrDocSection;
    form8a?: OcrDocSection;
  };
}

const API = "/api";

export async function apiFetchFarmers(): Promise<FarmerRecord[]> {
  const res = await fetch(`${API}/farmers`);
  if (!res.ok) throw new Error("Failed to fetch farmers");
  return res.json();
}

export async function apiCreateFarmer(data: Omit<FarmerRecord, "farmerId" | "addedAt">): Promise<FarmerRecord> {
  const res = await fetch(`${API}/farmers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create farmer");
  return res.json();
}

export async function apiUpdateFarmer(id: string, data: Partial<FarmerRecord>): Promise<FarmerRecord> {
  const res = await fetch(`${API}/farmers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update farmer");
  return res.json();
}

export async function apiDeleteFarmer(id: string): Promise<void> {
  const res = await fetch(`${API}/farmers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete farmer");
}

export async function apiDeleteAllFarmers(): Promise<{ deleted: number }> {
  const res = await fetch(`${API}/farmers`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete all farmers");
  return res.json();
}

export async function apiSaveDocumentImages(
  farmerId: string,
  documents: Array<{ docType: string; base64: string; mimeType: string }>,
): Promise<void> {
  const res = await fetch(`${API}/farmers/${encodeURIComponent(farmerId)}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documents }),
  });
  if (!res.ok) throw new Error("Failed to save document images");
}

export function notifyFarmerChange() {
  window.dispatchEvent(new CustomEvent("farmer-registry-changed"));
}
