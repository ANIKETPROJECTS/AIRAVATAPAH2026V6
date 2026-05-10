export const farmers = [
  { id: "F-001", name: "Ramesh Patel", village: "Wardha", district: "Nagpur", land: 4.5, crop: "Cotton", aadhaar: "XXXX-XXXX-1234", status: "Active" },
  { id: "F-002", name: "Sunita Devi", village: "Pune Rural", district: "Pune", land: 2.0, crop: "Sugarcane", aadhaar: "XXXX-XXXX-5678", status: "Active" },
  { id: "F-003", name: "Anil Sharma", village: "Amravati", district: "Amravati", land: 7.2, crop: "Soybean", aadhaar: "XXXX-XXXX-9012", status: "Inactive" },
  { id: "F-004", name: "Kaveri Bai", village: "Nashik", district: "Nashik", land: 3.1, crop: "Grapes", aadhaar: "XXXX-XXXX-3456", status: "Active" },
  { id: "F-005", name: "Mahesh Yadav", village: "Latur", district: "Latur", land: 5.8, crop: "Tur Dal", aadhaar: "XXXX-XXXX-7890", status: "Pending" },
  { id: "F-006", name: "Deepak Lokhande", village: "Satara", district: "Satara", land: 3.4, crop: "Rice", aadhaar: "XXXX-XXXX-2345", status: "Active" },
  { id: "F-007", name: "Laxmi Waghmare", village: "Kolhapur", district: "Kolhapur", land: 1.8, crop: "Sugarcane", aadhaar: "XXXX-XXXX-6789", status: "Active" },
  { id: "F-008", name: "Vijay More", village: "Solapur", district: "Solapur", land: 6.1, crop: "Grapes", aadhaar: "XXXX-XXXX-0123", status: "Active" },
  { id: "F-009", name: "Rekha Patil", village: "Jalgaon", district: "Jalgaon", land: 4.0, crop: "Banana", aadhaar: "XXXX-XXXX-4567", status: "Active" },
  { id: "F-010", name: "Suresh Naik", village: "Ratnagiri", district: "Ratnagiri", land: 2.5, crop: "Cashew", aadhaar: "XXXX-XXXX-8901", status: "Inactive" },
  { id: "F-011", name: "Deepa Kore", village: "Sangli", district: "Sangli", land: 3.7, crop: "Turmeric", aadhaar: "XXXX-XXXX-3210", status: "Active" },
  { id: "F-012", name: "Ganesh Bhosle", village: "Aurangabad", district: "Aurangabad", land: 8.0, crop: "Cotton", aadhaar: "XXXX-XXXX-6543", status: "Active" },
  { id: "F-013", name: "Meena Gaikwad", village: "Beed", district: "Beed", land: 5.2, crop: "Soybean", aadhaar: "XXXX-XXXX-9876", status: "Pending" },
  { id: "F-014", name: "Prakash Jadhav", village: "Nanded", district: "Nanded", land: 4.8, crop: "Tur Dal", aadhaar: "XXXX-XXXX-1357", status: "Active" },
  { id: "F-015", name: "Shalini Raut", village: "Ahmednagar", district: "Ahmednagar", land: 2.9, crop: "Onion", aadhaar: "XXXX-XXXX-2468", status: "Active" },
  { id: "F-016", name: "Balaji Shirke", village: "Osmanabad", district: "Osmanabad", land: 6.5, crop: "Jowar", aadhaar: "XXXX-XXXX-3579", status: "Active" },
];

export const applications = [
  { id: "APP-2024-1901", farmer: "Ramesh Patel", scheme: "PM-KISAN", submitted: "12 Jun 2024", aiStatus: "AI Approved", confidence: 96, officer: "-", tab: "ai-approved" },
  { id: "APP-2024-1902", farmer: "Sunita Devi", scheme: "PMFBY", submitted: "12 Jun 2024", aiStatus: "Needs Review", confidence: 61, officer: "Pending", tab: "pending" },
  { id: "APP-2024-1903", farmer: "Deepak Lokhande", scheme: "KCC", submitted: "11 Jun 2024", aiStatus: "Flagged", confidence: 34, officer: "-", tab: "flagged" },
  { id: "APP-2024-1904", farmer: "Laxmi Waghmare", scheme: "Soil Health", submitted: "11 Jun 2024", aiStatus: "AI Approved", confidence: 91, officer: "-", tab: "ai-approved" },
  { id: "APP-2024-1905", farmer: "Anil Sharma", scheme: "PM-KISAN", submitted: "10 Jun 2024", aiStatus: "AI Approved", confidence: 88, officer: "-", tab: "ai-approved" },
  { id: "APP-2024-1906", farmer: "Kaveri Bai", scheme: "PMFBY", submitted: "10 Jun 2024", aiStatus: "Needs Review", confidence: 58, officer: "Pending", tab: "pending" },
  { id: "APP-2024-1907", farmer: "Mahesh Yadav", scheme: "PM-KISAN", submitted: "09 Jun 2024", aiStatus: "AI Approved", confidence: 94, officer: "-", tab: "ai-approved" },
  { id: "APP-2024-1908", farmer: "Vijay More", scheme: "KCC", submitted: "09 Jun 2024", aiStatus: "Rejected", confidence: 22, officer: "Ravi K.", tab: "rejected" },
  { id: "APP-2024-1909", farmer: "Rekha Patil", scheme: "Soil Health", submitted: "08 Jun 2024", aiStatus: "AI Approved", confidence: 97, officer: "-", tab: "ai-approved" },
  { id: "APP-2024-1910", farmer: "Suresh Naik", scheme: "PM-KISAN", submitted: "08 Jun 2024", aiStatus: "Flagged", confidence: 41, officer: "-", tab: "flagged" },
  { id: "APP-2024-1911", farmer: "Deepa Kore", scheme: "PMFBY", submitted: "07 Jun 2024", aiStatus: "AI Approved", confidence: 89, officer: "-", tab: "ai-approved" },
  { id: "APP-2024-1912", farmer: "Ganesh Bhosle", scheme: "PM-KISAN", submitted: "07 Jun 2024", aiStatus: "Needs Review", confidence: 53, officer: "Pending", tab: "pending" },
  { id: "APP-2024-1913", farmer: "Meena Gaikwad", scheme: "KCC", submitted: "06 Jun 2024", aiStatus: "AI Approved", confidence: 92, officer: "-", tab: "ai-approved" },
  { id: "APP-2024-1914", farmer: "Prakash Jadhav", scheme: "Soil Health", submitted: "06 Jun 2024", aiStatus: "Flagged", confidence: 38, officer: "-", tab: "flagged" },
  { id: "APP-2024-1915", farmer: "Shalini Raut", scheme: "PM-KISAN", submitted: "05 Jun 2024", aiStatus: "AI Approved", confidence: 95, officer: "-", tab: "ai-approved" },
];

export const transactions = [
  { id: "TXN-001", farmer: "Ramesh Patel", scheme: "PM-KISAN", amount: "₹2,000", bank: "SBI ****1234", date: "10 Jun", status: "Success" },
  { id: "TXN-002", farmer: "Sunita Devi", scheme: "PM-KISAN", amount: "₹2,000", bank: "BOI ****5678", date: "10 Jun", status: "Success" },
  { id: "TXN-003", farmer: "Mahesh Yadav", scheme: "PMFBY", amount: "₹8,500", bank: "PNB ****9012", date: "09 Jun", status: "Failed" },
  { id: "TXN-004", farmer: "Deepa Kore", scheme: "Soil Health", amount: "₹500", bank: "SBI ****3456", date: "09 Jun", status: "Pending" },
  { id: "TXN-005", farmer: "Anil Sharma", scheme: "PM-KISAN", amount: "₹2,000", bank: "HDFC ****7890", date: "08 Jun", status: "Success" },
  { id: "TXN-006", farmer: "Kaveri Bai", scheme: "KCC", amount: "₹15,000", bank: "BOB ****2345", date: "08 Jun", status: "Success" },
  { id: "TXN-007", farmer: "Vijay More", scheme: "PM-KISAN", amount: "₹2,000", bank: "SBI ****6789", date: "07 Jun", status: "Success" },
  { id: "TXN-008", farmer: "Rekha Patil", scheme: "PMFBY", amount: "₹12,300", bank: "PNB ****0123", date: "07 Jun", status: "Pending" },
  { id: "TXN-009", farmer: "Ganesh Bhosle", scheme: "PM-KISAN", amount: "₹2,000", bank: "SBI ****4567", date: "06 Jun", status: "Success" },
  { id: "TXN-010", farmer: "Prakash Jadhav", scheme: "Soil Health", amount: "₹500", bank: "BOI ****8901", date: "06 Jun", status: "Failed" },
  { id: "TXN-011", farmer: "Shalini Raut", scheme: "PM-KISAN", amount: "₹2,000", bank: "HDFC ****3210", date: "05 Jun", status: "Success" },
  { id: "TXN-012", farmer: "Balaji Shirke", scheme: "KCC", amount: "₹18,000", bank: "SBI ****6543", date: "05 Jun", status: "Success" },
];

export const claims = [
  { id: "CLM-001", farmer: "Ramesh Patel", crop: "Cotton", loss: 68, amount: "₹42,000", status: "AI Approved", filed: "01 Jun" },
  { id: "CLM-002", farmer: "Anil Sharma", crop: "Soybean", loss: 23, amount: "₹18,000", status: "Verification", filed: "02 Jun" },
  { id: "CLM-003", farmer: "Rekha Patil", crop: "Tur Dal", loss: 81, amount: "₹56,000", status: "AI Approved", filed: "03 Jun" },
  { id: "CLM-004", farmer: "Vijay More", crop: "Grapes", loss: 45, amount: "₹31,000", status: "Disputed", filed: "04 Jun" },
  { id: "CLM-005", farmer: "Sunita Devi", crop: "Sugarcane", loss: 52, amount: "₹35,000", status: "AI Approved", filed: "05 Jun" },
  { id: "CLM-006", farmer: "Mahesh Yadav", crop: "Tur Dal", loss: 71, amount: "₹48,000", status: "Verification", filed: "06 Jun" },
  { id: "CLM-007", farmer: "Deepa Kore", crop: "Turmeric", loss: 33, amount: "₹22,000", status: "Rejected", filed: "07 Jun" },
  { id: "CLM-008", farmer: "Ganesh Bhosle", crop: "Cotton", loss: 89, amount: "₹62,000", status: "AI Approved", filed: "08 Jun" },
  { id: "CLM-009", farmer: "Kaveri Bai", crop: "Grapes", loss: 15, amount: "₹11,000", status: "Rejected", filed: "09 Jun" },
  { id: "CLM-010", farmer: "Balaji Shirke", crop: "Jowar", loss: 58, amount: "₹38,000", status: "Settled", filed: "10 Jun" },
];

export const grievances = [
  { id: "GR-0041", farmer: "Mahesh Yadav", category: "Subsidy Delay", filed: "10 Jun", priority: "High", assigned: "Priya Desai", status: "In Progress", sla: "⚠️ 2hrs left" },
  { id: "GR-0042", farmer: "Lakshmi Bai", category: "Wrong Beneficiary", filed: "09 Jun", priority: "Medium", assigned: "Ravi Kulkarni", status: "Open", sla: "1 day left" },
  { id: "GR-0043", farmer: "Deepak Lokhande", category: "Document Issue", filed: "08 Jun", priority: "Low", assigned: "-", status: "Open", sla: "2 days left" },
  { id: "GR-0044", farmer: "Rekha Patil", category: "Officer Misconduct", filed: "07 Jun", priority: "High", assigned: "Supervisor", status: "Escalated", sla: "Escalated" },
  { id: "GR-0045", farmer: "Suresh Naik", category: "Subsidy Delay", filed: "11 Jun", priority: "Medium", assigned: "Amit Jadhav", status: "Resolved", sla: "✅ Done" },
  { id: "GR-0046", farmer: "Ganesh Bhosle", category: "Technical Error", filed: "06 Jun", priority: "Low", assigned: "Ravi Kulkarni", status: "Resolved", sla: "✅ Done" },
  { id: "GR-0047", farmer: "Shalini Raut", category: "Wrong Beneficiary", filed: "05 Jun", priority: "High", assigned: "Priya Desai", status: "In Progress", sla: "4hrs left" },
  { id: "GR-0048", farmer: "Meena Gaikwad", category: "Subsidy Delay", filed: "04 Jun", priority: "Medium", assigned: "Amit Jadhav", status: "Resolved", sla: "✅ Done" },
  { id: "GR-0049", farmer: "Prakash Jadhav", category: "Document Issue", filed: "03 Jun", priority: "Low", assigned: "-", status: "Open", sla: "3 days left" },
  { id: "GR-0050", farmer: "Kaveri Bai", category: "Technical Error", filed: "02 Jun", priority: "Medium", assigned: "Ravi Kulkarni", status: "In Progress", sla: "1 day left" },
  { id: "GR-0051", farmer: "Anil Sharma", category: "Subsidy Delay", filed: "01 Jun", priority: "High", assigned: "Supervisor", status: "Escalated", sla: "Escalated" },
  { id: "GR-0052", farmer: "Ramesh Patel", category: "Others", filed: "31 May", priority: "Low", assigned: "Amit Jadhav", status: "Resolved", sla: "✅ Done" },
];

export const monthlyAppData = [
  { month: "Jan", approved: 210, pending: 45, rejected: 12 },
  { month: "Feb", approved: 198, pending: 62, rejected: 8 },
  { month: "Mar", approved: 245, pending: 38, rejected: 15 },
  { month: "Apr", approved: 189, pending: 71, rejected: 9 },
  { month: "May", approved: 267, pending: 42, rejected: 11 },
  { month: "Jun", approved: 301, pending: 55, rejected: 7 },
];

export const schemeDistribution = [
  { name: "PM-KISAN", value: 38, color: "#1B4332" },
  { name: "PMFBY", value: 22, color: "#D4A017" },
  { name: "Soil Health", value: 18, color: "#2D6A4F" },
  { name: "KCC", value: 14, color: "#8B6914" },
  { name: "Others", value: 8, color: "#95D5B2" },
];

export const subsidyTrend = [
  { month: "Apr", amount: 82 }, { month: "May", amount: 94 }, { month: "Jun", amount: 101 },
  { month: "Jul", amount: 88 }, { month: "Aug", amount: 115 }, { month: "Sep", amount: 132 },
  { month: "Oct", amount: 99 }, { month: "Nov", amount: 141 }, { month: "Dec", amount: 158 },
  { month: "Jan", amount: 122 }, { month: "Feb", amount: 109 }, { month: "Mar", amount: 167 },
];

export const activityFeed = [
  { time: "09:14 AM", icon: "✅", text: "AI auto-verified application #APP2024-1892 (Ramesh Patel, Nagpur)" },
  { time: "09:11 AM", icon: "⚠️", text: "Duplicate entry flagged: Farmer ID F-00291 matches F-00487" },
  { time: "09:08 AM", icon: "📄", text: "14 insurance claim documents auto-classified" },
  { time: "09:02 AM", icon: "🔔", text: "Grievance GR-0041 escalated (SLA breach in 2 hours)" },
  { time: "08:55 AM", icon: "✅", text: "Bulk payment batch #B-0094 processed — 23 transactions successful" },
  { time: "08:47 AM", icon: "📊", text: "Monthly analytics report generated for Nagpur district" },
];

export const pendingActions = [
  { id: "APP-2024-1902", farmer: "Sunita Devi", type: "Application", status: "Review", confidence: 61 },
  { id: "APP-2024-1903", farmer: "Deepak Lokhande", type: "Application", status: "Flagged", confidence: 34 },
  { id: "GR-0041", farmer: "Mahesh Yadav", type: "Grievance", status: "Urgent", confidence: 87 },
  { id: "CLM-004", farmer: "Vijay More", type: "Claim", status: "Disputed", confidence: 45 },
  { id: "APP-2024-1910", farmer: "Suresh Naik", type: "Application", status: "Flagged", confidence: 41 },
];

export const officers = [
  { name: "Rajesh Kumar", role: "District Officer", district: "Nagpur", lastLogin: "Today 09:14", status: "Active" },
  { name: "Priya Desai", role: "Field Inspector", district: "Amravati", lastLogin: "Today 08:52", status: "Active" },
  { name: "Ravi Kulkarni", role: "Data Entry", district: "Pune", lastLogin: "Yesterday", status: "Active" },
  { name: "Amit Jadhav", role: "Grievance Officer", district: "Latur", lastLogin: "2 days ago", status: "Active" },
];

export const workflowRules = [
  { rule: "Auto-approve PM-KISAN if AI confidence ≥ 90%", trigger: "New application", action: "Auto-approve + notify", enabled: true },
  { rule: "Flag if Aadhaar linked to >1 farmer", trigger: "Registration", action: "Flag + hold", enabled: true },
  { rule: "Escalate grievance if unresolved > 72hrs", trigger: "SLA breach", action: "Escalate to supervisor", enabled: true },
  { rule: "Auto-classify incoming grievances", trigger: "New grievance", action: "NLP classification", enabled: true },
  { rule: "Notify officer on claim > ₹50,000", trigger: "Claim filed", action: "Email + SMS alert", enabled: false },
];

export const registrationTrend = [
  { month: "Apr", newReg: 420, verified: 390 }, { month: "May", newReg: 485, verified: 450 },
  { month: "Jun", newReg: 510, verified: 478 }, { month: "Jul", newReg: 390, verified: 365 },
  { month: "Aug", newReg: 560, verified: 520 }, { month: "Sep", newReg: 610, verified: 575 },
  { month: "Oct", newReg: 480, verified: 455 }, { month: "Nov", newReg: 530, verified: 500 },
  { month: "Dec", newReg: 445, verified: 420 }, { month: "Jan", newReg: 590, verified: 560 },
  { month: "Feb", newReg: 520, verified: 490 }, { month: "Mar", newReg: 640, verified: 610 },
];

export const approvalRates = [
  { scheme: "PM-KISAN", rate: 91 }, { scheme: "PMFBY", rate: 78 },
  { scheme: "KCC", rate: 85 }, { scheme: "Soil Health", rate: 95 }, { scheme: "Others", rate: 70 },
];

export const grievanceByDistrict = [
  { district: "Nagpur", resolved: 34, pending: 8 }, { district: "Pune", resolved: 28, pending: 5 },
  { district: "Amravati", resolved: 22, pending: 11 }, { district: "Nashik", resolved: 31, pending: 4 },
  { district: "Latur", resolved: 19, pending: 7 }, { district: "Solapur", resolved: 22, pending: 3 },
];

export const aiConfidenceOverride = [
  { scheme: "PM-KISAN", confidence: 92, overrideRate: 4 },
  { scheme: "PMFBY", confidence: 76, overrideRate: 18 },
  { scheme: "KCC", confidence: 85, overrideRate: 9 },
  { scheme: "Soil Health", confidence: 94, overrideRate: 3 },
  { scheme: "PMFBY (Flood)", confidence: 68, overrideRate: 24 },
  { scheme: "KCC (Kharif)", confidence: 81, overrideRate: 12 },
  { scheme: "Others", confidence: 72, overrideRate: 21 },
  { scheme: "PM-KISAN (New)", confidence: 88, overrideRate: 7 },
];
