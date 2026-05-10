import { type Db } from "mongodb";
import { logger } from "./logger";

export interface Scheme {
  id: string;
  name: string;
  type: "CENTRAL" | "STATE";
  state: string | null;
  category: string;
  description: string;
  eligibility: {
    summary: string;
    parameters: { parameter: string; rule: string; validation: string }[];
    familyCriteria: string[];
    exclusions?: string[];
  };
  documents: string[];
  validationRules: string[];
  approvalRules: { approve: string[]; reject: string[] };
  benefits: string;
  status: "Active" | "Closed";
  createdAt: string;
  updatedAt: string;
}

const now = new Date().toISOString();

const SCHEMES: Scheme[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    type: "CENTRAL",
    state: null,
    category: "Income Support",
    description: "Direct income support of ₹6,000/year to farmer families in three equal installments of ₹2,000 every four months via DBT.",
    eligibility: {
      summary: "Indian citizen with land ownership, not an income tax payer or government employee.",
      parameters: [
        { parameter: "Land Ownership", rule: "Must own cultivable land", validation: "Land records" },
        { parameter: "Citizenship", rule: "Must be an Indian citizen", validation: "Aadhaar / documents" },
        { parameter: "Family", rule: "Husband, wife, minor children", validation: "Aadhaar deduplication" },
      ],
      familyCriteria: [
        "One benefit per farmer family",
        "Family defined as husband, wife, and minor children",
        "Benefit is per family, not per individual",
      ],
      exclusions: [
        "Institutional landholders",
        "Income tax payers",
        "Professionals (Doctor, Engineer, CA, Lawyer)",
        "Government employees (except Group D)",
        "Pensioners receiving ≥ ₹10,000/month",
        "MPs / MLAs / Ministers",
      ],
    },
    documents: ["Aadhaar Card", "Land records / 7/12 extract", "Bank passbook (DBT enabled)", "Mobile number"],
    validationRules: [
      "Aadhaar ↔ Bank linkage must exist",
      "Land ownership must be verified",
      "No exclusion criteria should apply",
      "No duplicate family beneficiary",
    ],
    approvalRules: {
      approve: ["Valid land ownership", "Aadhaar-bank linked", "No exclusion criteria met", "No duplicate"],
      reject: ["Income tax payer", "Government employee (non Group-D)", "Institutional landholder", "Duplicate family claim"],
    },
    benefits: "₹6,000/year in 3 installments of ₹2,000 each via Direct Benefit Transfer",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "pmfby",
    name: "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
    type: "CENTRAL",
    state: null,
    category: "Insurance",
    description: "Comprehensive crop insurance scheme providing financial support to farmers in case of crop failure due to natural calamities, pests, and diseases.",
    eligibility: {
      summary: "Farmer growing a notified crop in a notified area, enrolled before cut-off date with verified land.",
      parameters: [
        { parameter: "Crop", rule: "Must be a notified crop", validation: "Govt notification" },
        { parameter: "Area", rule: "Must be a notified area", validation: "District records" },
        { parameter: "Enrollment", rule: "Before scheme cut-off date", validation: "Bank / portal" },
        { parameter: "Land", rule: "Verified land holding", validation: "Land records" },
      ],
      familyCriteria: [
        "Individual farmer enrollment",
        "Both loanee and non-loanee farmers eligible",
      ],
    },
    documents: ["Aadhaar Card", "Land records", "Bank account details", "Crop sowing certificate"],
    validationRules: [
      "Crop must be in notified list",
      "Area must be in notified zone",
      "Enrollment before cut-off",
      "Premium payment confirmed",
      "No duplicate enrollment for same plot",
    ],
    approvalRules: {
      approve: ["Notified crop in notified area", "Enrolled before cut-off", "Premium paid"],
      reject: ["Non-notified crop", "Outside notified area", "Enrollment after cut-off", "Duplicate enrollment"],
    },
    benefits: "Claim = Sum Insured × (Threshold Yield − Actual Yield) / Threshold Yield. Premium: Kharif 2%, Rabi 1.5%, Commercial 5%.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "kcc",
    name: "KCC (Kisan Credit Card)",
    type: "CENTRAL",
    state: null,
    category: "Loan / Credit",
    description: "Flexible revolving credit facility for farmers covering crop production, post-harvest, and maintenance needs at subsidized interest rates.",
    eligibility: {
      summary: "Farmer or cultivator aged 18–75 with verified land engaged in agricultural activity.",
      parameters: [
        { parameter: "Age", rule: "18 to 75 years", validation: "Aadhaar / birth certificate" },
        { parameter: "Land", rule: "Verified land holding or cultivator", validation: "Land records" },
        { parameter: "Activity", rule: "Must be engaged in agriculture", validation: "Self-declaration" },
      ],
      familyCriteria: ["Individual farmer / cultivator", "Joint borrowers allowed"],
    },
    documents: ["Aadhaar Card", "Land records", "Bank account", "Passport photo", "Income declaration"],
    validationRules: [
      "Age within 18–75 range",
      "Land ownership or cultivator status verified",
      "Existing NPA / overdue check",
      "Credit limit based on scale of finance × area",
    ],
    approvalRules: {
      approve: ["Low or medium risk score", "Valid land", "No NPA status"],
      reject: ["High risk score", "NPA (overdue > 90 days)", "Age out of range"],
    },
    benefits: "Revolving credit limit based on scale of finance. Concessional interest rate (typically 4% with subvention). Tenure 1–5 years.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "pmksy",
    name: "PMKSY (Pradhan Mantri Krishi Sinchai Yojana)",
    type: "CENTRAL",
    state: null,
    category: "Irrigation / Infrastructure",
    description: "'Har Khet Ko Pani' — provides end-to-end solutions for irrigation with focus on micro-irrigation subsidies, water conservation, and infrastructure development.",
    eligibility: {
      summary: "Farmers with land requiring irrigation infrastructure, particularly in water-stressed areas.",
      parameters: [
        { parameter: "Land", rule: "Cultivable land requiring irrigation", validation: "Land records" },
        { parameter: "Area", rule: "Priority to water-stressed regions", validation: "Govt data" },
      ],
      familyCriteria: ["Individual or group of farmers", "Farmer producer organisations eligible"],
    },
    documents: ["Aadhaar Card", "Land records", "Bank account", "Irrigation requirement details"],
    validationRules: [
      "Land suitability for irrigation",
      "Agricultural use confirmed",
      "No duplicate subsidy",
    ],
    approvalRules: {
      approve: ["Valid land", "Genuine irrigation need", "Agricultural use"],
      reject: ["Non-agriculture land use", "Duplicate subsidy claim"],
    },
    benefits: "Subsidy on micro-irrigation equipment (drip/sprinkler). Infrastructure development support.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "pm-kusum",
    name: "PM KUSUM (Kisan Urja Suraksha evam Utthaan Mahabhiyan)",
    type: "CENTRAL",
    state: null,
    category: "Solar / Energy",
    description: "Promotes solar-powered irrigation pumps, allows farmers to sell surplus electricity, and reduces dependency on diesel pumps.",
    eligibility: {
      summary: "Farmers with cultivable land requiring irrigation pump and site feasibility for solar installation.",
      parameters: [
        { parameter: "Land", rule: "Cultivable landholding", validation: "Land records" },
        { parameter: "Irrigation Need", rule: "Pump requirement for agriculture", validation: "Field check" },
        { parameter: "Site", rule: "Feasible for solar panel installation", validation: "Technical survey" },
      ],
      familyCriteria: ["One pump per landholding", "Joint family → single allocation"],
    },
    documents: ["Aadhaar Card", "Land records", "Bank account", "Pump requirement details"],
    validationRules: [
      "Land suitability for solar installation",
      "Agricultural use of pump confirmed",
      "No duplicate subsidy",
      "Site feasibility verified",
    ],
    approvalRules: {
      approve: ["Valid land", "Agricultural irrigation need", "Site feasible"],
      reject: ["Non-agriculture use", "Site not feasible", "Duplicate subsidy"],
    },
    benefits: "Subsidy on solar pump installation. Ability to sell surplus electricity to grid.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "soil-health-card",
    name: "Soil Health Card Scheme",
    type: "CENTRAL",
    state: null,
    category: "Soil Management",
    description: "Provides farmers with soil health cards containing nutrient status and fertilizer recommendations for their land to improve productivity.",
    eligibility: {
      summary: "All farmers with cultivable land are eligible for free soil testing.",
      parameters: [
        { parameter: "Land", rule: "Cultivable land", validation: "Land records" },
      ],
      familyCriteria: ["Individual farmer", "One card per plot / survey number"],
    },
    documents: ["Land records / 7/12 extract", "Aadhaar Card"],
    validationRules: [
      "Soil sample collected from valid agricultural land",
      "Lab testing completed",
    ],
    approvalRules: {
      approve: ["Valid agricultural land", "Soil sample successfully tested"],
      reject: ["Non-agricultural land", "Invalid sample"],
    },
    benefits: "Free soil health card with nutrient analysis and crop-specific fertilizer recommendations.",
    status: "Closed",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "e-nam",
    name: "e-NAM (National Agriculture Market)",
    type: "CENTRAL",
    state: null,
    category: "Market / Trading",
    description: "Pan-India electronic trading portal for agricultural commodities enabling transparent price discovery and nationwide market access.",
    eligibility: {
      summary: "Farmers, traders, and FPOs registered on the e-NAM portal with valid produce.",
      parameters: [
        { parameter: "Registration", rule: "Registered on e-NAM portal", validation: "Portal registration" },
        { parameter: "Produce", rule: "Notified commodity", validation: "APMC records" },
      ],
      familyCriteria: ["Individual registration", "FPOs and cooperatives also eligible"],
    },
    documents: ["Aadhaar Card", "Bank account", "Produce details"],
    validationRules: ["Valid portal registration", "Commodity must be notified", "Bank account for direct payment"],
    approvalRules: {
      approve: ["Valid registration", "Notified commodity"],
      reject: ["Unregistered trader", "Non-notified commodity"],
    },
    benefits: "Transparent price discovery, nationwide buyer access, direct digital payment.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "pkvy",
    name: "PKVY (Paramparagat Krishi Vikas Yojana)",
    type: "CENTRAL",
    state: null,
    category: "Organic Farming",
    description: "Promotes organic farming through cluster-based approach, providing financial assistance and certification support to farmer groups.",
    eligibility: {
      summary: "Farmers in clusters of 50+ willing to adopt organic practices.",
      parameters: [
        { parameter: "Group", rule: "Cluster of 50+ farmers", validation: "Group formation docs" },
        { parameter: "Land", rule: "Cultivable land", validation: "Land records" },
        { parameter: "Commitment", rule: "Willing to practice organic farming", validation: "Self-declaration" },
      ],
      familyCriteria: ["Cluster/group-based participation", "Individual farmers within the cluster"],
    },
    documents: ["Aadhaar Card", "Land records", "Group formation certificate", "Bank account"],
    validationRules: ["Minimum cluster size of 50 farmers", "Land committed to organic farming", "No chemical fertilizer use after enrollment"],
    approvalRules: {
      approve: ["Valid cluster formed", "Land committed", "Certification process initiated"],
      reject: ["Cluster below minimum size", "Continued chemical use"],
    },
    benefits: "₹50,000/hectare over 3 years for organic input, certification, and marketing support.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aif",
    name: "AIF (Agriculture Infrastructure Fund)",
    type: "CENTRAL",
    state: null,
    category: "Infrastructure / Finance",
    description: "Provides medium-to-long term debt financing for post-harvest management infrastructure and community farming assets.",
    eligibility: {
      summary: "Farmers, FPOs, PACS, SHGs, Agri-entrepreneurs for agri-infrastructure projects.",
      parameters: [
        { parameter: "Entity", rule: "Farmer / FPO / PACS / SHG / Agri-entrepreneur", validation: "Registration documents" },
        { parameter: "Project", rule: "Viable agri-infrastructure project", validation: "Project evaluation" },
      ],
      familyCriteria: ["Individual or institutional applicants"],
    },
    documents: ["Aadhaar / Business registration", "Project proposal", "Land records", "Bank account"],
    validationRules: ["Project feasibility verified", "Loan purpose is agri-infrastructure", "Credit guarantee applicable"],
    approvalRules: {
      approve: ["Viable project", "Valid entity type", "Feasibility confirmed"],
      reject: ["Non-agri project", "Invalid entity", "Project not feasible"],
    },
    benefits: "Interest subvention of 3% on loans up to ₹2 crore. Credit guarantee cover available.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "pm-kisan-maandhan",
    name: "PM Kisan Maan-Dhan Yojana",
    type: "CENTRAL",
    state: null,
    category: "Pension",
    description: "Voluntary pension scheme providing monthly pension of ₹3,000 after age 60 to small and marginal farmers.",
    eligibility: {
      summary: "Small or marginal farmers aged 18–40 years.",
      parameters: [
        { parameter: "Age at Enrollment", rule: "18 to 40 years", validation: "Aadhaar / birth records" },
        { parameter: "Farmer Type", rule: "Small or marginal farmer", validation: "Land records" },
      ],
      familyCriteria: ["Individual enrollment", "Spouse can enroll separately"],
    },
    documents: ["Aadhaar Card", "Land records", "Bank account", "Mobile number"],
    validationRules: ["Age within 18–40 at enrollment", "Small/marginal farmer status verified", "Monthly contribution paid"],
    approvalRules: {
      approve: ["Valid age", "Small/marginal farmer confirmed", "Contribution enrolled"],
      reject: ["Age out of range", "Non-small/marginal farmer"],
    },
    benefits: "₹3,000/month pension after age 60. Government matches farmer's monthly contribution.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "namo-shetkari",
    name: "Namo Shetkari Maha Samman Nidhi Yojana",
    type: "STATE",
    state: "Maharashtra",
    category: "Income Support",
    description: "Maharashtra state scheme providing additional income support of ₹6,000/year to farmer families, supplementing PM-KISAN for a total of ₹12,000/year.",
    eligibility: {
      summary: "Maharashtra farmer with cultivable land, DBT-enabled bank account, Aadhaar-linked, residing in Maharashtra.",
      parameters: [
        { parameter: "Residency", rule: "Must be Maharashtra farmer", validation: "Aadhaar" },
        { parameter: "Land Ownership", rule: "Cultivable land", validation: "7/12 extract" },
        { parameter: "Farmer Category", rule: "Small/Marginal preferred", validation: "Land records" },
        { parameter: "Bank Account", rule: "DBT enabled", validation: "NPCI / Bank" },
      ],
      familyCriteria: [
        "One beneficiary per landholding family",
        "Family = Husband, wife, minor children",
        "Joint land → only one family member eligible",
        "Aadhaar-based deduplication required",
      ],
    },
    documents: ["Aadhaar Card", "7/12 Extract (Satbara)", "Bank Passbook", "Mobile number (OTP verified)", "Self-declaration"],
    validationRules: [
      "Aadhaar ↔ Bank linkage must exist",
      "Name match across Aadhaar, land record, and bank",
      "Land must be active and non-disputed",
      "No duplicate beneficiary in family",
    ],
    approvalRules: {
      approve: ["Valid documents", "No duplication", "Aadhaar-bank linked"],
      reject: ["Land mismatch", "Duplicate family claim", "Name mismatch across documents"],
    },
    benefits: "₹6,000/year (in addition to PM-KISAN ₹6,000 = total ₹12,000/year) via DBT.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "karjmafi",
    name: "Punyashlok Ahilyadevi Holkar Shetkari Karjmafi Yojana",
    type: "STATE",
    state: "Maharashtra",
    category: "Loan Waiver",
    description: "Maharashtra crop loan waiver scheme for farmers with overdue crop loans within the defined scheme cutoff period.",
    eligibility: {
      summary: "Maharashtra farmer with overdue crop loan within scheme cutoff period.",
      parameters: [
        { parameter: "Loan Type", rule: "Crop loan only", validation: "CBS (Core Banking)" },
        { parameter: "Loan Status", rule: "Overdue / NPA", validation: "Bank system" },
        { parameter: "Loan Period", rule: "Within scheme cutoff date", validation: "Config / Govt notification" },
      ],
      familyCriteria: [
        "Benefit applied per loan account",
        "Joint borrowers share the benefit",
      ],
    },
    documents: ["Aadhaar Card", "Loan account statement", "Land record", "Bank details"],
    validationRules: [
      "Loan must be an eligible crop loan",
      "Loan must fall within waiver scheme period",
      "No duplicate waiver claim",
    ],
    approvalRules: {
      approve: ["Eligible crop loan", "Borrower verified", "Within cutoff period"],
      reject: ["Non-crop loan", "Loan outside cutoff period", "Duplicate waiver"],
    },
    benefits: "Complete or partial waiver of overdue crop loan as per scheme notification.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "saur-krushi-pump",
    name: "Mukhyamantri Saur Krushi Pump Yojana",
    type: "STATE",
    state: "Maharashtra",
    category: "Solar / Energy",
    description: "Maharashtra CM's scheme providing solar agricultural pumps to farmers, reducing electricity and diesel costs for irrigation.",
    eligibility: {
      summary: "Landholding Maharashtra farmer with genuine irrigation need and land suitable for solar pump installation.",
      parameters: [
        { parameter: "Farmer Type", rule: "Landholding farmer", validation: "Verified land records" },
        { parameter: "Irrigation Need", rule: "Required for agriculture", validation: "Field check" },
        { parameter: "Land", rule: "Cultivable land", validation: "Land record" },
      ],
      familyCriteria: ["One pump per landholding", "Joint family → single allocation"],
    },
    documents: ["Aadhaar Card", "Land record", "Bank account", "Pump requirement details"],
    validationRules: [
      "Land suitability for solar panel installation",
      "Pump usage must be for agriculture only",
      "No duplicate subsidy for the same holding",
    ],
    approvalRules: {
      approve: ["Valid land", "Genuine irrigation need", "Agricultural use confirmed"],
      reject: ["Non-agricultural use", "Duplicate subsidy claim", "Site not suitable"],
    },
    benefits: "Heavily subsidised solar pump (upto 90% subsidy for SC/ST farmers). One-time asset benefit.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "jalyukt-shivar",
    name: "Jalyukt Shivar Abhiyan",
    type: "STATE",
    state: "Maharashtra",
    category: "Water Conservation",
    description: "Community-based water conservation scheme targeting drought-prone villages in Maharashtra to make them water self-sufficient.",
    eligibility: {
      summary: "Drought-prone villages in Maharashtra with community participation and local body approval.",
      parameters: [
        { parameter: "Area", rule: "Drought-prone region", validation: "Govt data" },
        { parameter: "Participation", rule: "Community-based, not individual", validation: "Local authority" },
      ],
      familyCriteria: [
        "Community scheme — not individual-based",
        "Village-level participation required",
      ],
    },
    documents: ["Land details", "Local body approval (Gram Panchayat)", "Project proposal"],
    validationRules: [
      "Area must be in eligible drought-prone zone",
      "Project feasibility must be verified",
      "Community / Gram Sabha approval required",
    ],
    approvalRules: {
      approve: ["Eligible drought-prone area", "Community approval obtained", "Feasibility confirmed"],
      reject: ["Non-eligible area", "No community / GP approval", "Project not feasible"],
    },
    benefits: "Government-funded water conservation structures (farm ponds, check dams, nala deepening) at village level.",
    status: "Closed",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ambedkar-krishi",
    name: "Dr. Babasaheb Ambedkar Krishi Swavalamban Yojana",
    type: "STATE",
    state: "Maharashtra",
    category: "SC Welfare / Subsidy",
    description: "Scheme for Scheduled Caste farmers in Maharashtra providing agricultural support including irrigation, land development, and equipment subsidies.",
    eligibility: {
      summary: "SC-category farmer in Maharashtra with cultivable land and valid caste certificate.",
      parameters: [
        { parameter: "Category", rule: "Scheduled Caste (SC)", validation: "Caste certificate" },
        { parameter: "Land", rule: "Cultivable land holding", validation: "Land records" },
      ],
      familyCriteria: ["One benefit per eligible SC family"],
    },
    documents: ["Aadhaar Card", "Caste Certificate (SC)", "Land record", "Bank account"],
    validationRules: ["Caste category must be verified as SC", "Land must be valid and cultivable", "No duplicate benefit in family"],
    approvalRules: {
      approve: ["Verified SC farmer", "Valid land", "No duplicate"],
      reject: ["Category mismatch", "Invalid caste certificate", "Non-cultivable land"],
    },
    benefits: "Subsidies for farm pond, drip irrigation, pump set, land levelling, and other agricultural inputs as per scheme phase.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "birsa-munda",
    name: "Birsa Munda Krishi Kranti Yojana",
    type: "STATE",
    state: "Maharashtra",
    category: "ST Welfare / Subsidy",
    description: "Agricultural development scheme for Scheduled Tribe farmers in Maharashtra, providing comprehensive support for land development and irrigation.",
    eligibility: {
      summary: "ST-category farmer in Maharashtra with cultivable land and valid tribal certificate.",
      parameters: [
        { parameter: "Category", rule: "Scheduled Tribe (ST)", validation: "Tribal/ST certificate" },
        { parameter: "Land", rule: "Cultivable land holding", validation: "Land records" },
      ],
      familyCriteria: ["One benefit per eligible ST family"],
    },
    documents: ["Aadhaar Card", "Tribal/ST Certificate", "Land record", "Bank account"],
    validationRules: ["Category must be verified as ST", "Land must be valid and cultivable", "No duplicate benefit in family"],
    approvalRules: {
      approve: ["Verified ST farmer", "Valid land", "No duplicate"],
      reject: ["Category mismatch", "Invalid tribal certificate", "Non-cultivable land"],
    },
    benefits: "Subsidies for irrigation, farm pond, drip systems, and crop inputs for ST farmers.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "gopinath-munde",
    name: "Gopinath Munde Shetkari Apghat Vima Yojana",
    type: "STATE",
    state: "Maharashtra",
    category: "Accident Insurance",
    description: "Personal accident insurance scheme for Maharashtra farmers providing compensation in case of accidental death or permanent disability.",
    eligibility: {
      summary: "Maharashtra farmer aged 10–75 years with valid land records.",
      parameters: [
        { parameter: "Age", rule: "10 to 75 years", validation: "Aadhaar / birth records" },
        { parameter: "Category", rule: "Farmer in Maharashtra", validation: "Land records" },
      ],
      familyCriteria: ["Primary farmer", "Includes family members working on farm"],
    },
    documents: ["Aadhaar Card", "Land record", "Bank account", "FIR / post-mortem report (for claims)"],
    validationRules: ["Farmer age within 10–75", "Death/disability must be accidental", "Claim filed within time limit"],
    approvalRules: {
      approve: ["Verified accidental death/disability", "Valid land records", "Within claim period"],
      reject: ["Natural death", "Non-farmer", "Claim outside time limit"],
    },
    benefits: "₹2 lakh compensation for accidental death or permanent disability. ₹1 lakh for partial disability.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "nanaji-deshmukh",
    name: "Nanaji Deshmukh Krishi Sanjivani Yojana (PoCRA)",
    type: "STATE",
    state: "Maharashtra",
    category: "Climate Resilience",
    description: "Climate-resilient agriculture project for Vidarbha and Marathwada regions to make villages climate smart through water conservation and improved practices.",
    eligibility: {
      summary: "Farmers in targeted project districts of Vidarbha and Marathwada with cultivable land.",
      parameters: [
        { parameter: "Location", rule: "Project district in Vidarbha/Marathwada", validation: "District records" },
        { parameter: "Land", rule: "Cultivable agricultural land", validation: "Land records" },
      ],
      familyCriteria: ["Individual farmer", "Village-level cluster activities also covered"],
    },
    documents: ["Aadhaar Card", "Land records", "Bank account"],
    validationRules: ["Must be in project district", "Land must be agricultural", "Activity must match scheme components"],
    approvalRules: {
      approve: ["Project district farmer", "Valid land", "Activity matches scheme"],
      reject: ["Non-project district", "Non-agricultural land", "Activity not in scheme scope"],
    },
    benefits: "Subsidies for water conservation, soil health, crop diversification, and market linkage in targeted areas.",
    status: "Active",
    createdAt: now,
    updatedAt: now,
  },
];

export async function seedSchemes(db: Db): Promise<void> {
  const collection = db.collection("schemes");
  const count = await collection.countDocuments();
  if (count > 0) {
    logger.info({ count }, "Schemes already seeded — skipping");
    return;
  }
  await collection.insertMany(SCHEMES);
  logger.info({ inserted: SCHEMES.length }, "Schemes seeded successfully");
}
