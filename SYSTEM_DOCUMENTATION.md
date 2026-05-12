# Krushi Suvidha — Complete System Documentation

> **Platform**: Krushi Suvidha (कृषी सुविधा)
> **Built by**: Airavata Technologies
> **Purpose**: Maharashtra State Agricultural Administration Platform — connecting district officers with farmers through a unified digital ecosystem.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture & Infrastructure](#2-architecture--infrastructure)
3. [Shared Database — MongoDB Atlas](#3-shared-database--mongodb-atlas)
4. [API Server — The Bridge](#4-api-server--the-bridge)
5. [AgriAdmin Portal — Admin Web Application](#5-agriadmin-portal--admin-web-application)
6. [Krushi Suvidha — Farmer Mobile Application](#6-krushi-suvidha--farmer-mobile-application)
7. [Connectivity Between Admin and Mobile](#7-connectivity-between-admin-and-mobile)
8. [OCR Document Extraction Flow](#8-ocr-document-extraction-flow)
9. [Authentication Systems](#9-authentication-systems)
10. [Notifications System](#10-notifications-system)
11. [Grievances System](#11-grievances-system)
12. [Applications System](#12-applications-system)
13. [AI-Powered Features](#13-ai-powered-features)
14. [Multi-Language Support](#14-multi-language-support)
15. [Role & Permission System](#15-role--permission-system)

---

## 1. System Overview

Krushi Suvidha is a two-sided platform that digitises the entire agricultural administration workflow in Maharashtra:

- **Admin Side** (`AgriAdmin Portal`) — A browser-based dashboard used by district and taluka government officers to register farmers, process applications, manage grievances, send notifications, and analyse data.
- **Farmer Side** (`Krushi Suvidha App`) — A mobile app (Expo / React Native) used by farmers to upload KYC documents, apply for government schemes, insurance and subsidies, raise grievances, and receive real-time notifications.
- **API Server** — A shared Express 5 backend that both applications communicate with. It connects to MongoDB Atlas, runs OCR document extraction via Datalab, and exposes all business logic via REST endpoints.

All three components share the same MongoDB database, so every action taken on either side is immediately visible on the other.

---

## 2. Architecture & Infrastructure

```
┌───────────────────────────────────────────────────────────┐
│                       BROWSER / DEVICE                    │
│                                                           │
│   ┌──────────────────────┐   ┌──────────────────────────┐ │
│   │   AgriAdmin Portal   │   │  Krushi Suvidha App      │ │
│   │  (React + Vite)      │   │  (Expo / React Native)   │ │
│   │  Port 5000           │   │  Port 8008 (web preview) │ │
│   └──────────┬───────────┘   └────────────┬─────────────┘ │
└──────────────┼────────────────────────────┼───────────────┘
               │ /api/* (Vite proxy)        │ Direct HTTP
               ▼                            ▼
┌──────────────────────────────────────────────────────────┐
│                    API Server (Express 5)                 │
│                    Port 8000                             │
│                                                          │
│  Routes: /api/auth  /api/farmers  /api/extract           │
│          /api/schemes  /api/applications                 │
│          /api/grievances  /api/notifications             │
│          /api/ai  /api/dashboard  /api/insurance-...     │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  MongoDB Atlas (Cloud)                   │
│  Database: apnaapp                                      │
│  Collections: farmers, schemes, applications,           │
│               grievances, otp_sessions, push_tokens,    │
│               insurance_subsidies, extract_requests     │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                Datalab OCR API (External)                │
│   POST /api/v1/extract  (via DATALAB_API_KEY)           │
│   Extracts structured text from documents               │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack Summary

| Layer | Technology |
|---|---|
| Admin Frontend | React 19, Vite, Tailwind CSS v3, shadcn/ui, Recharts |
| Farmer Mobile App | Expo SDK 53, React Native 0.79, React Navigation v6 |
| API Server | Node.js 24, Express 5, Multer, Pino |
| Database | MongoDB Atlas (apnaapp database) |
| OCR Engine | Datalab API (external) |
| AI Engine | Rule-based local engines (no external API key required) |
| Monorepo Tool | pnpm workspaces |
| Language | TypeScript 5.9 throughout |

### Port Map

| Port | Service |
|---|---|
| 5000 | AgriAdmin frontend (Vite dev server) |
| 8000 | API Server (Express) |
| 8008 | Kisan Mitra Expo Metro (web preview) |
| 8080 | Redirect → 5000 |

---

## 3. Shared Database — MongoDB Atlas

Both the admin and farmer app read and write to the same MongoDB Atlas database called `apnaapp`. This is what keeps both sides in sync in real-time.

### Collections

#### `farmers`
The central collection. Each document represents one registered farmer.

Key fields:
- `farmerId` — unique ID, format `F<YYYYMMDD><NNN>` (e.g. `F20260512001`)
- `name`, `mobile`, `aadhaarMobile`, `gender`, `dob`, `address`
- `district`, `taluka`, `village`, `surveyNumber`, `land`, `crop`
- `aadhaar`, `bankName`, `branchName`, `ifsc`, `bankAccount`
- `status` — `Draft | Pending | Active | Verified | Rejected | Cancelled`
- `source` — `admin | farmer | manual` (where the registration originated)
- `documents[]` — array of uploaded document images (base64 + mimeType + docType)
- `notifications[]` — array of all notification objects for this farmer
- `ocr` — structured data extracted from each document type
- `extractionData` — raw section-by-section OCR output
- `addedAt`, `updatedAt`

#### `schemes`
Government agricultural schemes. Seeded on first startup with 18 schemes.

Key fields: `schemeId`, `name`, `type` (Central/State), `description`, `eligibility`, `benefits`, `category`, `crop`, `maxLandHa`

#### `insurance_subsidies`
Insurance and subsidy programs. Seeded on first startup with 20 entries.

Key fields: `id`, `name`, `type` (Insurance/Subsidy), `provider`, `category`, `description`, `benefits`, `coverage`, `premium`, `eligibility`

#### `applications`
All scheme, subsidy, and insurance applications from farmers.

Key fields:
- `applicationId` — unique ID
- `type` — `scheme | subsidy | insurance`
- `farmerId`, `farmerName`, `mobile`, `district`, `village`
- `schemeId`, `schemeName`, `schemeType`
- `status` — `Pending | Under Review | Approved | Rejected | Settled`
- `adminReply`, `adminNotes`
- `source` — `farmer | admin`
- `appliedAt`, `updatedAt`

#### `grievances`
All farmer complaints and grievances.

Key fields:
- `grievanceId` — unique ID
- `mobile`, `farmerId`, `farmerName`
- `category` — one of: Subsidy Delay, Wrong Beneficiary, Document Issue, Officer Misconduct, Technical Error, Portal/App Issue, Other
- `subject`, `description`
- `attachments[]` — optional file attachments (base64)
- `status` — `Open | In Progress | Resolved | Escalated | Closed | Rejected`
- `priority` — `High | Medium | Low`
- `adminReply`, `adminNotes`, `assignedTo`, `rejectionReason`, `resolvedAt`
- `source` — `farmer | admin`
- `raisedBy`, `createdAt`, `updatedAt`

#### `otp_sessions`
Temporary OTP records for farmer mobile authentication. TTL: 5 minutes.

Fields: `mobile`, `otp`, `expiresAt`, `verified`, `createdAt`

#### `push_tokens`
Expo push notification tokens registered by farmer devices.

Fields: `mobile`, `pushToken`, `updatedAt`

#### `extract_requests`
OCR job tracking. In-memory map in API server, also persisted here.

---

## 4. API Server — The Bridge

The API server is an Express 5 application running on port 8000. It is the **single source of truth** for all business logic and is consumed by both the admin portal and the farmer mobile app.

### Base URL
- Admin app: `http://localhost:8000/api` (via Vite proxy at `/api`)
- Farmer app (web): `https://<hostname>:8000/api`
- Farmer app (native): `https://krushisuvidhaai.airavatatechnologies.com/api`

### All API Endpoints

#### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/send-otp` | Send 6-digit OTP to farmer's mobile. In dev mode, returns OTP in response. |
| POST | `/api/auth/verify-otp` | Verify OTP, returns JWT token + farmer record |
| POST | `/api/auth/register-push-token` | Register device push notification token |

#### Farmer Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/farmers` | List all farmers. Query: `status`, `search`, `district`, `page`, `limit` |
| GET | `/api/farmers/by-phone/:phone` | Look up farmer by mobile number |
| GET | `/api/farmers/:id` | Get farmer by farmerId |
| POST | `/api/farmers` | Create new farmer record |
| PATCH | `/api/farmers/:id` | Update farmer fields |
| POST | `/api/farmers/submit-registration` | Finalise farmer self-registration |
| GET | `/api/farmers/:id/documents` | Retrieve base64 document images |

#### Document OCR
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/document-types` | List 5 supported document types |
| POST | `/api/extract` | Upload document for OCR. Body: `file`, `document_type`, `mode`, `profile_phone` |
| GET | `/api/extract/:requestId` | Poll OCR job status. Auto-saves to MongoDB when complete |

#### Schemes, Insurance & Subsidies
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/schemes` | List government schemes. Query: `type`, `search` |
| GET | `/api/insurance-subsidies` | List insurance/subsidy programs. Query: `type`, `limit` |

#### Applications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/applications` | List applications. Query: `type`, `status`, `farmerId`, `mobile`, `search` |
| POST | `/api/applications` | Submit new application |
| PATCH | `/api/applications/:id` | Update application status / add admin reply |
| DELETE | `/api/applications/:id` | Delete application |

#### Grievances
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/grievances` | List grievances. Query: `mobile`, `farmerId`, `status`, `search` |
| GET | `/api/grievances/:id` | Get single grievance |
| POST | `/api/grievances` | Create new grievance |
| PATCH | `/api/grievances/:id` | Update grievance (admin reply, status, priority, etc.) |
| DELETE | `/api/grievances/:id` | Delete grievance |

#### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications. Query: `mobile`, `farmerId`, `unreadOnly` |
| POST | `/api/notifications/send` | Create and push notification to farmer |
| PATCH | `/api/notifications/:id/read` | Mark single notification as read |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read for a mobile |

#### AI Engines
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/recommendations` | Rule-based scheme/insurance/subsidy recommendations for a farmer |
| POST | `/api/ai/grievance-advice` | Rule-based grievance classification and resolution guidance |
| POST | `/api/ai/farmer-summary` | Template-based farmer profile summary with risk indicators |
| POST | `/api/ai/application-analysis` | Rule-based application completeness and eligibility analysis |

#### Dashboard & Utilities
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Aggregate KPIs, charts data, recent activity, pending actions |
| POST | `/api/transliterate` | Transliterate text between scripts |
| GET | `/api/health` | Health check |

---

## 5. AgriAdmin Portal — Admin Web Application

The AgriAdmin Portal is a React + Vite single-page application used by Maharashtra government agriculture department officers. It is accessed via a web browser.

### Login & Authentication

The admin portal uses a **client-side authentication system** stored in `localStorage`. There is no server-side admin auth endpoint — sessions and users are managed entirely in the browser.

**Seed accounts:**

| Email | Password | Role |
|---|---|---|
| admin@agri.mh.gov.in | Admin@123 | Administrator (full access) |
| officer@agri.mh.gov.in | Officer@123 | District Officer |
| taluka@agri.mh.gov.in | Taluka@123 | Taluka Officer |

The login page shows the Krushi Suvidha logo, platform information panel on the left, and a sign-in form on the right. After successful login, the user is taken to the Dashboard.

---

### Sidebar Navigation

The sidebar is a collapsible dark green panel (`#0D2B1E`) on the left. It collapses to icon-only mode on smaller screens. Navigation items are filtered by user permissions — an officer only sees the sections they have access to.

**Navigation structure:**

```
Dashboard
New Registration
Farmer Registry
Verified Farmers
Applications (hover flyout)
  ├── Scheme Applications
  ├── Subsidy Applications
  └── Insurance Claim Applications
Database (hover flyout)
  ├── All Schemes
  ├── All Insurance
  └── All Subsidies
Grievance Management
Notification Management
Reports & Analytics
Settings & Workflow
Farmer App Preview
─────────────────
User Management  (admin only)
```

Groups ("Applications", "Database") show a hover-triggered flyout panel with their child items. The sidebar bottom shows the logged-in user's name, designation, and a mini-menu for Settings and Sign Out.

---

### Screen-by-Screen Breakdown

#### 5.1 Dashboard

The dashboard is the home screen after login. It fetches live data from `GET /api/dashboard/stats`.

**KPI Cards (8 metrics):**
- Total Registered Farmers
- Total Applications
- Pending Applications
- Approved Applications
- Rejected Applications
- Active Insurance Claims
- Open Grievances
- Resolved Grievances + Approval Rate

**Charts:**
- **Bar Chart** — Monthly application volume (last 6 months), broken down by Approved / Pending / Rejected
- **Pie Chart** — Scheme distribution (top schemes by application count)
- **Farmer Status Breakdown** — Active, Pending, Verified, Rejected counts

**Tables & Lists:**
- **Recent Registrations** — Last 5 farmers registered, with status badge, district, and source
- **Pending Actions** — Up to 6 items requiring attention (pending applications + open/escalated grievances), each with farmer name, type, status, and priority
- **Activity Feed** — Chronological feed of recent system events (applications submitted/approved/rejected, grievances raised, new registrations)

All data is pulled from the API in a single request and rendered with Recharts. The dashboard auto-refreshes when the user navigates to it.

---

#### 5.2 New Registration (OCR Wizard)

The most feature-rich screen in the admin portal. Officers use this to register new farmers by uploading their official documents and extracting data automatically via OCR.

**Document Upload Cards (5 documents):**

| Document | Purpose |
|---|---|
| Form 7 (सात बारा) | Land ownership record |
| Form 12 | Land cultivation record |
| Form 8A (आठ अ) | Land assessment record |
| Aadhaar Card | Identity verification |
| Bank Passbook | Bank account details |

**Workflow per document:**
1. Officer clicks "Upload" on a document card
2. File is selected (image or PDF, max 50MB)
3. File is `POST`-ed to `/api/extract` with `document_type` and optionally `profile_phone`
4. A `request_id` is returned immediately
5. The UI polls `GET /api/extract/:requestId` every 2 seconds
6. When status = `complete`, the extracted fields are displayed in an expandable card
7. The extracted image thumbnail is shown alongside the fields

**OCR Extraction Modes:** `fast`, `balanced`, `accurate` (default: accurate)

**Profile Assembly:**
- As each document completes, its fields are merged into a unified farmer profile
- Sections shown: Identity (Aadhaar), Land Records (Form 7/12/8A), Bank Details (Passbook)
- Fields are displayed in the selected language (Marathi / Hindi / English)
- Officers can zoom in on any document image to verify the original

**Language Switching:**
The entire form can be viewed in Marathi (मराठी), Hindi (हिंदी), or English. All field labels, section titles, and document names switch instantly. Translation maps cover 80+ field types.

**Auto-Save to MongoDB:**
When a phone number is provided in the profile, extraction results are automatically saved to the farmer's MongoDB document as they complete. If the farmer doesn't exist yet, a new record is created with the extracted data.

**Registration Completion:**
After all 5 documents are processed, the officer can review the assembled profile, edit any field, and submit the registration. A unique `farmerId` (format `F<YYYYMMDD><NNN>`) is generated and the farmer is saved with status `Pending`.

**Document Image Storage:**
All uploaded document images are stored as base64 in the farmer's `documents[]` array in MongoDB, so they can be retrieved and reviewed later.

---

#### 5.3 Farmer Registry

A searchable, filterable table of all registered farmers (excluding Drafts).

**Features:**
- Search by name, mobile, or farmer ID
- Filter by status (All / Active / Pending / Verified / Rejected)
- Filter by district
- Pagination
- Click any farmer to open a detailed side panel

**Farmer Detail Panel:**
Opens as a slide-in from the right. Shows:
- Identity section (name, mobile, Aadhaar, DOB, gender, father's name)
- Land records (village, taluka, district, survey number, land area, crop)
- Bank details (bank name, branch, IFSC, account number)
- Documents checklist (which of the 5 docs have been uploaded)
- Application history
- Grievance history
- Action buttons: Approve, Reject, View Documents, Edit

**Farmer Sub-Pages (FarmerSubPages):**
When navigating deeper into a farmer's record from the registry, sub-pages appear:
- **Applications Sub-Page** — All applications for this farmer, with an AI Recommendations Panel in the right sidebar (green header). Clicking "Generate Recommendations" calls `POST /api/ai/recommendations` and returns personalised scheme/insurance/subsidy suggestions based on the farmer's profile, land, crop, and what they've already applied for.
- **Grievances Sub-Page** — All grievances for this farmer, with an AI Grievance Advisor Panel in the right sidebar (teal header). Clicking "Get AI Advice" calls `POST /api/ai/grievance-advice` and returns resolution guidance, urgency assessment, and handling tips.

---

#### 5.4 Verified Farmers

Similar to Farmer Registry but filtered to show only Active/Verified farmers. Provides a quick view of all cleared and production-ready farmers.

---

#### 5.5 Scheme Applications

A management view for all **scheme-type** applications submitted by farmers.

**Features:**
- Search by farmer name or application ID
- Filter by status (All / Pending / Under Review / Approved / Rejected)
- View application details: scheme name, farmer, district, village, crop, land area, applied date
- **Admin Actions** per application:
  - Change status (Pending → Under Review → Approved / Rejected)
  - Add admin reply (visible to farmer in mobile app)
  - Add internal admin notes (not visible to farmer)
- Pagination

When an application is approved or rejected, the farmer can see the status and admin reply in their mobile app.

---

#### 5.6 Subsidy Applications

Identical layout to Scheme Applications, but filtered to `type = subsidy`. Shows subsidy name, amount range, and processing details.

---

#### 5.7 Insurance Claim Applications

Identical layout, filtered to `type = insurance`. Shows insurance provider, crop type, loss description, and coverage details.

---

#### 5.8 All Schemes (Database)

A read-only reference view of all 18 government schemes seeded in the database.

**Fields shown per scheme:**
- Name and type (Central/State)
- Category (crop insurance, subsidy, loan, etc.)
- Eligibility criteria
- Benefits description
- Target crop(s) and maximum land holding

This allows officers to see what programs are available when assessing farmer eligibility.

---

#### 5.9 All Insurance / All Subsidies (Database)

Read-only reference views of all 20 insurance and subsidy programs. Officers can search and filter by type. Useful for reference when processing applications.

---

#### 5.10 Grievance Management

A full case management system for farmer complaints.

**List View:**
- All grievances from all farmers
- Search by farmer name or grievance ID
- Filter by status, priority, or category
- Summary metrics: Total / Open / In Progress / Resolved / Average Resolution Days

**Grievance Detail View:**
Clicking a grievance opens a full detail page:

- **Metadata:** Grievance ID, category, subject, description, filed date, farmer name
- **Attachments:** View any files the farmer attached (images, PDFs)
- **Priority Management:** Change priority (High / Medium / Low) with colored badges
- **Assignment:** Assign grievance to a specific officer
- **Status Workflow:** Move through: Open → In Progress → Escalated → Resolved / Rejected / Closed
- **Admin Reply:** Type a response that the farmer will see in their mobile app
- **Admin Notes:** Internal notes (not visible to farmer)
- **Rejection:** Special rejection flow with a mandatory rejection reason field
- **Resolution:** Mark as Resolved, records `resolvedAt` timestamp

All changes are saved via `PATCH /api/grievances/:id` and immediately visible to the farmer.

---

#### 5.11 Notification Management

A comprehensive notification centre for the admin portal. The admin's own in-app notifications are managed here (not the same as notifications sent to farmers).

**Admin Notifications** (stored in browser context):
- Types: `farmer`, `grievance`, `scheme`, `ticket`, `system`
- Filter by type or unread status
- Sort: Newest / Oldest / Unread First
- Search by notification text
- Mark individual or all as read
- Delete individual or clear all

The admin receives notifications when:
- A new farmer registers
- A farmer submits a grievance
- An application is submitted
- A system event occurs

Admins can also **send push notifications to farmers** from this module by composing a message and selecting target farmers. Notifications are sent via `POST /api/notifications/send` and delivered to farmer devices via Expo Push.

---

#### 5.12 Reports & Analytics

A visual analytics dashboard with charts for data-driven decision making.

**Charts:**
- **Registration Trend** (Line Chart) — New registrations vs. verified farmers over time
- **Scheme-wise Approval Rate** (Bar Chart) — Approval rates per scheme
- **Grievance by District** (Scatter Chart) — Geographic grievance distribution
- **AI Confidence Score** (Bar Chart) — OCR accuracy metrics

**Export Options:**
- PDF, Excel, CSV (triggered as toast for demo)

**AI Insights Panel:**
Three pre-computed AI insights are displayed:
- Seasonal volume forecasts (e.g., "34% rise expected in Kharif season")
- District anomaly alerts (e.g., high claim rate in specific districts)
- Untapped eligibility opportunities (e.g., farmers eligible for schemes who haven't applied)

**Filters:**
- Date range selection (from / to)
- District filter
- Scheme filter

---

#### 5.13 Settings & Workflow

Configuration screen for platform settings. Available only to users with `settings` permission.

Covers:
- Workflow management
- System configuration
- Integration settings

---

#### 5.14 Farmer App Preview

An embedded iframe within the admin portal that shows the Krushi Suvidha farmer mobile app (running on port 8099 / proxied through the Vite server at `/kisan-seva`). Officers can see exactly what farmers see without switching applications.

---

#### 5.15 User Management (Admin Only)

Full CRUD management of admin portal users. Only visible to the `admin` role.

**User List:**
- All admin users with name, email, role, designation, district, last login
- Status indicator (active / deactivated)

**Add User:**
- Name, email, password, role, designation, district, phone
- Permissions are auto-assigned based on role

**Edit User:**
- Change any field including password
- Modify individual section permissions (granular access control)
- Activate / deactivate account

**Delete User:**
- Permanent removal (except self-deletion)

Users are stored in `localStorage` and include the three seed accounts plus any created at runtime.

---

#### 5.16 AI Assistant (Global)

A floating AI assistant button in the header. When clicked, opens a full-screen panel powered by the local AI engines. It can answer questions about farmers, applications, and system data.

---

## 6. Krushi Suvidha — Farmer Mobile Application

The farmer app is built with Expo (React Native) and runs on iOS, Android, and Web. It is the primary interface for farmers to interact with the agricultural department.

**Brand:** कृषी सुविधा (Krushi Suvidha)
**Colour Palette:**
- Primary Dark: `#14532D` (headers, hero sections)
- Primary Green: `#16A34A` (buttons, active states)
- Gold: `#D97706` (brand text, accents)
- Background: `#F8FAFC`

---

### Navigation Flow (State Machine)

The app uses a state-machine navigation model. The screen shown depends entirely on the farmer's authentication and registration status:

```
No Token
  ├── WelcomeScreen
  ├── LoginScreen
  └── OtpScreen
        ↓ (token obtained)
Token + No Farmer record → DocumentUploadScreen
Token + Farmer (source=manual, Pending) → DocumentUploadScreen
Token + Farmer (Pending) → PendingScreen (auto-polls every 30s)
Token + Farmer (Rejected / Cancelled) + reuploadRequested → DocumentUploadScreen
Token + Farmer (Rejected / Cancelled) → RejectedScreen
Token + Farmer (Active or Verified) + justApproved → VerifiedScreen (congrats animation)
Token + Farmer (Active or Verified) → Main Tab Navigator
```

---

### Screen-by-Screen Breakdown

#### 6.1 Welcome Screen

The first screen a new user sees. Dark forest green hero section with:
- Wheat emoji logo 🌾
- Gold "कृषी सुविधा" brand title
- "AIRAVATA INTELLIGENCE" subtitle
- Language selection pills: English / हिंदी / मराठी (saved to AsyncStorage)
- Green "Get Started" CTA button

Language selection here determines the language used throughout the entire app session.

---

#### 6.2 Login Screen

- Dark green top bar with gold brand name
- White card with mobile number input (10 digits)
- "Send OTP" green button → calls `POST /api/auth/send-otp`
- Error handling for invalid number format
- Loading state during API call

---

#### 6.3 OTP Screen

- Dark green top bar
- OTP entry with 6 dot indicators
- "Verify OTP" button → calls `POST /api/auth/verify-otp`
- **Dev Mode Feature:** If the API returns the OTP in the response (dev mode), a yellow banner appears at the bottom. Tapping it auto-fills the OTP field.
- Resend OTP option with countdown timer
- After successful verification, JWT token is stored in AsyncStorage and navigation redirects based on farmer status

---

#### 6.4 Document Upload Screen

The self-registration flow for farmers to submit their KYC documents.

**Progress Indicator:**
- Segmented progress bar showing how many of the 5 documents are done
- Each segment fills and turns green when the corresponding document is complete

**5 Document Cards:**

| Card | Document | OCR Section |
|---|---|---|
| 1 | Aadhaar Card | `aadhar` |
| 2 | Bank Passbook | `passbook` |
| 3 | Form 7 (सात बारा) | `form7` |
| 4 | Form 12 | `form12` |
| 5 | Form 8A (आठ अ) | `form8a` |

**Per card workflow:**
1. Farmer taps the upload button (colored per document type)
2. File picker opens — `expo-document-picker` on web, `expo-image-picker` on native
3. File is uploaded via `POST /api/extract` with `profile_phone` attached
4. A `request_id` is returned; the card shows a loading spinner
5. The app polls `GET /api/extract/:requestId` every 4 seconds
6. When `status === 'complete'`, the card turns green with a checkmark ✓
7. The extracted data is automatically saved to the farmer's MongoDB profile

**Submit Button:**
Enabled only when all 5 documents are marked complete. Tapping it:
1. Calls `POST /api/farmers/submit-registration` with the farmer's mobile
2. Fetches the updated farmer record
3. Navigates to PendingScreen

---

#### 6.5 Pending Screen

Shown after document submission while the admin reviews the farmer's registration.

**Content:**
- Dark green ID card showing Farmer ID and mobile number
- **Timeline Stepper** with 4 steps:
  1. Documents Submitted ✅
  2. Under Review (gold spinner when active)
  3. Verification in Progress
  4. Account Activated
- Uploaded Documents List — shows which docs were submitted with timestamps
- **Auto-Poll:** The app polls `GET /api/farmers/by-phone/:phone` every 30 seconds. If status changes to Active/Verified, it automatically navigates to the Verified Screen (with congratulations animation).
- Manual "Refresh Status" button

---

#### 6.6 Rejected / Cancelled Screen

Shown when admin rejects a farmer's application.

**Content:**
- Dark green ID card
- Clear rejection message
- Numbered step-by-step instructions to re-apply:
  1. Contact the nearest agricultural office
  2. Bring original documents
  3. Request re-registration
- Help Center card with helpline number
- "Re-upload Documents" button (if the admin has enabled re-upload)

---

#### 6.7 Verified Screen

A congratulations screen shown once when a farmer's status transitions from Pending to Active/Verified.

**Content:**
- Animated green checkmark (celebration animation)
- Farmer ID card with name and ID
- List of unlocked benefits/features
- Auto-redirects to the main dashboard after a few seconds

---

### Main Tab Navigator (Active Farmers Only)

Active/Verified farmers access a 5-tab bottom navigation:

| Tab | Icon | Label (varies by language) |
|---|---|---|
| Home | 🏠 | Home / होम |
| Schemes | 📋 | Applications / अर्ज |
| Notifications | 🔔 | Alerts / सूचना |
| Analytics | 📊 | Analytics / विश्लेषण |
| Profile | 👤 | Profile / प्रोफाइल |

---

#### 6.8 Home Screen (Tab 1)

The farmer's personal dashboard.

**Hero Card:**
- Dark green card with the farmer's avatar (initials circle)
- Farmer name, village, district
- Verification badge (green KYC checkmark)
- Farm stats mini-grid: Land area, Crop type, Farmer ID, Status

**Quick Action Grid (4 buttons):**
- 📋 Apply for Scheme → navigates to Schemes tab
- 🛡️ File Insurance → navigates to Schemes tab (Insurance sub-tab)
- 📢 Raise Grievance → navigates to Grievance screen
- 💰 Check Subsidy → navigates to Schemes tab (Subsidies sub-tab)

**Recent Notifications:**
- Shows the 3 most recent notifications from the API
- Tapping opens the full Notifications tab

**Weather Advisory:**
- Static advisory card for agricultural weather guidance

The screen auto-refreshes farmer data on focus (when switching back to this tab).

---

#### 6.9 Schemes Screen (Tab 2)

A comprehensive browser for all government programs a farmer can apply to.

**Three Sub-tabs:**
1. **Schemes** — Government agricultural schemes (18 total)
2. **Insurance** — Crop insurance programs
3. **Subsidies** — Subsidy programs

**Features per sub-tab:**
- Search by name or description
- Filter chips: All / Central / State (for Schemes); filter by category (for Insurance/Subsidies)
- **Eligibility Badges** — "✅ Eligible" shown when the farmer's crop/land matches the scheme criteria (local matching logic)
- "Applied" badge shown for schemes the farmer has already applied to

**Scheme / Insurance / Subsidy Cards:**
Each card shows:
- Name and provider/type badge
- Short description
- Eligibility summary
- Benefits summary
- "Apply Now" button (green) or "Applied ✓" if already applied

**Application Flow (from Schemes screen):**
1. Farmer taps "Apply Now"
2. Navigates to SchemeDetailScreen with full details
3. Farmer fills crop type, land area (pre-populated from profile)
4. For insurance: adds loss description
5. Submits → `POST /api/applications`
6. Card immediately shows "Applied ✓" badge

**My Applications Section:**
Below the scheme list, a section shows all the farmer's existing applications with status badges (Pending / Approved / Rejected) and the admin's reply when available. Rejected applications can be re-applied.

---

#### 6.10 Notifications Screen (Tab 3)

A list of all notifications sent by the admin to this farmer.

**Features:**
- Unread count banner at the top
- Colored notification cards with type-specific icons:
  - 📋 Scheme updates (teal)
  - 🛡️ Insurance updates (blue)
  - 📢 Grievance updates (orange)
  - 👤 Profile/registration updates (green)
  - 🔔 General alerts (grey)
- Tap to mark as read
- "Mark All Read" button
- Pull-to-refresh

Each notification card shows:
- Icon and title
- Message body
- Timestamp (relative: "2h ago", "3d ago")
- Unread indicator dot

---

#### 6.11 Analytics Screen (Tab 4)

A personal analytics dashboard for the farmer.

**Sections:**
- **Farm Overview Stats** — Land area, crop type, registration date, doc count
- **Scheme Statistics** — Total applied, approved, pending, rejected counts
- **Category Bar Chart** — Visual breakdown of applications by type (Scheme / Insurance / Subsidy)
- **Registration Timeline** — Timeline view of the farmer's registration journey
- **Document Progress** — Which of the 5 required documents have been uploaded and processed

---

#### 6.12 Profile Screen (Tab 5)

Displays the farmer's complete verified profile.

**Hero Section:**
- Dark green header with farmer avatar
- Gold Farmer ID badge (e.g., `F20260512001`)
- Green "KYC Verified" badge

**Profile Sections (color-coded cards):**
- 👤 Personal Details — Name, DOB, gender, mobile, Aadhaar number
- 🏡 Land Details — Village, taluka, district, survey number, land area, crop
- 🏦 Bank Details — Bank name, branch, IFSC code, account number

**Action Buttons:**
- 📢 "Raise Grievance" (gold button) → navigates to GrievanceScreen
- ⚙️ Settings → navigates to SettingsScreen

---

#### 6.13 Grievance Screen (Stack)

Accessible from the Profile screen's gold "Raise Grievance" button or the Home quick-action grid.

**Filing a New Grievance:**
- Category chips (tap to select): Subsidy Delay, Wrong Beneficiary, Document Issue, Officer Misconduct, Technical Error, Portal/App Issue, Other
- Subject field (auto-fills based on selected category)
- Description text area
- Optional attachment (document picker — image or PDF)
- Submit button → `POST /api/grievances`
- Success confirmation message

**My Previous Grievances List:**
Below the form, all of the farmer's previously filed grievances are listed. Per row:
- Category, subject, status badge (color-coded), date
- **👁 View** button → opens GrievanceDetailScreen
- **✏️ Edit** button (only for Open grievances) → opens GrievanceDetailScreen in edit mode
- **🗑 Delete** button (for Open or Rejected grievances) → confirmation dialog → `DELETE /api/grievances/:id`

---

#### 6.14 Grievance Detail Screen (Stack)

A full view of a single grievance.

**Read Mode:**
- Grievance ID, category, subject
- Full description
- Status badge and priority
- Filed date / resolved date
- Admin reply (shown in a highlighted box when present)
- Rejection reason (shown when status is Rejected)

**Edit Mode** (Open grievances only):
- Category, subject, and description become editable
- "Save Changes" → `PATCH /api/grievances/:id`

---

#### 6.15 Scheme Detail Screen (Stack)

A full-page detail view of a scheme, insurance, or subsidy program.

**Content:**
- Full name and provider badge
- Category and type
- Full description
- Eligibility criteria (formatted with bullet points)
- Benefits details
- Application form inline at the bottom

---

#### 6.16 Settings Screen (Stack)

Accessible from the Profile tab.

**Options:**
- Language switcher (English / हिंदी / मराठी) — persisted to AsyncStorage
- App information (version, developer)
- Logout button — clears token and farmer data, redirects to Welcome screen

---

## 7. Connectivity Between Admin and Mobile

Both the admin portal and the farmer app operate on the **same database through the same API**. Every action taken on one side is immediately reflected on the other.

### Real-Time Data Flows

#### Farmer Registration (Admin-initiated)
```
Admin uploads docs → POST /api/extract → Datalab OCR → 
Extracted fields saved to farmer doc → 
Admin submits → farmer record created → 
Farmer logs in via OTP → sees Pending screen → 
Admin approves → PATCH /api/farmers/:id (status=Active) → 
Farmer app polls /api/farmers/by-phone/:phone every 30s → 
Status change detected → VerifiedScreen shown → 
Farmer enters main dashboard
```

#### Farmer Self-Registration (Mobile-initiated)
```
Farmer logs in via OTP → DocumentUploadScreen → 
Uploads each doc → POST /api/extract with profile_phone → 
Data auto-saved to MongoDB → 
Farmer submits → status set to Pending → 
Admin sees new farmer in registry with "Pending" status → 
Admin reviews and approves/rejects → 
Farmer's app detects status change (30s poll) → 
Navigates to Verified or Rejected screen
```

#### Application Submission (Farmer → Admin)
```
Farmer taps "Apply Now" in Schemes tab → 
POST /api/applications → 
Appears immediately in Admin's Scheme/Subsidy/Insurance Applications list → 
Admin reviews and updates status (PATCH /api/applications/:id) → 
Admin adds reply message → 
Farmer's Schemes tab "My Applications" section shows updated status and admin reply
```

#### Grievance Filing (Farmer → Admin)
```
Farmer taps "Raise Grievance" → fills form → 
POST /api/grievances → 
Admin sees new grievance in Grievance Management list → 
Admin updates status, adds reply (PATCH /api/grievances/:id) → 
Farmer sees updated status + admin reply in Grievance Detail screen
```

#### Notification Push (Admin → Farmer)
```
Admin composes notification in Notification Management → 
POST /api/notifications/send → 
API stores notification in farmer's notifications[] array → 
Optionally sends Expo push notification to device → 
Farmer sees notification in Notifications tab
```

#### Admin AI Recommendations (based on farmer data)
```
Admin opens farmer's Applications sub-page → 
Clicks "Generate Recommendations" → 
POST /api/ai/recommendations (sends farmer profile + applied IDs) → 
Server fetches all schemes + insurance_subsidies from DB → 
Rule-based engine scores eligibility → 
Returns ranked recommendations → 
Admin sees suggestions in green sidebar panel
```

### Shared Identity — The Mobile Number

The farmer's **mobile number** is the primary key linking all systems:
- Used to look up the farmer record: `GET /api/farmers/by-phone/:phone`
- Used in OTP sessions: stored in `otp_sessions` collection
- Used to fetch notifications: `GET /api/notifications?mobile=...`
- Used to fetch grievances: `GET /api/grievances?mobile=...`
- Used to fetch applications: `GET /api/applications?mobile=...`
- Used to register push tokens: stored in `push_tokens` collection

### The Farmer Document — Single Source of Truth
Every farmer has one MongoDB document. Both apps read and write to it:
- Admin writes: status updates, document reviews, approvals/rejections
- Farmer app writes: document uploads (via OCR), application submissions, grievances
- Both read: profile data, notification history, document images

---

## 8. OCR Document Extraction Flow

Document extraction is the core technical feature of the platform, enabling automatic data capture from scanned government documents.

### How It Works

```
1. File uploaded (image or PDF, max 50MB)
       ↓
2. POST /api/extract
   - Stored in memory (multer memoryStorage)
   - Job metadata stored: { documentTypeId, profilePhone, rawFileBase64, ... }
   - Returns { request_id } immediately
       ↓
3. Background: API sends file to Datalab API
   - POST https://www.datalab.to/api/v1/extract
   - Includes document schema (field definitions per document type)
   - Datalab processes asynchronously
       ↓
4. Client polls GET /api/extract/:requestId every 2-4 seconds
       ↓
5. When Datalab returns 'complete':
   - Raw extraction is mapped to structured fields (profiles.ts)
   - Fields are normalised (names, dates, numbers)
   - If profile_phone provided → auto-save to MongoDB farmer doc
   - Poll response includes: { status, document_type, extraction data }
       ↓
6. UI displays extracted fields by section
   - Admin: expandable field cards with labels in selected language
   - Farmer: upload card turns green, data saved silently
```

### Document Type Schemas

| Document | Extracted Fields |
|---|---|
| Aadhaar | Full name, Aadhaar number, DOB, gender, father's name, address, mobile, pincode, state, enrolment number, VID |
| Bank Passbook | Account holder name, bank name, branch, IFSC, MICR, account number, account type, opening date, nominee, customer ID |
| Form 7 | Owner names, survey number, land holding, cultivable area, occupant class, mode of acquisition, land revenue |
| Form 12 | Village, taluka, district, year, crop, land area, cultivation season, irrigation source |
| Form 8A | Year, account number, account type, total area, land assessment, recovery amount, ZP/GP cess, village Form 6 entries |

### Extraction Modes
- `fast` — Quick, lower accuracy
- `balanced` — Balanced speed and accuracy
- `accurate` — Highest accuracy, slowest (default)

### Profile Mapping
After extraction, the raw JSON is passed through `mapExtractionToSection()` which:
- Maps Datalab field keys to standardised internal keys
- Extracts Aadhaar portrait photo (if present)
- Parses table data from Form 7 (land holding tables)
- Normalises dates and numeric values

---

## 9. Authentication Systems

### Admin Authentication (AgriAdmin Portal)

The admin portal uses a **fully client-side authentication system**. No API server involvement.

- Users stored in `localStorage` under key `agri_users_v1`
- Session ID stored under `agri_session_v1`
- Passwords hashed with a simple non-cryptographic hash (demo/prototype grade)
- 3 seed users pre-loaded (admin, district officer, taluka officer)
- Role-based permissions control which sections each user can see
- Sessions persist across browser refreshes until logout

**Roles:**
| Role | Access |
|---|---|
| `admin` | All 16 sections + User Management |
| `district_officer` | Dashboard, Registration, Farmers, Applications, Grievances, Notifications, Reports |
| `taluka_officer` | Dashboard, Registration, Farmers, Grievances, Notifications |
| `viewer` | Dashboard, Reports, Database views only |

### Farmer Authentication (Mobile App)

The farmer app uses **OTP-based authentication** with server-side JWT tokens.

**Flow:**
1. Farmer enters 10-digit mobile number
2. `POST /api/auth/send-otp` → 6-digit OTP generated, stored in `otp_sessions` collection (TTL: 5 min)
3. In dev mode, OTP returned in API response (shown as yellow banner in app)
4. Farmer enters OTP → `POST /api/auth/verify-otp`
5. Server validates OTP, deletes session, looks up farmer by mobile
6. Returns JWT token (expires in 7 days) + farmer record
7. Token stored in AsyncStorage; sent as `Authorization: Bearer <token>` on future requests

**JWT Payload:**
```json
{
  "mobile": "9876543210",
  "farmerId": "F20260512001",
  "role": "farmer",
  "iat": 1234567890,
  "exp": 1235172690
}
```

---

## 10. Notifications System

Notifications connect admin actions to farmer awareness.

### How Notifications Reach Farmers

1. Admin triggers a notification: `POST /api/notifications/send`
   - Body: `{ farmerId, mobile, title, message, type }`
2. API stores notification in the farmer's `notifications[]` array in MongoDB
3. API optionally sends an Expo Push Notification to any registered device tokens (`push_tokens` collection)
4. Farmer app fetches `GET /api/notifications?mobile=...` on screen load and on focus
5. Notifications appear in the Notifications tab with color-coded type badges

### Admin-Side Notifications

The admin portal also has its own in-browser notification centre (separate from farmer push notifications). These are:
- Generated locally by browser events (new farmer detected, grievance filed, etc.)
- Stored in React context (not in MongoDB)
- Managed in the Notification Management screen

### Notification Types

| Type | Color | When Used |
|---|---|---|
| `farmer` | Emerald | Registration status updates |
| `scheme` | Teal | Application approvals/rejections |
| `grievance` | Orange/Lime | Grievance status updates, admin replies |
| `ticket` | Green | Support ticket updates |
| `system` | Grey | General system messages |

---

## 11. Grievances System

A bidirectional complaint management system.

### Filing Channels
- **Farmer App** — Farmer selects category, writes description, optionally attaches a file
- **Admin Portal** — Admin can also file a grievance on behalf of a farmer (source: `admin`)

### Categories
Subsidy Delay / Wrong Beneficiary / Document Issue / Officer Misconduct / Technical Error / Portal/App Issue / Other

### Lifecycle
```
Open → In Progress → Resolved (auto-timestamps resolvedAt)
Open → Escalated → Resolved
Open → Rejected (requires rejection reason)
Any → Closed
```

### Priority Levels
- **High** 🔴 — Urgent, displayed first in admin list
- **Medium** 🟡 — Standard processing
- **Low** 🟢 — Non-urgent

### Admin Resolution Workflow
1. Admin opens grievance in Grievance Management
2. Assigns to an officer (free text field)
3. Updates priority
4. Changes status (In Progress, Escalated, etc.)
5. Adds reply for farmer (visible in app)
6. Adds internal notes (not visible to farmer)
7. Marks as Resolved (records resolution timestamp)
8. Or Rejects with mandatory rejection reason

### Farmer Grievance Actions
- View all their grievances with status
- Edit Open grievances (category, subject, description)
- Delete Open or Rejected grievances
- See admin reply and rejection reason in detail view

---

## 12. Applications System

A unified application management system for three program types.

### Application Types
| Type | Programs |
|---|---|
| `scheme` | Government agricultural schemes (PM-Kisan, PM-KISAN etc.) |
| `subsidy` | Input subsidies, equipment subsidies |
| `insurance` | Crop insurance, livestock insurance |

### Application Status Flow
```
Pending → Under Review → Approved
                      ↘ Rejected
                      → Settled (for insurance claims)
```

### Farmer Submission
1. Browse schemes/insurance/subsidies in Schemes tab
2. Tap "Apply Now"
3. Confirm crop type, land area (pre-filled from profile)
4. For insurance: add loss description
5. Submit → `POST /api/applications`
6. See immediate "Applied ✓" badge on the scheme card
7. Track in "My Applications" section

### Admin Processing
1. New application appears in relevant Applications list (Scheme/Subsidy/Insurance)
2. Admin reviews farmer's profile alongside the application
3. Admin can request AI recommendations for the farmer (`POST /api/ai/recommendations`)
4. Status updated via `PATCH /api/applications/:id`
5. Admin reply added (farmer sees this in app)
6. Optional internal notes added

### Re-Application
Rejected applications can be re-applied by the farmer. The app calls `PATCH /api/applications/:id` with `status: Pending` to reset the application for re-review.

---

## 13. AI-Powered Features

All AI features use local rule-based engines — no external AI API key is required. The engines analyse structured data in the database.

### AI Scheme Recommendations (`POST /api/ai/recommendations`)
**Used by:** Admin portal (farmer sub-page sidebar)

**Input:** Farmer profile (crop, land, district, category) + list of already-applied scheme IDs

**Process:**
1. Fetches all schemes and insurance_subsidies from MongoDB
2. Scores each program against farmer profile:
   - Crop match (does farmer grow the eligible crop?)
   - Land area eligibility (is farmer's land within scheme limits?)
   - District/category match
   - Not already applied
3. Ranks by eligibility score

**Output:**
```json
{
  "summary": "Based on Ramesh's 2.5 acre wheat farm in Pune...",
  "recommendations": [
    {
      "name": "PM Fasal Bima Yojana",
      "type": "insurance",
      "reason": "Farmer grows wheat, eligible for crop insurance",
      "priority": "high"
    }
  ],
  "tips": ["Ensure all documents are up to date before applying"]
}
```

### AI Grievance Advisor (`POST /api/ai/grievance-advice`)
**Used by:** Admin portal (farmer grievance sub-page sidebar)

**Input:** Farmer profile + all grievances for that farmer

**Process:**
1. Classifies grievances by keyword matching (category analysis)
2. Assesses urgency based on priority flags and status
3. Generates resolution guidance per grievance type
4. Identifies patterns (multiple grievances of same type)

**Output:**
```json
{
  "overview": "Farmer has 2 subsidy-related grievances...",
  "urgentAction": "Escalate subsidy delay to district treasury...",
  "advice": [
    {
      "grievanceId": "G001",
      "category": "Subsidy Delay",
      "guidance": "Check DBT portal for payment status. Typical resolution: 7-10 days."
    }
  ]
}
```

### AI Farmer Summary (`POST /api/ai/farmer-summary`)
Template-based profile summary with risk indicators and eligibility highlights.

### AI Application Analysis (`POST /api/ai/application-analysis`)
Rule-based completeness check — verifies all required documents are present, assesses eligibility confidence score, and lists missing requirements.

---

## 14. Multi-Language Support

### Admin Portal Languages
The admin portal supports **Marathi, Hindi, and English** on the New Registration screen. The language switcher (3 pills) applies to:
- All form field labels
- Section titles
- Document card names
- Error and confirmation messages

Translation maps (`FIELD_LABEL_MAP`, `SECTION_TITLE_MAP`, etc.) cover 80+ field types across 3 languages.

### Farmer App Languages
Language is selected on the Welcome screen and persisted in AsyncStorage. It applies globally across all screens:

| UI Element | Example (Marathi) | Example (Hindi) | Example (English) |
|---|---|---|---|
| Home tab | होम | होम | Home |
| Schemes tab | अर्ज | आवेदन | Applications |
| Notifications tab | सूचना | सूचनाएं | Alerts |
| Profile tab | प्रोफाइल | प्रोफ़ाइल | Profile |

Translation is implemented via a `T` constant with keys for each language, accessed as `T[lang][key]`.

---

## 15. Role & Permission System

The admin portal has a fine-grained permission system controlling which sections each user can access.

### 16 Permission Keys
`dashboard`, `newregistration`, `farmers`, `verifiedfarmers`, `applications`, `allschemes`, `allinsurance`, `allsubsidies`, `subsidies`, `insurance`, `grievances`, `notifications`, `reports`, `settings`, `farmerapp`, `usermanagement`

### Role Presets

| Section | Admin | District Officer | Taluka Officer | Viewer |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| New Registration | ✅ | ✅ | ✅ | ❌ |
| Farmer Registry | ✅ | ✅ | ✅ | ❌ |
| Verified Farmers | ✅ | ✅ | ✅ | ❌ |
| Applications | ✅ | ✅ | ❌ | ❌ |
| All Schemes | ✅ | ✅ | ❌ | ✅ |
| All Insurance | ✅ | ✅ | ❌ | ✅ |
| All Subsidies | ✅ | ✅ | ❌ | ✅ |
| Subsidy Applications | ✅ | ✅ | ❌ | ❌ |
| Insurance Claims | ✅ | ✅ | ❌ | ❌ |
| Grievances | ✅ | ✅ | ✅ | ❌ |
| Notifications | ✅ | ✅ | ✅ | ❌ |
| Reports & Analytics | ✅ | ✅ | ❌ | ✅ |
| Settings | ✅ | ❌ | ❌ | ❌ |
| Farmer App Preview | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |

Permissions can be customised per-user by an admin via the User Management screen. The sidebar automatically hides nav items the current user doesn't have access to. Attempting to access a restricted section via navigation shows an "Access Restricted" placeholder.

---

*This document covers the complete Krushi Suvidha platform as of May 2026 — version 2.0.*
