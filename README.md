# FarmWard — Digital Farm Management Portal

> **Project:** Development of a Digital Farm Management Portal for Implementing Biosecurity Measures in Pig and Poultry Farms.
>
> **Notice:** FarmWard supports routine internal biosecurity self-assessment record-keeping. It does not provide official veterinary compliance certifications or publish live outbreak notices.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Repository Structure](#repository-structure)
4. [Prerequisites](#prerequisites)
5. [Local Installation and Setup](#local-installation-and-setup)
6. [Environment Variables](#environment-variables)
7. [Authentication and Role-Based Access](#authentication-and-role-based-access)
8. [Biosecurity Assessment and Risk Classification](#biosecurity-assessment-and-risk-classification)
9. [Farm Reporting and Assessment History](#farm-reporting-and-assessment-history)
10. [Database Architecture, Backup, and Persistence](#database-architecture-backup-and-persistence)
11. [Testing and Verification](#testing-and-verification)
12. [Production Build and Deployment](#production-build-and-deployment)
13. [Current Limitations and Future Roadmap](#current-limitations-and-future-roadmap)

---

## 1. Overview

FarmWard is a full-stack digital farm management platform engineered to assist agricultural operators and veterinary professionals in implementing and auditing routine biosecurity measures. The portal enables:

- Farm-level authorization and strict data isolation across pig and poultry facilities.
- Structured, species-specific biosecurity self-assessment checklists.
- Centralized risk classification with practical, actionable corrective recommendations.
- Longitudinal farm reporting with completion trends and unresolved follow-up tracking.
- Immutable, idempotent assessment persistence with historical snapshot reproduction.
- Full keyboard accessibility and responsive interface conforming to modern web standards.

---

## 2. Technology Stack

- **Framework:** [Next.js 16.4.6](https://nextjs.org/) (App Router, Turbopack, React Server Components)
- **UI Library:** [React 19.2.0](https://react.dev/)
- **Language:** TypeScript 5.9 (Strict mode enabled)
- **Database:** SQLite via Node.js native `node:sqlite` (`DatabaseSync` with Write-Ahead Logging `WAL` mode)
- **Authentication:** Custom cryptographic HMAC-SHA256 signed HTTP-only session cookies with scrypt password hashing
- **Styling:** CSS Modules with responsive design and high-contrast accessibility tokens
- **Testing:** Node.js native test runner via `tsx` (42 comprehensive automated tests)
- **Code Quality:** ESLint 10 with Next.js Web Vitals and TypeScript configs

---

## 3. Repository Structure

```text
├── app/
│   ├── (portal)/                   # Authenticated portal route group
│   │   ├── about/                  # Application about and scope disclosure
│   │   ├── checklist/              # Assessment form with species guidance & real-time risk
│   │   ├── dashboard/              # Farm overview, trend reporting & recent records
│   │   ├── history/                # Multi-parameter assessment history filter & table
│   │   │   └── [id]/               # Read-only historical snapshot & corrective actions
│   │   ├── layout.tsx              # Portal shell with skip-to-content & navigation
│   │   └── portal-nav.tsx          # Responsive desktop & mobile navigation components
│   ├── api/
│   │   ├── assessments/route.ts    # POST: Authenticated, bounded & idempotent assessment save
│   │   └── auth/
│   │       ├── login/route.ts      # POST: Credential verification & session generation
│   │       └── logout/route.ts     # POST: Session cookie revocation & redirect
│   ├── globals.css                 # Global CSS variables, skip-link, and base styling
│   ├── layout.tsx                  # Root layout with metadata and HTML document configuration
│   └── login/                      # Login screen with accessibility & demo guidance
├── data/                           # SQLite database storage (WAL journal mode)
├── lib/
│   ├── checklist.ts                # Checklist items, species guidance & centralized risk logic
│   ├── database.ts                 # SQLite schema, indices, PRAGMAs & initial seed
│   ├── password.ts                 # Cryptographic scrypt hashing & timingSafeEqual verification
│   ├── reporting.ts                # Farm assessment summaries, trends, and filtering logic
│   ├── repository.ts               # Database access layer with farm isolation & distinct queries
│   ├── session.ts                  # HMAC-signed session cookies and authentication guards
│   └── types.ts                    # Core TypeScript data definitions
├── next.config.ts                  # Next.js configuration with HTTP security headers
├── tests/
│   ├── checklist.test.ts           # Completion & response validation regression tests
│   ├── password.test.ts            # Password hashing & verification security tests
│   ├── reporting.test.ts           # Farm summary, trend, and history filter tests
│   ├── repository.test.ts          # In-memory SQLite farm isolation & idempotency tests
│   ├── risk.test.ts                # Biosecurity risk evaluation & species guidance tests
│   └── validation.test.ts          # API date bounding and input validation tests
└── README.md                       # Comprehensive technical and operational documentation
```

---

## 4. Prerequisites

- **Node.js:** Version 20.0.0 or higher (Node.js 22+ recommended for native `node:sqlite` support)
- **npm:** Version 10 or higher

---

## 5. Local Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ram-biwal-25/capstone-proj.git
   cd capstone-proj
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   *(For local testing, the default values in `.env.example` are pre-configured to work immediately.)*

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the portal:**
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 6. Environment Variables

| Variable | Required in Prod | Description | Default |
| :--- | :---: | :--- | :--- |
| `AUTH_SECRET` | **Yes** | Cryptographic key used to sign session cookies. In production, provide a 64+ char random string. | `development-only-change-me` |
| `DATABASE_PATH` | No | Absolute or relative filesystem path to the SQLite database file. | `data/farm-portal.sqlite` |
| `NODE_ENV` | No | Node environment mode (`development`, `production`, `test`). | `development` |

---

## 7. Authentication and Role-Based Access

Authentication utilizes signed, HTTP-only, SameSite cookies with a 12-hour expiration window. Farm access is strictly enforced in the data layer: users can only query, list, or submit records for farms explicitly mapped in `farm_access`.

### Demo User Accounts

Both accounts are clearly labeled as demonstration credentials:

| Account Type | Email | Password | Assigned Permissions |
| :--- | :--- | :--- | :--- |
| **Sample Farmer** | `farmer@example.com` | `demo123` | Owner of *Green Valley Pig Farm*, Manager of *Sunrise Poultry Farm* |
| **Sample Veterinarian** | `vet@example.com` | `demo123` | Veterinarian for *Sunrise Poultry Farm* only |

---

## 8. Biosecurity Assessment and Risk Classification

### The Core Criteria

Assessments evaluate six biosecurity focus areas:
1. **Visitor Log:** Logged visits, entry justifications, and previous contact records.
2. **Equipment Cleaning:** Sanitation and disinfection of shared machinery and tools.
3. **Entry Controls:** Footwear disinfection, hand-washing, barrier signage, and clothing changes.
4. **Animal Health:** Clinical observation documentation, respiratory signs, mortality anomalies.
5. **Feed and Water:** Safe storage, protection from contamination, swill ban enforcement.
6. **Mortality Disposal:** Timely, sanitary removal and approved carcass disposal.

### Species-Specific Guidance

Contextual species hints assist evaluators without altering historical question identifiers:
- **Pig Farms:** African Swine Fever (ASF) safeguards, prohibition of swill feeding, dedicated herd footwear, and respiratory monitoring.
- **Poultry Farms:** Avian Influenza (AI) wild-bird contact prevention, shed-specific footbaths, daily dead-bird removal, and egg production tracking.

### Centralized Risk Classification Engine

Risk is computed centrally via `classifyRisk()` in `lib/checklist.ts`:

- **Low Risk:** 100% of applicable items marked "Done". Practice maintenance recommended.
- **Moderate Risk:** Exactly 1 item requires follow-up, or completion < 100%. Targeted review recommended.
- **High Risk:** 2 or more items require follow-up. Rapid corrective remediation recommended.
- **Critical Risk:** $\ge 50\%$ of applicable checklist items require follow-up. Immediate intervention and access restriction advised.
- **Not Assessed:** All items marked "Not applicable". Excluded from misleading percentage calculations.

---

## 9. Farm Reporting and Assessment History

- **Historical Snapshots:** Assessments store item labels, statuses, and notes in JSON snapshots at the moment of completion, guaranteeing that historical records remain intact and reproducible regardless of future checklist modifications.
- **Multi-Parameter History Filter:** History can be filtered dynamically by farm, animal species (pig/poultry), risk classification level, and sorted by date or completion percentage.
- **Dashboard Reporting:** The dashboard calculates longitudinal trends (*Improving*, *Stable*, *Needs review*) by comparing consecutive assessments, and highlights open follow-ups per farm.

---

## 10. Database Architecture, Backup, and Persistence

### Schema Overview

- `users`: ID, name, email, password hash (scrypt).
- `farms`: ID, name, species type (`pig` or `poultry`).
- `farm_access`: `user_id` and `farm_id` composite key, role designation.
- `assessments`: ID, `farm_id`, `user_id`, `assessed_on`, `responses_json`, `submission_key` (unique), `created_at`.

### Performance Indices

- `idx_assessments_farm_created`: Speeds up date-ordered history retrieval by farm.
- `idx_farm_access_user`: Optimizes authorization checks on every API submission.
- `idx_assessments_submission_key`: Guarantees instantaneous idempotency checks.

### Backup and Recovery

To perform a safe live backup of the SQLite database while in WAL mode:

```bash
# Using SQLite CLI online backup API
sqlite3 data/farm-portal.sqlite ".backup 'backup-$(date +%Y%m%d%H%M%S).sqlite'"
```

In containerized or cloud environments, mount `DATABASE_PATH` to a persistent block storage volume.

---

## 11. Testing and Verification

The test suite covers checklist rules, cryptographic passwords, validation logic, in-memory database queries, farm isolation, risk calculations, and reporting functions.

```bash
# Run complete test suite (42 unit and integration tests)
npm test

# Run ESLint validation
npm run lint

# Run full production TypeScript and bundling verification
npm run build
```

---

## 12. Production Build and Deployment

### Security Configuration

`next.config.ts` enforces HTTP response headers to safeguard against common web vulnerabilities:
- `X-Frame-Options: DENY` (Clickjacking mitigation)
- `X-Content-Type-Options: nosniff` (MIME-sniffing prevention)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Build and Launch

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 13. Current Limitations and Future Roadmap

- **Internal Self-Assessment Only:** FarmWard provides internal farm record-keeping and does not issue legal compliance certificates or government veterinary authorizations.
- **Single-Node SQLite:** The existing storage model is tailored for single-server or volume-mounted container deployments. A migration to PostgreSQL via Prisma or Drizzle is recommended if distributed multi-region scaling is required.
- **Outbreak Feed Integration:** Live disease alert integration (e.g., WOAH/FAO feeds) is not currently part of the offline-first self-assessment scope and is scheduled for Phase 2 development.
