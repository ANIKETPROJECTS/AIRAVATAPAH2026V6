import { type Db } from "mongodb";
import { logger } from "./logger";

export interface InsuranceSubsidy {
  id: string;
  name: string;
  type: "Insurance" | "Subsidy";
  region: "Central" | "Maharashtra";
  eligibility: string;
  criteria: string;
  parameters: string;
  features: string;
  createdAt: string;
}

const now = new Date().toISOString();

const INSURANCE_SUBSIDIES: InsuranceSubsidy[] = [
  // ─── CENTRAL INSURANCE ────────────────────────────────────────────────────
  {
    id: "pmfby-central",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    type: "Insurance",
    region: "Central",
    eligibility: "All farmers (owner, tenant, sharecropper) growing notified crops in notified areas. Loanee farmers: compulsory. Non-loanee: voluntary. Must enroll before cut-off date.",
    criteria: "Eligibility: notified crop, notified area, enrollment before cut-off, valid land records, and insurable interest in the crop.",
    parameters: "Premium: Kharif 2%, Rabi 1.5%, Commercial crops 5%. Sum insured = Scale of finance × area. Coverage: Pre-sowing to post-harvest.",
    features: "Covers drought, flood, cyclone, pests. Uses satellite & drone tech for assessment. Claims settled via DBT. Area-based insurance model.",
    createdAt: now,
  },
  {
    id: "rwbcis",
    name: "Restructured Weather Based Crop Insurance Scheme (RWBCIS)",
    type: "Insurance",
    region: "Central",
    eligibility: "Farmers in notified weather stations. Must grow weather-sensitive crops. Enrollment before deadline.",
    criteria: "Eligibility: notified weather station, weather-sensitive crop, enrollment before deadline, and trigger-based coverage acceptance.",
    parameters: "Based on rainfall levels and temperature variation. Predefined trigger thresholds automatically initiate claims.",
    features: "Claim triggered automatically. No field inspection required. Faster claim settlement than traditional schemes.",
    createdAt: now,
  },
  {
    id: "upis",
    name: "Unified Package Insurance Scheme (UPIS)",
    type: "Insurance",
    region: "Central",
    eligibility: "Farmers opting for bundled insurance coverage. Must be engaged in farming activities.",
    criteria: "Eligibility: active farming engagement, bundled insurance selection, and acceptance of crop/livestock/accident/asset cover combination.",
    parameters: "Covers multiple components: Crop, Livestock, Accident, Assets. Single premium for all coverages.",
    features: "Single policy for multiple risks. Reduces insurance complexity. Simplifies claims process for farmers.",
    createdAt: now,
  },
  {
    id: "cpis",
    name: "Coconut Palm Insurance Scheme (CPIS)",
    type: "Insurance",
    region: "Central",
    eligibility: "Coconut farmers with a minimum number of palms. Specific to plantation crop farmers.",
    criteria: "Eligibility: coconut cultivation, minimum palm count as per scheme norms, and plantation-crop ownership proof.",
    parameters: "Coverage per tree basis. Premium subsidized by government. Covers loss due to natural calamities.",
    features: "Covers natural calamities affecting coconut palms. Specific to plantation crops. Subsidized premium structure.",
    createdAt: now,
  },
  // ─── CENTRAL SUBSIDIES ────────────────────────────────────────────────────
  {
    id: "pm-kisan-subsidy",
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Landholding farmers with verified land records. Excludes income taxpayers and government employees, pensioners receiving ≥₹10,000/month, MPs/MLAs.",
    criteria: "Eligibility: cultivable land, Aadhaar-bank linkage, DBT-ready bank account, and exclusion checks for income tax payers/government employees.",
    parameters: "₹6,000 per year paid in 3 installments of ₹2,000 each every four months via Direct Benefit Transfer.",
    features: "Direct Benefit Transfer (DBT) to bank accounts. Nationwide coverage. Aadhaar-linked verification.",
    createdAt: now,
  },
  {
    id: "pmksy-subsidy",
    name: "Pradhan Mantri Krishi Sinchai Yojana (PMKSY)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Farmers with cultivable land suitable for irrigation. Priority to water-stressed regions.",
    criteria: "Eligibility: cultivable land, irrigation requirement, project feasibility, and priority for water-stressed locations.",
    parameters: "Subsidy on drip irrigation and sprinkler systems. Infrastructure development support. Focus on micro-irrigation.",
    features: "Focus: 'More crop per drop'. Water efficiency improvement. Supports drip and sprinkler installation.",
    createdAt: now,
  },
  {
    id: "smam",
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Farmers with land. Priority to small and marginal farmers for machinery subsidies.",
    criteria: "Eligibility: valid landholding, machinery need, and preference for small/marginal farmers.",
    parameters: "Subsidy on agricultural machinery and equipment. Limited subsidy amount per farmer per scheme period.",
    features: "Promotes mechanization of farming. Reduces manual labor requirement. Custom Hiring Centers supported.",
    createdAt: now,
  },
  {
    id: "aif-subsidy",
    name: "Agriculture Infrastructure Fund (AIF)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Farmers, Farmer Producer Organisations (FPOs), PACS, SHGs, and agri-entrepreneurs for project-based applications.",
    criteria: "Eligibility: project-based application, agri-infrastructure use case, and viable repayment plan.",
    parameters: "Interest subvention of 3% on loans up to ₹2 crore. Credit guarantee cover available under CGTMSE.",
    features: "Supports warehousing and cold storage infrastructure. Reduces post-harvest loss. Medium-to-long term financing.",
    createdAt: now,
  },
  {
    id: "pm-fme",
    name: "PM Formalisation of Micro Food Processing Enterprises (PM-FME)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Individual farmers, Self Help Groups (SHGs), and Farmer Producer Organisations (FPOs) in food processing.",
    criteria: "Eligibility: food-processing project, eligible applicant category, and bank-linked project proposal.",
    parameters: "35% capital subsidy on eligible project cost. Credit-linked subsidy through banks.",
    features: "Encourages food processing sector. Supports development of local brands and GI products.",
    createdAt: now,
  },
  {
    id: "iss",
    name: "Interest Subvention Scheme (ISS – Crop Loan)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Farmers taking short-term crop loans from scheduled commercial banks. Must repay on time for additional benefit.",
    criteria: "Eligibility: crop loan account, repayment discipline, and sanctioned loan within eligible limit.",
    parameters: "Interest reduced by 2–4% on crop loans up to ₹3 lakh. Additional 3% for prompt repayment.",
    features: "Lower borrowing cost for farmers. Encourages formal credit channel usage. Administered through NABARD.",
    createdAt: now,
  },
  // ─── MAHARASHTRA INSURANCE ────────────────────────────────────────────────
  {
    id: "pmfby-maharashtra",
    name: "PMFBY – Maharashtra State Implementation",
    type: "Insurance",
    region: "Maharashtra",
    eligibility: "Farmers in Maharashtra growing notified crops. Must register through Maharashtra state agriculture portal before enrollment deadline.",
    criteria: "Eligibility: Maharashtra residency, notified crop, state portal registration, and valid crop survey records.",
    parameters: "Same premium structure as central PMFBY (Kharif 2%, Rabi 1.5%). State shares subsidy with central government.",
    features: "Maharashtra has one of highest claim settlements nationally. Digital crop survey (e-peek pahani) used. State-level grievance redressal.",
    createdAt: now,
  },
  {
    id: "state-crop-insurance-addons",
    name: "State Crop Insurance Variants / Add-ons",
    type: "Insurance",
    region: "Maharashtra",
    eligibility: "Farmers registered under Maharashtra state agriculture department and enrolled in base PMFBY scheme.",
    criteria: "Eligibility: base PMFBY enrollment, Maharashtra registration, and region-specific add-on acceptance.",
    parameters: "State-funded add-on coverage beyond central scheme. Local crop customization for region-specific risks.",
    features: "Faster claim processing at state level. Local crop and weather customization. Additional coverage for state-specific perils.",
    createdAt: now,
  },
  // ─── MAHARASHTRA SUBSIDIES ────────────────────────────────────────────────
  {
    id: "namo-shetkari-subsidy",
    name: "Namo Shetkari Maha Samman Nidhi Yojana",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Farmers eligible under PM-KISAN who are Maharashtra residents. Must have DBT-enabled bank account linked to Aadhaar.",
    criteria: "Eligibility: PM-KISAN beneficiary, Maharashtra resident, Aadhaar-linked DBT account, and no duplicate family claim.",
    parameters: "₹6,000 per year (state top-up). Total benefit = ₹12,000/year combined with PM-KISAN. Paid via DBT.",
    features: "Direct DBT to farmer bank accounts. State top-up scheme on PM-KISAN. Automatic enrollment for PM-KISAN beneficiaries.",
    createdAt: now,
  },
  {
    id: "saur-krushi-pump-subsidy",
    name: "Mukhyamantri Saur Krushi Pump Yojana",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Farmers with irrigation need and limited electricity access. Must have cultivable land and genuine pump requirement.",
    criteria: "Eligibility: cultivable land, irrigation need, feasible solar site, and pump requirement verified.",
    parameters: "Subsidy up to 90–95% for SC/ST farmers. 75–80% for general farmers. One solar pump per landholding.",
    features: "Solar pump installation for irrigation. Reduces electricity cost significantly. One-time capital asset benefit.",
    createdAt: now,
  },
  {
    id: "jalyukt-shivar-subsidy",
    name: "Jalyukt Shivar Abhiyan",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Farmers in drought-prone areas of Maharashtra. Community/village-level participation required.",
    criteria: "Eligibility: drought-prone zone, village/community participation, and local body approval.",
    parameters: "Subsidy for water conservation structures (farm ponds, check dams, nala bunding). Village-level implementation.",
    features: "Improves groundwater levels. Reduces drought impact on agriculture. Community-based water self-sufficiency.",
    createdAt: now,
  },
  {
    id: "birsa-munda-subsidy",
    name: "Birsa Munda Krishi Kranti Yojana",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Scheduled Tribe (ST) category farmers in Maharashtra with valid tribal certificate and cultivable land.",
    criteria: "Eligibility: ST certificate, cultivable land, and irrigation or farm-development requirement.",
    parameters: "Up to 100% subsidy on eligible components including irrigation, farm development, and equipment.",
    features: "Irrigation support and farm development. Tribal-focused agricultural development. Comprehensive farm improvement package.",
    createdAt: now,
  },
  {
    id: "ambedkar-krishi-subsidy",
    name: "Dr. Babasaheb Ambedkar Krishi Swavalamban Yojana",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Scheduled Caste (SC) category farmers in Maharashtra with valid caste certificate and cultivable land.",
    criteria: "Eligibility: SC certificate, cultivable land, and approved farm development need.",
    parameters: "Financial support for irrigation infrastructure, farm pond, drip system, pump set, and land levelling.",
    features: "Improves farm productivity for SC farmers. Subsidized irrigation infrastructure. Land development support.",
    createdAt: now,
  },
  {
    id: "micro-irrigation-maha",
    name: "Maharashtra Micro Irrigation Scheme",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Farmers with cultivable land in Maharashtra. Small and marginal farmers given priority.",
    criteria: "Eligibility: landholding in Maharashtra, drip/sprinkler need, and small/marginal farmer priority where applicable.",
    parameters: "Additional state subsidy over and above central PMKSY subsidy for drip and sprinkler systems.",
    features: "Promotes drip irrigation and water efficiency. State top-up over central scheme. Reduces irrigation water wastage.",
    createdAt: now,
  },
  {
    id: "farm-mechanization-maha",
    name: "Farm Mechanization Subsidy (Maharashtra)",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Small and marginal farmers in Maharashtra. Priority to economically weaker farmers for tools and machinery.",
    criteria: "Eligibility: small/marginal farmer status, valid landholding, and machinery requirement.",
    parameters: "State subsidy on agricultural tools and machinery. Top-up over central SMAM scheme subsidy.",
    features: "State top-up over central SMAM subsidy. Reduces manual labor for small farmers. Custom Hiring Centers supported.",
    createdAt: now,
  },
  {
    id: "electricity-subsidy-maha",
    name: "Electricity Subsidy for Farmers (Maharashtra)",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Farmers using electricity for irrigation purposes. Must have registered agricultural pump connection.",
    criteria: "Eligibility: agricultural pump connection, irrigation use, and verified electricity account.",
    parameters: "Reduced electricity tariff for agricultural pump connections. Flat rate billing for irrigation pumps.",
    features: "Lowers irrigation cost substantially. Flat rate instead of metered billing. Administered through MSEDCL.",
    createdAt: now,
  },
];

export async function seedInsuranceSubsidies(db: Db): Promise<void> {
  try {
    const collection = db.collection("insurance_subsidies");
    const count = await collection.countDocuments();
    if (count > 0) {
      logger.info({ count }, "Insurance subsidies already seeded — skipping");
      return;
    }
    await collection.createIndex({ id: 1 }, { unique: true });
    await collection.createIndex({ type: 1 });
    await collection.createIndex({ region: 1 });
    await collection.createIndex({ name: "text" });
    await collection.insertMany(INSURANCE_SUBSIDIES as unknown[]);
    logger.info({ inserted: INSURANCE_SUBSIDIES.length }, "Insurance subsidies seeded successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed insurance subsidies");
  }
}
