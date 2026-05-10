import { useState, useEffect, useCallback } from "react";
import { X, Upload, Check, AlertCircle, Eye, Trash2, ArrowLeft } from "lucide-react";
import { apiCreateFarmer, notifyFarmerChange } from "@/data/farmerApi";

const districtsByState: Record<string, string[]> = {
  Maharashtra: ["Nagpur", "Pune", "Amravati", "Nashik", "Latur", "Wardha"],
  Karnataka: ["Bangalore", "Mysore", "Hubli", "Belgaum"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur"],
  "Uttar Pradesh": ["Lucknow", "Agra", "Varanasi"],
  Punjab: ["Ludhiana", "Amritsar", "Patiala"],
  Others: ["Other District"],
};

const talukasByDistrict: Record<string, string[]> = {
  Nagpur: ["Nagpur Rural", "Kamptee", "Hingna", "Parseoni"],
  Pune: ["Haveli", "Baramati", "Junnar", "Mulshi"],
  Amravati: ["Amravati City", "Achalpur", "Chandur"],
  Nashik: ["Nashik City", "Igatpuri", "Dindori", "Sinnar"],
  Latur: ["Latur City", "Ausa", "Nilanga", "Udgir"],
  Wardha: ["Wardha City", "Deoli", "Seloo", "Arvi"],
};

const cropOptions = ["Cotton", "Soybean", "Sugarcane", "Wheat", "Rice", "Tur Dal", "Grapes", "Onion", "Jowar", "Bajra"];
const bankOptions = ["SBI", "Bank of India", "PNB", "Bank of Maharashtra", "Canara Bank", "Union Bank", "HDFC", "Others"];
const soilTypes = ["Black Cotton", "Red Laterite", "Alluvial", "Sandy", "Loamy"];
const irrigationSources = ["Well", "Borewell", "Canal", "River", "Rain-fed", "Drip Irrigation"];
const disabilityTypes = ["Visual", "Hearing", "Locomotor", "Intellectual", "Mental Illness", "Multiple"];

interface Props {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

interface LandParcel {
  id: number;
  state: string;
  district: string;
  taluka: string;
  village: string;
  surveyNo: string;
  totalArea: string;
  areaUnit: string;
  irrigatedArea: string;
  ownershipType: string;
  soilType: string;
  irrigationSources: string[];
  primaryCrop: string;
  secondaryCrop: string;
  farmingType: string;
}

interface DocUpload {
  name: string;
  fileName: string;
  size: string;
  status: "uploaded" | "failed" | "none";
}

export default function FarmerRegistrationForm({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [generatedFarmerId, setGeneratedFarmerId] = useState("");

  // Step 1 fields — pre-filled with dummy data
  const [fullName, setFullName] = useState("Suresh Balaji Patil");
  const [fatherName, setFatherName] = useState("Balaji Patil");
  const [dob, setDob] = useState("1985-06-15");
  const [gender, setGender] = useState("Male");
  const [category, setCategory] = useState("OBC");
  const [aadhaar, setAadhaar] = useState("9876-5432-1098");
  const [aadhaarValid, setAadhaarValid] = useState<boolean | null>(true);
  const [mobile, setMobile] = useState("9876543210");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(0);
  const [mobileVerified, setMobileVerified] = useState(true);
  const [altMobile, setAltMobile] = useState("");
  const [email, setEmail] = useState("suresh.patil@gmail.com");
  const [religion, setReligion] = useState("Hindu");
  const [diffAbled, setDiffAbled] = useState(false);
  const [disabilityType, setDisabilityType] = useState("");
  const [photoFile, setPhotoFile] = useState("profile_photo.jpg");

  // Step 2 — pre-filled
  const [landParcels, setLandParcels] = useState<LandParcel[]>([{
    id: 1, state: "Maharashtra", district: "Nagpur", taluka: "Nagpur Rural", village: "Wardha",
    surveyNo: "142/A", totalArea: "4.5", areaUnit: "Acres", irrigatedArea: "3.0",
    ownershipType: "Own", soilType: "Black Cotton", irrigationSources: ["Well", "Canal"],
    primaryCrop: "Cotton", secondaryCrop: "Soybean", farmingType: "Traditional"
  }]);
  const [bankName, setBankName] = useState("SBI");
  const [branchName, setBranchName] = useState("Wardha Main Branch");
  const [ifsc, setIfsc] = useState("SBIN0001234");
  const [ifscValid, setIfscValid] = useState<boolean | null>(true);
  const [accountNo, setAccountNo] = useState("12345678901");
  const [confirmAccountNo, setConfirmAccountNo] = useState("12345678901");
  const [accountType, setAccountType] = useState("Savings");
  const [aadhaarLinked, setAadhaarLinked] = useState("Yes");
  const [npciStatus, setNpciStatus] = useState("Mapped");

  // Step 3 — pre-filled
  const [docs, setDocs] = useState<DocUpload[]>([
    { name: "Aadhaar Card", fileName: "aadhaar_scan.pdf", size: "845 KB", status: "uploaded" },
    { name: "Land Ownership Proof / 7/12 Extract", fileName: "land_7-12.pdf", size: "1.2 MB", status: "uploaded" },
    { name: "Bank Passbook Front Page", fileName: "passbook_front.jpg", size: "620 KB", status: "uploaded" },
    { name: "Passport Size Photo", fileName: "photo_passport.jpg", size: "312 KB", status: "uploaded" },
  ]);
  const [casteCertDoc, setCasteCertDoc] = useState<DocUpload>({ name: "Caste Certificate", fileName: "caste_cert.pdf", size: "540 KB", status: "uploaded" });
  const [disabilityCertDoc, setDisabilityCertDoc] = useState<DocUpload>({ name: "Disability Certificate", fileName: "", size: "", status: "none" });
  const [tenancyDoc, setTenancyDoc] = useState<DocUpload>({ name: "Tenancy Agreement", fileName: "", size: "", status: "none" });
  const [otherDoc, setOtherDoc] = useState<DocUpload>({ name: "Other Document", fileName: "", size: "", status: "none" });
  const [declaration, setDeclaration] = useState(true);

  // OTP timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [otpTimer]);

  const calcAge = useCallback(() => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
  }, [dob]);

  const formatAadhaar = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 12);
    let formatted = "";
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += "-";
      formatted += digits[i];
    }
    setAadhaar(formatted);
    if (digits.length === 12) setAadhaarValid(true);
    else if (digits.length > 0) setAadhaarValid(false);
    else setAadhaarValid(null);
  };

  const sendOtp = () => {
    setOtpSent(true);
    setOtpTimer(60);
    setOtp(["", "", "", ""]);
    setMobileVerified(false);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 3) {
      const next = document.getElementById(`otp-${idx + 1}`);
      next?.focus();
    }
    if (newOtp.join("") === "1234") {
      setMobileVerified(true);
    }
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    delete newErrors[field];
    if (field === "fullName" && value.length < 3) newErrors.fullName = "Name must be at least 3 characters";
    if (field === "fatherName" && !value.trim()) newErrors.fatherName = "This field is required";
    if (field === "dob") {
      const age = calcAge();
      if (age !== null && age < 18) newErrors.dob = "Must be at least 18 years old";
    }
    if (field === "mobile" && value.replace(/\D/g, "").length !== 10) newErrors.mobile = "Enter a valid 10-digit number";
    if (field === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = "Invalid email format";
    setErrors(newErrors);
  };

  const isStep1Valid = () => {
    return fullName.length >= 3 && fatherName.trim() && dob && calcAge()! >= 18 && gender && category && aadhaarValid === true && mobile.replace(/\D/g, "").length === 10 && mobileVerified;
  };

  const isStep2Valid = () => {
    const lp = landParcels[0];
    return lp.state && lp.district && lp.surveyNo && lp.totalArea && bankName && ifsc.length === 11 && accountNo && accountNo === confirmAccountNo && accountType;
  };

  const isStep3Valid = () => {
    const requiredDocs = docs.filter((_, i) => i < 4);
    const allUploaded = requiredDocs.every(d => d.status === "uploaded");
    const needsCaste = ["SC", "ST", "OBC"].includes(category);
    const casteOk = !needsCaste || casteCertDoc.status === "uploaded";
    return allUploaded && casteOk && declaration;
  };

  const handleDocUpload = (index: number) => {
    const fakeNames = ["aadhaar_scan.pdf", "land_7-12.pdf", "passbook_front.jpg", "photo_passport.jpg", "caste_cert.pdf", "disability_cert.pdf", "tenancy.pdf", "other_doc.pdf"];
    const name = fakeNames[index] || "document.pdf";
    const sizeKb = Math.floor(Math.random() * 1500) + 200;
    const tooLarge = sizeKb > 2000;
    setDocs(prev => prev.map((d, i) => i === index ? { ...d, fileName: name, size: tooLarge ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`, status: tooLarge ? "failed" as const : "uploaded" as const } : d));
  };

  const updateLandParcel = (idx: number, field: keyof LandParcel, value: any) => {
    setLandParcels(prev => prev.map((lp, i) => {
      if (i !== idx) return lp;
      const updated = { ...lp, [field]: value };
      if (field === "state") { updated.district = ""; updated.taluka = ""; }
      if (field === "district") { updated.taluka = ""; }
      return updated;
    }));
  };

  const toggleIrrigation = (idx: number, source: string) => {
    setLandParcels(prev => prev.map((lp, i) => {
      if (i !== idx) return lp;
      const sources = lp.irrigationSources.includes(source)
        ? lp.irrigationSources.filter(s => s !== source)
        : [...lp.irrigationSources, source];
      return { ...lp, irrigationSources: sources };
    }));
  };

  const addLandParcel = () => {
    setLandParcels(prev => [...prev, {
      id: prev.length + 1, state: "", district: "", taluka: "", village: "", surveyNo: "",
      totalArea: "", areaUnit: "Acres", irrigatedArea: "", ownershipType: "",
      soilType: "", irrigationSources: [], primaryCrop: "", secondaryCrop: "", farmingType: ""
    }]);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setSubmitStep(0);
    setTimeout(() => setSubmitStep(1), 1500);
    setTimeout(() => setSubmitStep(2), 3000);
    setTimeout(async () => {
      try {
        const saved = await apiCreateFarmer({
          name: fullName,
          village: landParcels[0]?.village || "",
          district: landParcels[0]?.district || "",
          land: parseFloat(landParcels[0]?.totalArea) || 0,
          crop: landParcels[0]?.primaryCrop || "",
          aadhaar,
          surveyNumber: landParcels[0]?.surveyNo || "",
          bankAccount: accountNo ? `****${accountNo.slice(-4)}` : "",
          status: "Active",
          source: "manual",
          fatherName,
          dob,
          gender,
          category,
          religion,
          mobile,
          altMobile,
          email,
          diffAbled,
          disabilityType,
          landParcels: landParcels.map(lp => ({
            state: lp.state,
            district: lp.district,
            taluka: lp.taluka,
            village: lp.village,
            surveyNo: lp.surveyNo,
            totalArea: lp.totalArea,
            areaUnit: lp.areaUnit,
            irrigatedArea: lp.irrigatedArea,
            ownershipType: lp.ownershipType,
            soilType: lp.soilType,
            irrigationSources: lp.irrigationSources,
            primaryCrop: lp.primaryCrop,
            secondaryCrop: lp.secondaryCrop,
            farmingType: lp.farmingType,
          })),
          bankName,
          branchName,
          ifsc,
          accountNo,
          accountType,
          aadhaarLinked,
          npciStatus,
          docs: [
            ...docs,
            ...(["SC", "ST", "OBC"].includes(category) ? [casteCertDoc] : []),
            ...(diffAbled ? [disabilityCertDoc] : []),
            ...(landParcels.some(lp => lp.ownershipType === "Leased") ? [tenancyDoc] : []),
            ...(otherDoc.fileName ? [otherDoc] : []),
          ].filter(d => d.status === "uploaded"),
          aiRiskScore: 18,
        });
        setGeneratedFarmerId(saved.farmerId);
        notifyFarmerChange();
      } catch {
        setGeneratedFarmerId("F-???");
      } finally {
        setSubmitting(false);
        setShowResult(true);
      }
    }, 4500);
  };

  const validateIfsc = (val: string) => {
    setIfsc(val.toUpperCase());
    if (val.length === 11) setIfscValid(true);
    else if (val.length > 0) setIfscValid(false);
    else setIfscValid(null);
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50";
  const labelCls = "block text-sm font-medium mb-1";
  const errorCls = "text-xs text-destructive mt-1 flex items-center gap-1";

  if (showResult) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 md:p-10">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4 animate-scale-in">
              <Check className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-heading text-2xl">AI Verification Complete</h2>
          </div>
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm"><span className="text-success">✅</span> No duplicate found</div>
            <div className="flex items-center gap-2 text-sm"><span className="text-success">✅</span> Land records cross-verified</div>
            <div className="flex items-center gap-2 text-sm"><span className="text-success">✅</span> Bank account NPCI-linked</div>
            <div className="flex items-center gap-2 text-sm"><span className="text-warning">⚠️</span> Caste certificate pending upload</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(140 20% 90%)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(142 60% 40%)" strokeWidth="3" strokeDasharray="88" strokeDashoffset={88 - 88 * 0.18} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">18</span>
              </div>
              <div>
                <div className="text-sm font-medium">AI Risk Score: 18/100</div>
                <div className="text-xs text-success font-medium">Low Risk</div>
              </div>
            </div>
            <div className="text-sm font-mono text-secondary font-medium">Farmer ID Assigned: {generatedFarmerId}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 text-sm px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80">Close</button>
            <button onClick={onClose} className="flex-1 text-sm px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90">View Farmer Profile</button>
          </div>
        </div>
      </div>
    );
  }

  if (submitting) {
    const steps = ["Checking for duplicate Aadhaar...", "Validating land records...", "AI Risk Assessment..."];
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="max-w-sm w-full p-8 text-center">
          <div className="w-12 h-12 mx-auto border-4 border-secondary border-t-transparent rounded-full animate-spin mb-6" />
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${i <= submitStep ? "text-foreground" : "text-muted-foreground"}`}>
                {i < submitStep ? <Check className="h-4 w-4 text-success flex-shrink-0" /> :
                  i === submitStep ? <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin flex-shrink-0" /> :
                    <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />}
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-heading text-2xl">Add New Farmer</h2>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["Personal Info", "Land & Bank Details", "Document Upload"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full text-xs flex items-center justify-center font-bold transition-colors ${i <= step ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
              <span className={`text-sm hidden sm:inline ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < 2 && <div className={`w-12 h-0.5 ${i < step ? "bg-secondary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name <span className="text-destructive">*</span></label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} onBlur={() => validateField("fullName", fullName)} className={inputCls} placeholder="Enter full name" />
                {errors.fullName && <p className={errorCls}><AlertCircle className="h-3 w-3" />{errors.fullName}</p>}
              </div>
              <div>
                <label className={labelCls}>Father / Husband Name <span className="text-destructive">*</span></label>
                <input value={fatherName} onChange={e => setFatherName(e.target.value)} onBlur={() => validateField("fatherName", fatherName)} className={inputCls} placeholder="Enter father/husband name" />
                {errors.fatherName && <p className={errorCls}><AlertCircle className="h-3 w-3" />{errors.fatherName}</p>}
              </div>
              <div>
                <label className={labelCls}>Date of Birth <span className="text-destructive">*</span></label>
                <input type="date" value={dob} onChange={e => { setDob(e.target.value); }} onBlur={() => validateField("dob", dob)} className={inputCls} />
                {dob && calcAge() !== null && <p className="text-xs text-muted-foreground mt-1">Age: {calcAge()} years</p>}
                {errors.dob && <p className={errorCls}><AlertCircle className="h-3 w-3" />{errors.dob}</p>}
              </div>
              <div>
                <label className={labelCls}>Gender <span className="text-destructive">*</span></label>
                <div className="flex gap-4 mt-2">
                  {["Male", "Female", "Other"].map(g => (
                    <label key={g} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} className="accent-secondary" />{g}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Category <span className="text-destructive">*</span></label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                  <option value="">Select Category</option>
                  {["General", "OBC", "SC", "ST", "Minority"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Religion</label>
                <select value={religion} onChange={e => setReligion(e.target.value)} className={inputCls}>
                  <option value="">Select Religion</option>
                  {["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Other"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Aadhaar Number <span className="text-destructive">*</span></label>
              <input value={aadhaar} onChange={e => formatAadhaar(e.target.value)} className={inputCls} placeholder="XXXX-XXXX-XXXX" />
              {aadhaarValid === true && <p className="text-xs text-success mt-1">✅ Aadhaar format valid</p>}
              {aadhaarValid === false && <p className="text-xs text-destructive mt-1">❌ Invalid Aadhaar format</p>}
            </div>

            <div>
              <label className={labelCls}>Mobile Number <span className="text-destructive">*</span></label>
              <div className="flex gap-2">
                <input value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} onBlur={() => validateField("mobile", mobile)} className={`${inputCls} flex-1`} placeholder="10-digit mobile" />
                {!mobileVerified && (
                  <button onClick={sendOtp} disabled={mobile.length !== 10 || (otpSent && otpTimer > 0)}
                    className="text-sm px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-50 whitespace-nowrap">
                    {otpSent && otpTimer > 0 ? `Resend (${otpTimer}s)` : "Send OTP"}
                  </button>
                )}
              </div>
              {errors.mobile && <p className={errorCls}><AlertCircle className="h-3 w-3" />{errors.mobile}</p>}
              {mobileVerified && <p className="text-xs text-success mt-1">✅ Mobile Verified</p>}
            </div>

            {otpSent && !mobileVerified && (
              <div>
                <label className={labelCls}>Enter OTP (hint: 1234)</label>
                <div className="flex gap-2">
                  {otp.map((v, i) => (
                    <input key={i} id={`otp-${i}`} value={v} onChange={e => handleOtpChange(i, e.target.value.replace(/\D/g, ""))}
                      maxLength={1} className="w-12 h-12 text-center text-lg font-bold bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50" />
                  ))}
                </div>
                {otpTimer > 0 && <p className="text-xs text-muted-foreground mt-1">OTP expires in {otpTimer}s</p>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Alternate Mobile</label>
                <input value={altMobile} onChange={e => setAltMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} className={inputCls} placeholder="Optional" />
              </div>
              <div>
                <label className={labelCls}>Email ID</label>
                <input value={email} onChange={e => setEmail(e.target.value)} onBlur={() => validateField("email", email)} className={inputCls} placeholder="Optional" />
                {errors.email && <p className={errorCls}><AlertCircle className="h-3 w-3" />{errors.email}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Differently Abled?</label>
              <button onClick={() => setDiffAbled(!diffAbled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${diffAbled ? "bg-secondary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${diffAbled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              {diffAbled && (
                <select value={disabilityType} onChange={e => setDisabilityType(e.target.value)} className="text-sm bg-background border border-border rounded-lg px-3 py-1.5">
                  <option value="">Type of Disability</option>
                  {disabilityTypes.map(d => <option key={d}>{d}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className={labelCls}>Profile Photo</label>
              <div onClick={() => setPhotoFile("profile_photo.jpg")}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-secondary/50 transition-colors">
                {photoFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl">👤</div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{photoFile}</p>
                      <p className="text-xs text-success">✅ Uploaded</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <div className="space-y-6">
            {landParcels.map((lp, lpIdx) => (
              <div key={lp.id} className="border border-border rounded-lg p-4 space-y-4">
                <h4 className="font-heading text-sm">Land Parcel {lpIdx + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>State <span className="text-destructive">*</span></label>
                    <select value={lp.state} onChange={e => updateLandParcel(lpIdx, "state", e.target.value)} className={inputCls}>
                      <option value="">Select State</option>
                      {Object.keys(districtsByState).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>District <span className="text-destructive">*</span></label>
                    <select value={lp.district} onChange={e => updateLandParcel(lpIdx, "district", e.target.value)} className={inputCls} disabled={!lp.state}>
                      <option value="">Select District</option>
                      {(districtsByState[lp.state] || []).map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Taluka</label>
                    <select value={lp.taluka} onChange={e => updateLandParcel(lpIdx, "taluka", e.target.value)} className={inputCls} disabled={!lp.district}>
                      <option value="">Select Taluka</option>
                      {(talukasByDistrict[lp.district] || []).map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Village</label>
                    <input value={lp.village} onChange={e => updateLandParcel(lpIdx, "village", e.target.value)} className={inputCls} placeholder="Village name" />
                  </div>
                  <div>
                    <label className={labelCls}>Survey / Gat Number <span className="text-destructive">*</span></label>
                    <input value={lp.surveyNo} onChange={e => updateLandParcel(lpIdx, "surveyNo", e.target.value)} className={inputCls} placeholder="e.g. 142/A" />
                  </div>
                  <div>
                    <label className={labelCls}>Total Land Area <span className="text-destructive">*</span></label>
                    <div className="flex gap-2">
                      <input type="number" value={lp.totalArea} onChange={e => updateLandParcel(lpIdx, "totalArea", e.target.value)} className={`${inputCls} flex-1`} placeholder="Area" />
                      <select value={lp.areaUnit} onChange={e => updateLandParcel(lpIdx, "areaUnit", e.target.value)} className="text-sm bg-background border border-border rounded-lg px-2">
                        {["Acres", "Hectares", "Bigha"].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Irrigated Area</label>
                    <input type="number" value={lp.irrigatedArea} onChange={e => {
                      const val = e.target.value;
                      if (lp.totalArea && parseFloat(val) > parseFloat(lp.totalArea)) return;
                      updateLandParcel(lpIdx, "irrigatedArea", val);
                    }} className={inputCls} placeholder="Must be ≤ total" />
                  </div>
                  <div>
                    <label className={labelCls}>Un-irrigated Area</label>
                    <input readOnly value={lp.totalArea && lp.irrigatedArea ? (parseFloat(lp.totalArea) - parseFloat(lp.irrigatedArea)).toFixed(1) : ""} className={`${inputCls} bg-muted/30`} placeholder="Auto-calculated" />
                  </div>
                  <div>
                    <label className={labelCls}>Land Ownership Type</label>
                    <select value={lp.ownershipType} onChange={e => updateLandParcel(lpIdx, "ownershipType", e.target.value)} className={inputCls}>
                      <option value="">Select Type</option>
                      {["Own", "Leased", "Shared", "Government Allotted"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Soil Type</label>
                    <select value={lp.soilType} onChange={e => updateLandParcel(lpIdx, "soilType", e.target.value)} className={inputCls}>
                      <option value="">Select Soil</option>
                      {soilTypes.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Source of Irrigation</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {irrigationSources.map(s => (
                      <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="checkbox" checked={lp.irrigationSources.includes(s)} onChange={() => toggleIrrigation(lpIdx, s)} className="accent-secondary" />{s}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Primary Crop</label>
                    <select value={lp.primaryCrop} onChange={e => updateLandParcel(lpIdx, "primaryCrop", e.target.value)} className={inputCls}>
                      <option value="">Select Crop</option>
                      {cropOptions.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Secondary Crop</label>
                    <select value={lp.secondaryCrop} onChange={e => updateLandParcel(lpIdx, "secondaryCrop", e.target.value)} className={inputCls}>
                      <option value="">Optional</option>
                      {cropOptions.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Farming Type</label>
                    <div className="flex gap-3 mt-2">
                      {["Traditional", "Organic", "Mixed"].map(t => (
                        <label key={t} className="flex items-center gap-1 text-sm cursor-pointer">
                          <input type="radio" name={`farming-${lpIdx}`} checked={lp.farmingType === t} onChange={() => updateLandParcel(lpIdx, "farmingType", t)} className="accent-secondary" />{t}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addLandParcel} className="text-sm text-secondary hover:underline">+ Add Another Land Parcel</button>

            <div className="border border-border rounded-lg p-4 space-y-4">
              <h4 className="font-heading text-sm">Bank Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Bank Name <span className="text-destructive">*</span></label>
                  <select value={bankName} onChange={e => setBankName(e.target.value)} className={inputCls}>
                    <option value="">Select Bank</option>
                    {bankOptions.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Branch Name</label>
                  <input value={branchName} onChange={e => setBranchName(e.target.value)} className={inputCls} placeholder="Branch name" />
                </div>
                <div>
                  <label className={labelCls}>IFSC Code <span className="text-destructive">*</span></label>
                  <input value={ifsc} onChange={e => validateIfsc(e.target.value.slice(0, 11))} className={inputCls} placeholder="e.g. SBIN0001234" />
                  {ifscValid === true && <p className="text-xs text-success mt-1">✅ Valid IFSC — {bankName || "Bank"} detected</p>}
                  {ifscValid === false && <p className="text-xs text-destructive mt-1">❌ IFSC must be 11 characters</p>}
                </div>
                <div>
                  <label className={labelCls}>Account Number <span className="text-destructive">*</span></label>
                  <input value={accountNo} onChange={e => setAccountNo(e.target.value.replace(/\D/g, ""))} className={inputCls} placeholder="Account number" />
                </div>
                <div>
                  <label className={labelCls}>Confirm Account Number <span className="text-destructive">*</span></label>
                  <input value={confirmAccountNo} onChange={e => setConfirmAccountNo(e.target.value.replace(/\D/g, ""))} className={inputCls} placeholder="Re-enter account number" />
                  {confirmAccountNo && accountNo !== confirmAccountNo && <p className={errorCls}><AlertCircle className="h-3 w-3" />Account numbers do not match</p>}
                </div>
                <div>
                  <label className={labelCls}>Account Type <span className="text-destructive">*</span></label>
                  <div className="flex gap-4 mt-2">
                    {["Savings", "Current", "Jan Dhan"].map(t => (
                      <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" name="accType" checked={accountType === t} onChange={() => setAccountType(t)} className="accent-secondary" />{t}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Account linked with Aadhaar?</label>
                  <div className="flex gap-4 mt-2">
                    {["Yes", "No"].map(v => (
                      <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" name="aadhaarLink" checked={aadhaarLinked === v} onChange={() => setAadhaarLinked(v)} className="accent-secondary" />{v}
                      </label>
                    ))}
                  </div>
                  {aadhaarLinked === "No" && <div className="mt-2 bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 text-xs text-warning">⚠️ Aadhaar linking is required for subsidy disbursement</div>}
                </div>
                <div>
                  <label className={labelCls}>NPCI Mapper Status</label>
                  <select value={npciStatus} onChange={e => setNpciStatus(e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    {["Mapped", "Not Mapped", "Unknown"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 2 && (
          <div className="space-y-4">
            {docs.map((doc, i) => (
              <DocUploadRow key={i} doc={doc} onUpload={() => handleDocUpload(i)} onRemove={() => setDocs(prev => prev.map((d, j) => j === i ? { ...d, fileName: "", status: "none" } : d))} />
            ))}
            {["SC", "ST", "OBC"].includes(category) && (
              <DocUploadRow doc={casteCertDoc} onUpload={() => { const sizeKb = Math.floor(Math.random()*1500)+200; setCasteCertDoc(prev => ({...prev, fileName:"caste_cert.pdf", size:`${sizeKb} KB`, status: sizeKb>2000?"failed":"uploaded"})); }} onRemove={() => setCasteCertDoc(prev => ({ ...prev, fileName: "", status: "none" }))} required />
            )}
            {diffAbled && (
              <DocUploadRow doc={disabilityCertDoc} onUpload={() => { const sizeKb = Math.floor(Math.random()*1500)+200; setDisabilityCertDoc(prev => ({...prev, fileName:"disability_cert.pdf", size:`${sizeKb} KB`, status: sizeKb>2000?"failed":"uploaded"})); }} onRemove={() => setDisabilityCertDoc(prev => ({ ...prev, fileName: "", status: "none" }))} />
            )}
            {landParcels.some(lp => lp.ownershipType === "Leased") && (
              <DocUploadRow doc={tenancyDoc} onUpload={() => { const sizeKb = Math.floor(Math.random()*1500)+200; setTenancyDoc(prev => ({...prev, fileName:"tenancy.pdf", size:`${sizeKb} KB`, status: sizeKb>2000?"failed":"uploaded"})); }} onRemove={() => setTenancyDoc(prev => ({ ...prev, fileName: "", status: "none" }))} />
            )}
            <DocUploadRow doc={otherDoc} onUpload={() => { const sizeKb = Math.floor(Math.random()*1500)+200; setOtherDoc(prev => ({...prev, fileName:"other_doc.pdf", size:`${sizeKb} KB`, status: sizeKb>2000?"failed":"uploaded"})); }} onRemove={() => setOtherDoc(prev => ({ ...prev, fileName: "", status: "none" }))} />

            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={declaration} onChange={e => setDeclaration(e.target.checked)} className="accent-secondary mt-1" />
                <span className="text-xs leading-relaxed">I hereby declare that all information provided is true and correct. I consent to Aadhaar-based verification and data sharing with government schemes.</span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t border-border">
          <button onClick={() => step === 0 ? onClose() : setStep(s => s - 1)} className="text-sm px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80">
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 0 ? !isStep1Valid() : !isStep2Valid()}
              className="text-sm px-6 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-50">Next</button>
          ) : (
            <button onClick={handleSubmit} disabled={!isStep3Valid()}
              className="text-sm px-6 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-50">Submit & AI Verify</button>
          )}
        </div>
      </div>
    </div>
  );
}

function DocUploadRow({ doc, onUpload, onRemove, required }: { doc: DocUpload; onUpload: () => void; onRemove: () => void; required?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{doc.name} {required && <span className="text-destructive">*</span>}</div>
        {doc.fileName ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground truncate">{doc.fileName} ({doc.size})</span>
            {doc.status === "uploaded" && <span className="text-xs text-success font-medium">✅ Uploaded</span>}
            {doc.status === "failed" && <span className="text-xs text-destructive font-medium">❌ Exceeds 2MB</span>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">PDF / JPG, max 2MB</p>
        )}
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {doc.fileName && doc.status === "uploaded" && (
          <button className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"><Eye className="h-3 w-3" /></button>
        )}
        {doc.fileName ? (
          <button onClick={onRemove} className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="h-3 w-3" /></button>
        ) : (
          <button onClick={onUpload} className="text-xs px-3 py-1.5 rounded bg-secondary/10 text-secondary hover:bg-secondary/20">Upload</button>
        )}
      </div>
    </div>
  );
}
