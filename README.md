# SarkariSetu – Unified Government Schemes Discovery and Eligibility Platform

A full-stack, secure, production-ready web platform that simplifies discovering, searching, filtering, and understanding Indian Central and State Government welfare schemes across multiple sectors.

---

## 1. Project Overview

**SarkariSetu** ("Bridge to Government Welfare") is a full-stack digital public goods information platform. Its purpose is to bridge the information asymmetry that prevents millions of eligible Indian citizens from discovering, understanding, and claiming government welfare schemes, subsidies, educational scholarships, and financial assistance programs.

SarkariSetu serves:
- **Citizens**: Farmers, students, daily-wage workers, women entrepreneurs, persons with disabilities (Divyangjan), senior citizens, and marginalized communities looking for targeted welfare assistance.
- **Welfare Administrators & Research Analysts**: Administrative personnel who catalog schemes, verify official sources, maintain data integrity, monitor usage metrics, and audit application trends.
- **Civil Society & CSC Operators**: Common Service Centre (CSC) operators and grassroots volunteers seeking structured, unambiguous eligibility information to guide rural and semi-urban beneficiaries.

---

## 2. Problem Statement

Across India, thousands of welfare schemes exist at both Central and State ministry levels, representing trillions of rupees in budgeted benefits. However, citizens face severe challenges:
1. **Information Fragmentation**: Scheme details are scattered across hundreds of disparate departmental portals, notifications, and gazettes.
2. **Ambiguous Eligibility Criteria**: Ministry guidelines are often written in complex bureaucratic jargon, making it difficult for citizens to determine if they meet specific age, income, category, or location criteria.
3. **Misinformation & Scams**: Citizens fall prey to fraudulent intermediaries claiming "guaranteed approval" or charging illicit fees.
4. **Lack of Personalization**: No unified portal allows citizens to input their demographic attributes once and receive tailored scheme recommendations.
5. **No Independent Application Tracking**: Citizens lack a simple personal tracker to monitor their submission dates, reference IDs, and milestones across various departmental portals.

---

## 3. Objectives

SarkariSetu was developed in 4 iterative, disciplined phases to deliver a full-stack, enterprise-grade solution:
- **Phase 1 (Discovery & Catalog)**: Established a responsive public scheme directory, search engine, multi-dimensional filters (Category, State, Department), detailed scheme overviews, and local MongoDB integration.
- **Phase 2 (Personalization & Smart Eligibility)**: Developed citizen accounts (JWT + bcrypt), structured eligibility rules, the 10+ factor real-time Smart Eligibility Engine, and personal scheme bookmarking.
- **Phase 3 (Administration, Tracking & Analytics)**: Introduced Role-Based Access Control (`citizen` vs. `admin`), admin catalog management, official source verification badges, personal application pipeline tracker, in-app notifications, and MongoDB aggregation analytics.
- **Phase 4 (Final Production Readiness, Security & UI/UX)**: Enforced rigorous security headers (`helmet`), rate limiting (`express-rate-limit`), input sanitization, 1MB body limits, 8+ character password policies, accessible UI/UX, unified error handling, automated 31-point test suite, and statutory platform disclaimers.

---

## 4. Key Features

### Citizen Features
- **Central & State Scheme Directory**: Comprehensive repository of government welfare programs with verified department affiliations.
- **Real-Time Search & Multi-Filters**: Instant keyword search across title, description, benefits, occupations, and category with filters for State, Category, and Department.
- **Smart Eligibility Calculator (`/eligibility`)**: Interactive 10+ factor matching engine providing real-time evaluation with breakdown of matched conditions, unmet criteria, and missing info.
- **Personal Citizen Dashboard (`/dashboard`)**: Profile completion gauge, personalized top-ranked scheme recommendations, bookmarked schemes, and recently viewed schemes.
- **Saved Schemes Management (`/saved-schemes`)**: Bookmark schemes for offline review and quick access.
- **Application Milestone Tracker (`/applications`)**: Personal record keeper to track applications across stages (`Saved`, `Interested`, `Applied`, `Completed`) with reference numbers and personal notes.
- **In-App Notification Inbox (`/notifications`)**: Alerts on tracked application updates and platform announcements with read/unread status.

### Admin Features
- **Role-Based Admin Panel (`/admin`)**: Protected workspace accessible only to users with the `admin` role.
- **Scheme Catalog Management (`/admin/schemes`)**: Complete CRUD operations for schemes, including structured eligibility boundaries and official sources.
- **Source Verification Workflow**: Verify schemes against official departmental sources with tracking of `verifiedBy`, `verifiedAt`, and status (`Verified`, `Pending Verification`, `Needs Review`).
- **Inline Status Control**: Toggle schemes between `Active`, `Under Review`, and `Inactive`.
- **System Overview & Aggregation Analytics (`/admin/analytics`)**: Live MongoDB aggregation dashboards showing scheme distribution by category/state, application status funnel, most viewed schemes, and user growth.

### Platform & Architecture Features
- **Hardened Security**: Powered by `helmet`, strict CORS whitelisting, rate limiting (`1000` requests per 15 minutes), and body size constraints.
- **Session & Expiration Handling**: Axios interceptors detect expired tokens (`401`) and gracefully trigger re-authentication.
- **Empty States & Accessibility**: Explicit user-friendly empty states and loading skeletons across all pages.
- **Statutory Platform Disclaimer**: Verbatim legal advisory integrated into every footer and eligibility page.

---

## 5. Technology Stack

### Frontend
- **Framework**: React.js 18 (SPA)
- **Tooling & Bundler**: Vite 6
- **Routing**: React Router v6
- **HTTP Client**: Axios with centralized request & response interceptors
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Build Status**: Production bundle optimized (0 lint/build warnings)

### Backend
- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express.js 4
- **Security Middleware**: Helmet 8, Express-Rate-Limit 8, CORS 2.8
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs` (salt rounds: 10)
- **ODM / Database Client**: Mongoose 8

### Database
- **Engine**: MongoDB (Local instance)
- **Connection URI**: `mongodb://localhost:27017/sarkarisetu`
- **Tooling**: MongoDB Compass / Mongo Shell

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  React.js 18 + Vite + Tailwind CSS (SPA on Port 5173)       │
│  - Public Catalog  - Smart Eligibility Finder               │
│  - Citizen Dashboard - Admin Management Control Panel       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / Express                    │
│  Port 5000 (Node.js)                                        │
│  - Helmet Security Headers      - Express Rate Limiter      │
│  - CORS Policy Whitelist        - Body Limit (1MB)          │
│  - JWT Bearer Authentication    - requireAdmin Authz Guard  │
│  - Centralized Error Handler    - Health Check (/api/health)│
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                         │
│  MongoDB Local Engine (Port 27017 - database: sarkarisetu)  │
│  - schemes (Indexed on schemeName, category, state, status) │
│  - users (Indexed on email [unique], role)                  │
│  - applications (Indexed on [user, scheme] compound unique) │
│  - notifications (Indexed on user, read, createdAt)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Project Structure

```text
SarkariSetu/
├── .gitignore
├── README.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── server.js
│   ├── seeder.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── applicationController.js
│   │   ├── eligibilityController.js
│   │   ├── notificationController.js
│   │   ├── schemeController.js
│   │   └── userController.js
│   ├── data/
│   │   ├── categories.js
│   │   └── sampleSchemes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Application.js
│   │   ├── Notification.js
│   │   ├── Scheme.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── eligibilityRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── schemeRoutes.js
│   │   └── userRoutes.js
│   ├── tests/
│   │   ├── verify_phase3.js
│   │   └── verify_phase4.js
│   └── utils/
│       └── generateToken.js
└── frontend/
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        │   ├── AdminRoute.jsx
        │   ├── CategoryIcon.jsx
        │   ├── Footer.jsx
        │   ├── LoadingSpinner.jsx
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   └── SchemeCard.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── AllSchemesPage.jsx
        │   ├── ApplicationsPage.jsx
        │   ├── CategoriesPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── EligibilityPage.jsx
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── NotFoundPage.jsx
        │   ├── NotificationsPage.jsx
        │   ├── ProfilePage.jsx
        │   ├── RegisterPage.jsx
        │   ├── SavedSchemesPage.jsx
        │   ├── SchemeDetailsPage.jsx
        │   └── admin/
        │       ├── AdminApplicationsPage.jsx
        │       ├── AdminDashboardPage.jsx
        │       ├── AdminLayout.jsx
        │       ├── AdminSchemesPage.jsx
        │       ├── AdminUsersPage.jsx
        │       └── SchemeFormPage.jsx
        └── services/
            └── api.js
```

---

## 8. Database Design

### Scheme Model (`Scheme.js`)
- `schemeName` (String, required, indexed)
- `category` (String, required, indexed)
- `department` (String, required, indexed)
- `description` (String, required)
- `benefits` ([String])
- `eligibility` ([String], human-readable checklist)
- `requiredDocuments` ([String])
- `applicationProcess` ([String])
- `state` (String, default: `'All India'`, indexed)
- `officialWebsite` (String)
- `minimumAge` (Number, default: `null`)
- `maximumAge` (Number, default: `null`)
- `maximumIncome` (Number, default: `null`)
- `eligibleStates` ([String], default: `['All India']`)
- `occupations` ([String])
- `applicableGender` (String, enum: `['All', 'Male', 'Female', 'Other']`)
- `ruralUrban` (String, enum: `['Both', 'Rural', 'Urban', 'All']`)
- `studentRequired` (Boolean, default: `null`)
- `farmerRequired` (Boolean, default: `null`)
- `disabilityRequired` (Boolean, default: `null`)
- `applicableCategories` ([String], default: `['All']`)
- `status` (String, enum: `['Active', 'Inactive', 'Under Review']`, default: `'Active'`)
- `verificationStatus` (String, enum: `['Verified', 'Pending Verification', 'Needs Review']`, default: `'Pending Verification'`)
- `verifiedBy` (ObjectId ref User, default: `null`)
- `verifiedAt` (Date, default: `null`)
- `sourceName` (String, default: `'Official Portal'`)
- `sourceURL` (String)
- `sourceType` (String, enum: `['Central Government', 'State Government', 'Government Department', 'Official Portal', 'Other']`)
- `viewsCount` (Number, default: 0)

### User Model (`User.js`)
- `name` (String, required, minlength: 2)
- `email` (String, required, unique, indexed, lowercase)
- `password` (String, required, minlength: 8, hashed with bcrypt)
- `role` (String, enum: `['citizen', 'admin']`, default: `'citizen'`)
- `age` (Number, min: 0, max: 120)
- `gender` (String, enum: `['Male', 'Female', 'Other', 'Prefer not to say', 'All', '']`)
- `state` (String)
- `district` (String)
- `occupation` (String)
- `annualIncome` (Number, min: 0)
- `ruralOrUrban` (String, enum: `['Rural', 'Urban', 'Both', '']`)
- `studentStatus` (Boolean, default: `false`)
- `farmerStatus` (Boolean, default: `false`)
- `disabilityStatus` (Boolean, default: `false`)
- `category` (String, enum: `['General', 'OBC', 'SC', 'ST', 'EWS', 'Minorities', 'All', '']`)
- `savedSchemes` ([ObjectId ref Scheme])
- `recentlyViewedSchemes` ([{ scheme: ObjectId ref Scheme, viewedAt: Date }])

### Application Model (`Application.js`)
- `user` (ObjectId ref User, required, indexed)
- `scheme` (ObjectId ref Scheme, required, indexed)
- `status` (String, enum: `['Saved', 'Interested', 'Applied', 'Completed']`, default: `'Interested'`, indexed)
- `applicationDate` (Date)
- `referenceNumber` (String)
- `notes` (String)
- Compound unique index: `{ user: 1, scheme: 1 }`

### Notification Model (`Notification.js`)
- `user` (ObjectId ref User, required, indexed)
- `title` (String, required)
- `message` (String, required)
- `type` (String, enum: `['scheme_update', 'application_reminder', 'status_update', 'eligibility', 'system']`)
- `read` (Boolean, default: `false`)
- `link` (String, default: `'/dashboard'`)
- `createdAt` / `updatedAt` (Timestamps)

---

## 9. API Documentation

| Method | Endpoint | Auth | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System health check and status | None |
| `POST` | `/api/users/register` | Public | Register new citizen account (password >= 8 chars) | `{ name, email, password, ...profile }` |
| `POST` | `/api/users/login` | Public | Authenticate user & issue JWT | `{ email, password }` |
| `GET` | `/api/users/profile` | Citizen/Admin | Retrieve current authenticated user profile | None |
| `PUT` | `/api/users/profile` | Citizen/Admin | Update demographic and eligibility attributes | `{ age, occupation, income, ... }` |
| `GET` | `/api/users/saved-schemes` | Citizen/Admin | Get all bookmarked schemes with full details | None |
| `POST` | `/api/users/saved-schemes/:id` | Citizen/Admin | Add scheme to user saved list | None |
| `DELETE` | `/api/users/saved-schemes/:id` | Citizen/Admin | Remove scheme from user saved list | None |
| `GET` | `/api/users/recently-viewed` | Citizen/Admin | Get recently viewed schemes | None |
| `GET` | `/api/schemes` | Public | Query schemes with search, category, state filters | Query params: `search`, `category`, `state` |
| `GET` | `/api/schemes/:id` | Public | Get single scheme details by ID | None |
| `POST` | `/api/schemes/:id/view` | Public | Increment views counter (+ record view if authed) | None |
| `POST` | `/api/schemes` | Admin Only | Create new government scheme | Full Scheme Payload |
| `PUT` | `/api/schemes/:id` | Admin Only | Update existing scheme details | Partial Scheme updates |
| `DELETE` | `/api/schemes/:id` | Admin Only | Delete or deactivate scheme | None |
| `GET` | `/api/schemes/meta/filters` | Public | Get distinct categories, states, and departments | None |
| `GET` | `/api/categories` | Public | Get all categories with scheme counts | None |
| `POST` | `/api/eligibility/check` | Public | Real-time 10+ factor eligibility evaluation | Demographics profile object |
| `GET` | `/api/eligibility/recommendations` | Citizen/Admin | Personalized matched schemes for citizen profile | None |
| `GET` | `/api/applications` | Citizen/Admin | List all tracked applications for user | None |
| `POST` | `/api/applications` | Citizen/Admin | Create or upsert application tracking record | `{ schemeId, status, referenceNumber, notes }` |
| `PUT` | `/api/applications/:id` | Citizen/Admin | Update application tracking status or notes | `{ status, notes, referenceNumber }` |
| `DELETE` | `/api/applications/:id` | Citizen/Admin | Remove scheme application from tracking | None |
| `GET` | `/api/notifications` | Citizen/Admin | Retrieve notifications for logged-in user | None |
| `PUT` | `/api/notifications/:id/read` | Citizen/Admin | Mark single notification as read | None |
| `PUT` | `/api/notifications/read-all` | Citizen/Admin | Mark all user notifications as read | None |
| `GET` | `/api/admin/stats` | Admin Only | Administrative overview counts & metrics | None |
| `GET` | `/api/admin/analytics` | Admin Only | MongoDB aggregation pipeline analytics | None |
| `GET` | `/api/admin/users` | Admin Only | Paginated list of registered users | None |
| `GET` | `/api/admin/applications` | Admin Only | System-wide citizen application tracker logs | None |
| `PUT` | `/api/admin/schemes/:id/status` | Admin Only | Update scheme status (Active, Inactive, Under Review) | `{ status }` |
| `PUT` | `/api/admin/schemes/:id/verification` | Admin Only | Update scheme verification badge and metadata | `{ verificationStatus }` |

---

## 10. Authentication & Authorization

SarkariSetu enforces strict security:
- **Password Policy**: Passwords require a minimum of 8 characters and are securely hashed with `bcryptjs` using 10 salt rounds before storage.
- **JWT Tokens**: Authentication tokens are signed with `JWT_SECRET` and include user ID claims with expiration set by `JWT_EXPIRES_IN` (default: `7d`).
- **Middleware Guards**:
  - `protect`: Verifies the incoming `Authorization: Bearer <token>` header. If the token is expired, returns `401 Unauthorized` with `{ isExpired: true }`.
  - `requireAdmin`: Checks `req.user.role === 'admin'`. If the user is a standard citizen, rejects access with `403 Forbidden`.
- **Session Expiration Management**: The frontend Axios client listens for `401` errors, clears stored tokens and user state, and emits an application-wide session expiration event prompting the user to sign in again.

---

## 11. Eligibility Matching Engine

The Smart Eligibility Matching Engine evaluates candidate profiles against 10 distinct rule dimensions:

1. **Age Bounds**: Checks if `profile.age >= minimumAge` and `profile.age <= maximumAge`.
2. **Gender Alignment**: Verifies if `applicableGender === 'All'` or matches user gender.
3. **State / Regional Availability**: Verifies if the scheme applies to `'All India'` or includes the citizen's specific state of residence.
4. **Income Ceiling**: Checks if citizen's household income is within `maximumIncome`.
5. **Occupation Match**: Matches user occupation against approved sector list (`occupations`).
6. **Area Type**: Validates rural vs. urban requirements (`ruralUrban`).
7. **Farmer Status**: Evaluates if the program requires active farmer status (`farmerRequired`).
8. **Student Status**: Evaluates if the program requires current student enrollment (`studentRequired`).
9. **Disability Status**: Evaluates priority or requirements for Divyangjan (`disabilityRequired`).
10. **Social Category Priority**: Evaluates eligibility across General, OBC, SC, ST, EWS, and Minority categories.

**Scoring & Status Assignment**:
- **Potentially Eligible** (Score >= 75%): Citizen meets key mandatory criteria and demographic rules.
- **Partially Matched** (50% <= Score < 75%): Citizen meets several criteria, but some attributes are missing or require verification.
- **Criteria Unmet** (Score < 50%): Citizen is currently outside required age, income, or occupational criteria.

*Advisory Note*: Results indicate potential eligibility only. Citizens are always directed to verify requirements on official government portals before applying.

---

## 12. Admin Management

Administrators have access to a dedicated dashboard (`/admin`):
- **Catalog Management**: View, filter, create, edit, or soft-delete schemes.
- **Verification Workflow**: Mark schemes as `Verified`, `Pending Verification`, or `Needs Review`.
- **Status Workflow**: Toggle schemes between `Active`, `Under Review`, and `Inactive`.
- **User Oversight**: Review registered citizen counts and application tracker engagement without exposing citizen passwords.

---

## 13. Application Tracking

SarkariSetu provides a personal tracking pipeline (`/applications`):
- Citizens track their self-initiated applications using statuses:
  - `Saved` – Bookmarked for future application
  - `Interested` – Reviewing requirements and gathering documents
  - `Applied` – Submitted through the official departmental portal
  - `Completed` – Benefits sanctioned or application cycle concluded
- Allows storing the official application reference ID, submission date, and personal follow-up notes.
- *Clarification*: SarkariSetu is a discovery and tracking directory; applications are processed solely by the respective government portals.

---

## 14. Notification System

Internal, in-app notifications (`/notifications`):
- **Trigger Events**:
  - Application status updates (e.g., citizen updates tracker to `Applied` or `Completed`).
  - Scheme guideline updates published by administrators.
  - Important system announcements and profile recommendations.
- **Capabilities**: Unread indicator in navigation bar, individual mark-as-read, and bulk mark-all-read.

---

## 15. Analytics & Reporting

The admin analytics module executes real-time MongoDB aggregation pipelines:
- `$group` pipelines calculating scheme distributions by Category and State.
- Aggregation of citizen application tracking milestones.
- `$sort` and `$limit` queries for the most viewed and most bookmarked schemes.
- User registration metrics aggregated across time.

---

## 16. Installation Guide

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- MongoDB installed locally and running on port 27017
- npm or yarn package manager

### Step-by-Step Setup

1. **Clone or Navigate to Project Directory**:
   ```bash
   cd SarkariSetu
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your local secrets
   npm run seed
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Ensure VITE_API_URL=http://localhost:5000/api
   ```

---

## 17. Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend Express server port | `5000` |
| `MONGO_URI` | MongoDB connection connection string | `mongodb://localhost:27017/sarkarisetu` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_secure_jwt_secret_key` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `CLIENT_URL` | Frontend origin for CORS policy | `http://localhost:5173` |
| `NODE_ENV` | Application environment (`development` / `production`) | `development` |
| `ADMIN_EMAIL` | Default administrator seed email | `admin@sarkarisetu.gov.in` |
| `ADMIN_PASSWORD` | Default administrator seed password (min 8 chars) | `Admin@SarkariSetu2026` |
| `DEMO_CITIZEN_EMAIL` | Default citizen seed email | `ramesh.kumar@example.com` |
| `DEMO_CITIZEN_PASSWORD`| Default citizen seed password | `password123` |

### Frontend (`frontend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base REST API endpoint URL | `http://localhost:5000/api` |

---

## 18. Running Locally

### Starting Backend Server
From `backend/`:
```bash
npm run dev
# Server runs on http://localhost:5000
```

### Starting Frontend Server
From `frontend/`:
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 19. Testing

SarkariSetu includes an automated 31-point test suite covering Authentication, Authorization, Scheme Management, Eligibility Evaluation, Citizen Features, Analytics, and Cross-Phase Regression.

### Running Automated Test Suite
From `backend/`:
```bash
npm test
```

### Test Coverage Checklist (All 31 Tests)

#### Authentication (6 tests)
- [x] Test 1: Citizen registration with valid data (HTTP 201)
- [x] Test 2: Citizen login with valid credentials (HTTP 200)
- [x] Test 3: Citizen login with invalid credentials -> returns 401
- [x] Test 4: Admin login with admin credentials (HTTP 200)
- [x] Test 5: JWT token validation on protected route (HTTP 200)
- [x] Test 6: Logout / session clearing on client rejection (HTTP 401)

#### Authorization (3 tests)
- [x] Test 7: Citizen attempting to access admin API -> returns 403 Forbidden
- [x] Test 8: Admin accessing admin API -> returns 200 OK
- [x] Test 9: Unauthenticated user accessing protected route -> returns 401 Unauthorized

#### Scheme Management (9 tests)
- [x] Test 10: Scheme search by keyword returns matching schemes
- [x] Test 11: Scheme filter by category returns correct schemes
- [x] Test 12: Scheme filter by state returns Central + state-specific schemes
- [x] Test 13: Scheme details page loads complete data
- [x] Test 14: Scheme view count increments on view
- [x] Test 15: Admin creates new scheme with all fields
- [x] Test 16: Admin edits existing scheme
- [x] Test 17: Admin deletes scheme (or marks inactive)
- [x] Test 18: Scheme status toggle works correctly (Active / Under Review)

#### Eligibility Engine (3 tests)
- [x] Test 19: Eligibility check with matching profile returns schemes with match score
- [x] Test 20: Eligibility check with non-matching profile returns lower match score
- [x] Test 21: Missing optional fields handled gracefully without crashing

#### Citizen Features (5 tests)
- [x] Test 22: Citizen saves a scheme to bookmarks
- [x] Test 23: Citizen removes a saved scheme from bookmarks
- [x] Test 24: Citizen views recently viewed schemes
- [x] Test 25: Citizen creates/tracks an application
- [x] Test 26: In-app notification received when application status changes

#### Analytics & Stats (2 tests)
- [x] Test 27: Admin dashboard stats return accurate counts
- [x] Test 28: Schemes by category aggregation works correctly via MongoDB `$group`

#### Regression Suite (3 tests)
- [x] Test 29: Phase 1 features intact (public browsing, categories, search)
- [x] Test 30: Phase 2 features intact (user accounts, smart eligibility finder)
- [x] Test 31: Phase 3 features intact (admin panel, application tracker, notifications)

**Execution Summary: 31 Executed | 31 Passed | 0 Failed**

---

## 20. Deployment Guide

### Backend Production Deployment
1. Set `NODE_ENV=production` in backend environment.
2. Supply a cryptographically secure `JWT_SECRET` (at least 32 characters).
3. Connect to a production MongoDB instance (e.g., MongoDB Atlas or self-hosted replica set with authentication and TLS).
4. Update `CLIENT_URL` to match your production frontend domain.
5. Deploy using a process manager (e.g., PM2) or containerize with Docker:
   ```bash
   pm2 start server.js --name sarkarisetu-api
   ```

### Frontend Production Deployment
1. Set `VITE_API_URL=https://your-api-domain.com/api` in frontend environment.
2. Execute the production build:
   ```bash
   npm run build
   ```
3. The generated static assets in `dist/` can be served via Nginx, Caddy, Vercel, Netlify, or AWS CloudFront/S3.

---

## 21. Security Considerations

- **Password Hashing**: Passwords are never stored in plain text. Salt rounds are enforced via `bcryptjs`.
- **JWT Protection**: Tokens are signed, validated on every request, and expire automatically.
- **Request Limiting**: `express-rate-limit` prevents brute-force attacks on API endpoints.
- **Security Headers**: `helmet` configures essential HTTP response headers (XSS filter, frameguard, nosniff).
- **Payload Limits**: `express.json({ limit: '1mb' })` protects against oversized payload denial-of-service attacks.
- **CORS Whitelisting**: Cross-Origin Resource Sharing is locked to configured client origins (`CLIENT_URL`).
- **Data Sanitization & Masking**: Sensitive fields such as passwords are excluded (`-password`) in all user queries. Stack traces are masked in production mode.

---

## 22. Disclaimer

> **Statutory Platform Disclaimer**:
>
> SarkariSetu is an independent public information discovery and citizen eligibility advisory platform. It is not affiliated with, endorsed by, or operated by any government ministry, department, or official agency. All scheme details, eligibility guidelines, benefits, and application processes are compiled from publicly available official government portals and notifications for informational purposes only.
>
> Scheme eligibility calculated on this platform is indicative and does not guarantee approval. Citizens must verify all requirements and submit applications directly on official government portals (`.gov.in` / `.nic.in`) or at authorized Common Service Centres (CSC). SarkariSetu does not process applications, collect fees, or guarantee benefits.
