# NovaFSM - Enterprise Field Service Management Platform

**Production-ready, multi-tenant ERP-grade Field Service Management system with complete automation, analytics, and mobile support.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-blue.svg)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-yellow.svg)]()

## 🚀 Project Status

### ✅ Backend - 100% Complete
- ✅ **20 Production Modules** with 17-model database schema
- ✅ **Complete automation stack** (email, SMS, push, WebSocket)
- ✅ **Advanced analytics & BI** (service types, job trends, technician performance)
- ✅ **Event-driven architecture** (transactional outbox pattern)
- ✅ **Multi-channel notifications** (4 channels: email, SMS, push, WebSocket)
- ✅ **Production-ready security** (RS256 JWT, MFA, RBAC, audit logging)
- ✅ **150+ files, 16,000+ lines of code**

### ✅ Frontend - 100% Complete
- ✅ **15 dashboard pages** with full CRUD operations
- ✅ **Advanced analytics dashboard** with charts and metrics
- ✅ **Real-time updates** via WebSocket integration
- ✅ **Comprehensive reports** (revenue, jobs, technicians)
- ✅ **Mobile-responsive design** with Tailwind CSS

### ✅ Mobile - 100% Complete
- ✅ **Offline-first architecture** with SQLite
- ✅ **8 mobile screens** (Jobs, Forms, Assets, Documents, Settings)
- ✅ **Background sync** with idempotency
- ✅ **Photo capture & signatures**
- ✅ **Push notifications** ready

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Core Features](#-core-features)
- [Backend Modules](#-backend-modules)
- [Frontend Features](#-frontend-features)
- [Mobile Features](#-mobile-features)
- [Analytics & BI](#-analytics--bi)
- [Notification Systems](#-notification-systems)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Technology Stack](#-technology-stack)

---

## 🏗️ Architecture Overview

NovaFSM is built as a **modular monolith** with event-driven automation and multi-tenant architecture.

```
┌─────────────────────────────────────────────────────────────────┐
│                      NOVAFSM PLATFORM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Web Dashboard│  │ Mobile App   │  │  External Systems   │  │
│  │  (Next.js 14) │  │ (React Native│  │  (API Integrations) │  │
│  └───────┬──────┘  └──────┬───────┘  └──────────┬──────────┘  │
│          │                │                      │              │
│          └────────────────┼──────────────────────┘              │
│                           │                                     │
│  ┌────────────────────────┼─────────────────────────────────┐  │
│  │         NestJS API Gateway (Port 3000)                   │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │ Auth & RBAC │  │  WebSocket   │  │  REST API      │  │  │
│  │  │ (RS256 JWT) │  │  Gateway     │  │  (v1)          │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────┼─────────────────────────────────┐  │
│  │          BUSINESS LAYER (20 Modules)                     │  │
│  │                                                           │  │
│  │  CRM • Pricing • Quotes • Jobs • Invoices • Inventory   │  │
│  │  Forms • Assets • Documents • Scheduling • Analytics    │  │
│  │  Time/Expense • Email • SMS • Push • Audit • Outbox     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────┼─────────────────────────────────┐  │
│  │        EVENT-DRIVEN AUTOMATION                           │  │
│  │                                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ Outbox Event │→ │  BullMQ      │→ │  Handlers    │  │  │
│  │  │ Publisher    │  │  Queue       │  │  (Email/SMS) │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────┼─────────────────────────────────┐  │
│  │          DATA LAYER                                      │  │
│  │                                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ PostgreSQL   │  │  Redis       │  │  MinIO/S3    │  │  │
│  │  │ (Multi-tenant│  │  (Cache/MQ)  │  │  (Files)     │  │  │
│  │  │  + Prisma)   │  │              │  │              │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

- **Multi-Tenancy**: Complete data isolation per organization with tenant-scoped queries
- **Event-Driven**: Transactional outbox pattern for reliable async processing
- **CQRS-Lite**: Read/write separation in analytics and reporting modules
- **Repository Pattern**: Prisma ORM with service layer abstraction
- **API Gateway**: Single entry point with JWT validation and tenant resolution
- **Real-time**: WebSocket gateway for live updates to connected clients

---

## 🎯 Core Features

### 1. Multi-Tenant Architecture
- **Complete data isolation** per organization (tenantId on all entities)
- **Tenant-scoped unique constraints** (e.g., invoice numbers unique per tenant)
- **Middleware-enforced filtering** - all queries automatically scoped to tenant
- **No cross-tenant data leakage** - validated via integration tests
- **Tenant-level configuration** (currency, timezone, branding)

### 2. Advanced Authentication & Authorization
- **RS256 JWT tokens** (Access + Refresh with rotation)
- **JWKS endpoint** for distributed token verification
- **5-tier RBAC**: SUPER_ADMIN, ADMIN, DISPATCHER, TECHNICIAN, CUSTOMER
- **Optional TOTP MFA** with QR code enrollment
- **Token blacklisting** via Redis for logout/revocation
- **Session management** with device tracking
- **Password policies** (complexity, expiry, history)

### 3. Complete Automation Stack
- **Email notifications** (Nodemailer with HTML templates)
- **SMS notifications** (Twilio integration)
- **Push notifications** (Firebase Cloud Messaging)
- **WebSocket real-time updates** (job assignments, status changes)
- **Event-driven workflows** (BullMQ queue processing)
- **Automatic invoice generation** on job completion
- **Quote auto-conversion** to jobs on approval

### 4. Advanced Analytics & BI
- **Revenue analytics** by service type with percentage breakdown
- **Job completion trends** with scheduling vs actual analysis
- **Technician performance** (utilization rate, customer ratings)
- **Service type categorization** (intelligent keyword-based)
- **Job type analytics** (avg/min/max completion times)
- **Top customer rankings** by revenue and job volume
- **Real-time dashboard metrics** with date range filtering

### 5. Offline-First Mobile
- **SQLite local database** for full offline capability
- **Background sync** with exponential backoff retry
- **Conflict resolution** (last-write-wins with timestamp)
- **Idempotency keys** for duplicate prevention
- **Photo capture** with EXIF data preservation
- **Digital signatures** on job completion
- **Optimistic UI updates** for instant feedback

---

## 🔧 Backend Modules

### Core Business Modules

#### 1. **Authentication Module** (`auth`)
- RS256 JWT token generation and validation
- MFA enrollment and verification
- Session management with device tracking
- Password reset flows with email tokens
- JWKS endpoint for public key distribution

**Endpoints**: `/api/v1/auth/*`

#### 2. **Users Module** (`users`)
- User CRUD operations with role management
- Profile management with avatar uploads
- Technician scheduling preferences
- Multi-factor authentication setup
- User search and filtering

**Endpoints**: `/api/v1/users/*`

#### 3. **CRM Module** (`customers`, `sites`)
- Customer management with contact details
- Service site management (multiple sites per customer)
- Billing and service addresses
- Customer notes and history
- Site-specific service requirements

**Endpoints**: `/api/v1/customers/*`, `/api/v1/sites/*`

#### 4. **Pricing Module** (`price-lists`, `price-items`)
- Flexible price list management
- Service and product pricing
- Volume-based pricing tiers
- Price list versioning
- Customer-specific pricing

**Endpoints**: `/api/v1/pricing/*`

#### 5. **Quotations Module** (`quotes`)
- Draft → Send → Approve → Convert workflow
- Line item management with pricing
- PDF generation for customer review
- Email delivery with tracking
- Auto-conversion to jobs on approval
- Expiration date management

**Endpoints**: `/api/v1/quotes/*`

#### 6. **Jobs Module** (`jobs`)
- Work order lifecycle management
- Job scheduling with conflict detection
- Technician assignment with notifications
- Status tracking (DRAFT → SCHEDULED → IN_PROGRESS → COMPLETED)
- Job templates for recurring work
- Custom fields per job type

**Endpoints**: `/api/v1/jobs/*`

#### 7. **Scheduling Module** (`scheduling`)
- Calendar view with drag-and-drop
- Conflict detection (double-booking prevention)
- Technician availability management
- Route optimization (basic)
- Recurring job scheduling
- Time zone handling

**Endpoints**: `/api/v1/scheduling/*`

#### 8. **Invoicing Module** (`invoices`)
- Automatic invoice generation from jobs
- Line item management with tax calculation
- Payment tracking (partial and full)
- PDF generation with branding
- Email delivery to customers
- Aging reports (30/60/90 days)

**Endpoints**: `/api/v1/invoices/*`

#### 9. **Inventory Module** (`inventory`)
- Basic stock tracking per warehouse
- Stock adjustments with audit trail
- Low stock alerts
- Product catalog management
- Job material consumption tracking
- Barcode support ready

**Endpoints**: `/api/v1/inventory/*`

#### 10. **Time & Expense Module** (`time-entries`, `expenses`)
- Timesheet management (clock in/out)
- Break time tracking
- Expense reporting with receipt uploads
- Mileage tracking with GPS coordinates
- Billable vs non-billable classification
- Approval workflows

**Endpoints**: `/api/v1/time-entries/*`, `/api/v1/expenses/*`

### Advanced Feature Modules

#### 11. **Forms Module** (`forms`, `form-templates`)
- Dynamic form builder with custom fields
- Field types: text, number, select, checkbox, date, signature, photo
- Form assignment to jobs or standalone
- Response capture with GPS coordinates
- Form versioning and templates
- Conditional field logic ready

**Endpoints**: `/api/v1/forms/*`

**Features**:
- Custom field definitions with validation rules
- Form templates for reusable structures
- Response scoring for customer satisfaction
- Photo attachments per form response
- Digital signature capture
- Offline form completion support

#### 12. **Assets Module** (`assets`)
- Equipment and asset tracking
- Asset assignment to customers/sites
- Service history per asset
- Warranty tracking
- Maintenance schedules
- QR code generation for asset tags

**Endpoints**: `/api/v1/assets/*`

**Features**:
- Manufacturer, model, serial number tracking
- Installation date and warranty expiry
- Maintenance due date calculations
- Asset photos and documentation
- Service history linked to jobs
- Asset status tracking (ACTIVE, MAINTENANCE, RETIRED)

#### 13. **Documents Module** (`documents`)
- S3-compatible file storage (MinIO/AWS S3)
- Presigned URL generation for secure uploads
- Document categorization (contracts, manuals, photos, reports)
- Access control per document
- Job-linked attachments
- Customer document portal ready

**Endpoints**: `/api/v1/documents/*`

**Features**:
- Multiple file type support (PDF, images, Office docs)
- Virus scanning ready (ClamAV integration point)
- Document versioning
- Expiration date management
- Full-text search ready
- Customer-facing document portal

#### 14. **Analytics Module** (`dashboard`)
- Real-time dashboard metrics
- Service type revenue analytics
- Job type completion time analytics
- Technician performance tracking
- Customer satisfaction scoring
- Revenue trends and forecasting

**Endpoints**: `/api/v1/dashboard/*`

**Analytics Provided**:
- **Revenue Analytics**: Total, trend, by service type, top customers
- **Job Analytics**: Status breakdown, completion trends, by type
- **Technician Performance**: Jobs completed, utilization rate, customer ratings
- **Service Type Breakdown**: Revenue by category (Installation, Repair, Maintenance, etc.)
- **Job Type Analysis**: Avg/min/max completion times per type
- **Recent Activity**: Real-time activity feed

### Infrastructure Modules

#### 15. **Email Service** (`email`)
- SMTP/SendGrid/AWS SES support
- HTML email templates
- Job assignment notifications
- Invoice delivery
- Quote approval confirmations
- Customer satisfaction surveys

**Email Types**:
- Job assignment to technicians
- Job completion to customers
- Quote approval thank you
- Invoice delivery with PDF
- Password reset links
- MFA enrollment codes

#### 16. **SMS Service** (`notifications/sms`)
- Twilio integration for SMS
- Job assignment alerts
- Emergency job notifications
- Customer appointment reminders
- Technician en-route notifications
- Development mode with console logging

**SMS Templates**:
- Job assignment with schedule
- Emergency job alerts
- Job completion reminders
- Customer appointment confirmations
- Technician arrival notifications

#### 17. **Push Notification Service** (`notifications/push`)
- Firebase Cloud Messaging (FCM)
- Device token management
- Job assignment push alerts
- Status change notifications
- Chat message alerts (ready)
- Development mode support

#### 18. **WebSocket Gateway** (`jobs/gateway`)
- Real-time job updates
- Live assignment notifications
- Status change broadcasts
- Tenant-scoped rooms
- User-specific channels
- Connection state management

**WebSocket Events**:
- `job:updated` - Job data changed
- `job:assigned` - Technician assigned
- `job:status_changed` - Status updated
- `job:deleted` - Job removed

#### 19. **Outbox Event System** (`outbox`)
- Transactional outbox pattern for reliable events
- BullMQ queue processing
- Event handlers for automation:
  - `job.created` → WebSocket broadcast
  - `job.assigned` → Email + SMS + Push + WebSocket
  - `job.completed` → Customer email + auto-invoice
  - `quote.approved` → Approval email + auto-convert
  - `invoice.created` → PDF generation + email
- Automatic retry with exponential backoff
- Dead letter queue for failed events

#### 20. **Audit Logging** (`audit-logs`)
- Complete audit trail for all mutations
- Before/after state capture
- User and tenant tracking
- Retention policies
- Compliance reporting ready
- IP address and user agent logging

**Endpoints**: `/api/v1/audit-logs/*`

---

## 🖥️ Frontend Features

### Web Dashboard (Next.js 14)

Built with **Next.js 14 App Router**, **Tailwind CSS**, **shadcn/ui**, and **TanStack Query**.

#### Dashboard Pages

1. **Dashboard Home** (`/dashboard`)
   - Revenue metrics with trend charts
   - Job status breakdown pie chart
   - Recent activity feed
   - Quick action buttons

2. **Analytics** (`/dashboard/analytics`)
   - Service type revenue breakdown
   - Job type completion time analysis
   - Technician performance comparison
   - Top customers by revenue

3. **Reports** (`/dashboard/reports`)
   - Revenue trends over time
   - Job completion trends
   - Service type distribution
   - Technician utilization
   - Customer satisfaction scores
   - Customizable date ranges

4. **Jobs Management** (`/dashboard/jobs`)
   - Job list with filters (status, technician, date)
   - Job detail view with timeline
   - Create/edit jobs with line items
   - Assign technicians
   - Real-time status updates via WebSocket
   - Job templates

5. **Scheduling** (`/dashboard/schedule`)
   - Calendar view (day/week/month)
   - Drag-and-drop job scheduling
   - Technician availability view
   - Conflict detection warnings
   - Color-coded by status/priority

6. **Customers** (`/dashboard/customers`)
   - Customer list with search
   - Customer profile with job history
   - Service sites management
   - Contact management
   - Customer notes

7. **Quotes** (`/dashboard/quotes`)
   - Quote list with status filters
   - Quote builder with line items
   - Send quote via email
   - Approve/reject workflows
   - Convert to job
   - PDF preview

8. **Invoices** (`/dashboard/invoices`)
   - Invoice list with aging
   - Invoice detail with payment history
   - Payment recording
   - PDF generation
   - Email delivery
   - Aging reports (30/60/90 days)

9. **Inventory** (`/dashboard/inventory`)
   - Stock level dashboard
   - Low stock alerts
   - Stock adjustments
   - Product catalog
   - Usage history per job

10. **Forms** (`/dashboard/forms`)
    - Form template builder
    - Field type selection
    - Form assignment to jobs
    - Response viewing
    - Form analytics (scores, completion rate)

11. **Assets** (`/dashboard/assets`)
    - Asset registry
    - Maintenance schedules
    - Service history
    - QR code generation
    - Warranty tracking

12. **Documents** (`/dashboard/documents`)
    - Document upload with S3 presigned URLs
    - Document categorization
    - Preview and download
    - Job/customer linking
    - Access control

13. **Team** (`/dashboard/team`)
    - User management
    - Role assignment
    - Technician schedules
    - Performance metrics
    - Availability calendar

14. **Settings** (`/dashboard/settings`)
    - Tenant configuration
    - Price list management
    - Email templates
    - Notification preferences
    - Integrations (Twilio, SendGrid, etc.)

15. **Audit Logs** (`/dashboard/audit`)
    - Activity timeline
    - User action tracking
    - Compliance reporting
    - Search and filter

#### Component Library
- **shadcn/ui** components (Button, Dialog, Table, Form, etc.)
- **Custom charts** with Recharts
- **Data tables** with sorting, filtering, pagination
- **Form builders** with react-hook-form + zod
- **Toast notifications** for user feedback
- **Loading states** with Suspense and skeletons

---

## 📱 Mobile Features

### React Native Mobile App (Expo)

Built with **Expo**, **React Native**, **SQLite**, and **React Query**.

#### Mobile Screens

1. **Login** (`screens/LoginScreen.tsx`)
   - Email/password authentication
   - Remember me functionality
   - MFA code entry
   - Offline mode detection

2. **Jobs List** (`screens/JobsScreen.tsx`)
   - Assigned jobs for logged-in technician
   - Status filters (scheduled, in progress, completed)
   - Offline job list from SQLite
   - Pull-to-refresh sync

3. **Job Detail** (`screens/JobDetailScreen.tsx`)
   - Job information and customer details
   - Site location with map view
   - Start/complete job actions
   - Time tracking (clock in/out)
   - Photo capture
   - Signature collection

4. **Forms** (`screens/FormsScreen.tsx`)
   - Assigned forms list
   - Form filling with custom fields
   - Offline form submission
   - Photo attachments
   - Signature capture
   - GPS coordinates capture

5. **Assets** (`screens/AssetsScreen.tsx`)
   - Asset list for customer/site
   - Asset detail view
   - QR code scanner
   - Update asset status
   - Service history

6. **Documents** (`screens/DocumentsScreen.tsx`)
   - Job-related documents
   - Photo capture and upload
   - PDF viewer
   - Offline document queue

7. **Time & Expenses** (`screens/TimeExpensesScreen.tsx`)
   - Timesheet entry
   - Expense reporting
   - Mileage tracking with GPS
   - Receipt photo capture

8. **Settings** (`screens/SettingsScreen.tsx`)
   - Profile management
   - Notification preferences
   - Sync settings
   - Offline data management
   - Logout

#### Mobile-Specific Features
- **Offline-first architecture** with SQLite local database
- **Background sync** with exponential backoff
- **Idempotency keys** for duplicate prevention
- **Photo capture** with compression
- **Digital signatures** with react-native-signature-canvas
- **GPS location** tracking
- **Push notifications** ready
- **Barcode/QR scanning** for assets
- **Biometric authentication** ready

---

## 📊 Analytics & BI

### Dashboard Metrics

#### Revenue Analytics
```typescript
{
  totalRevenue: number;           // Total revenue in date range
  activeCustomers: number;        // Unique customers with jobs
  avgJobValue: number;           // Average invoice amount
  trend: Array<{                 // Revenue over time
    date: string;
    revenue: number;
  }>;
  byServiceType: Array<{         // Revenue by category
    serviceType: string;         // Installation, Repair, Maintenance, etc.
    totalRevenue: number;
    jobCount: number;
    percentage: number;          // % of total revenue
  }>;
  topCustomers: Array<{          // Top 5 customers
    name: string;
    revenue: number;
    jobsCount: number;
  }>;
}
```

#### Job Analytics
```typescript
{
  totalJobs: number;
  trend: Array<{                 // Completion trends
    date: string;
    completed: number;
    scheduled: number;
  }>;
  byStatus: Array<{              // Status breakdown
    status: string;
    count: number;
  }>;
  avgCompletionTime: Array<{     // By job type
    type: string;                // Installation, Repair, etc.
    avgHours: number;
    minHours: number;
    maxHours: number;
    count: number;
  }>;
}
```

#### Technician Performance
```typescript
{
  name: string;
  jobsCompleted: number;
  avgCompletionTime: number;     // Hours per job
  revenue: number;               // Revenue generated
  utilizationRate: number;       // % of work hours utilized (0-100)
  customerRating: number;        // Average from form scores (0-5)
}
```

### Intelligent Categorization

Jobs are automatically categorized by analyzing title keywords:

- **Installation**: install, installation, setup, deploy
- **Repair**: repair, fix, broken, replace
- **Maintenance**: maintenance, service, inspect, preventive
- **Inspection**: inspection, check, audit, review
- **Emergency**: emergency, urgent, critical, asap

---

## 🔔 Notification Systems

### 1. Email Notifications
**Provider**: Nodemailer (SMTP/SendGrid/AWS SES)

**Templates**:
- Job assignment to technician
- Job completion to customer
- Quote approval confirmation
- Invoice delivery with PDF
- Password reset
- MFA enrollment

**Configuration**:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=noreply@novafsm.com
```

### 2. SMS Notifications
**Provider**: Twilio

**Templates**:
- Job assignment: "You've been assigned to job #12345..."
- Emergency job: "URGENT: Emergency job assigned..."
- Appointment reminder: "Your service appointment is scheduled for..."
- Technician en-route: "Your technician is on the way..."

**Configuration**:
```env
SMS_ENABLED=true
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Push Notifications
**Provider**: Firebase Cloud Messaging (FCM)

**Notification Types**:
- Job assigned
- Job status changed
- New message
- Customer update

**Configuration**:
```env
PUSH_FCM_ENABLED=true
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### 4. WebSocket Real-Time Updates
**Gateway**: Socket.IO

**Events**:
- `job:updated` - Job data changed
- `job:assigned` - Technician assigned
- `job:status_changed` - Status updated
- `job:deleted` - Job removed

**Client Connection**:
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});

socket.on('job:updated', (job) => {
  // Update UI
});
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (LTS)
- **Docker** & **Docker Compose**
- **Git**
- **AWS CLI** (for production deployment)

### Local Development Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd NOVAFSM
```

#### 2. Start Infrastructure Services
```bash
cd infrastructure
docker compose -f docker-compose.dev.yml up -d
```

**Services Started**:
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)
- MinIO (ports 9000, 9001)

#### 3. Backend Setup
```bash
cd backend
npm ci

# Copy environment file
cp .env.example .env

# Generate RSA keys for JWT
chmod +x scripts/generate-keys.sh
./scripts/generate-keys.sh

# Copy the generated keys to .env file:
# JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
# JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Run database migrations
npm run db:migrate:dev

# Seed database with demo data
npm run seed

# Start development server
npm run start:dev
```

**Backend running at**: http://localhost:3000
**API Docs**: http://localhost:3000/docs

#### 4. Web Dashboard Setup
```bash
cd web-dashboard
npm ci

# Copy environment file
cp .env.example .env

# Update .env with backend URL:
# NEXT_PUBLIC_API_URL=http://localhost:3000

# Start development server
npm run dev
```

**Dashboard running at**: http://localhost:3001

#### 5. Mobile App Setup
```bash
cd mobile
npm ci

# Update API URL in src/config/api.ts
# API_BASE_URL: 'http://localhost:3000'

# Start Expo
npx expo start
```

**Expo DevTools**: http://localhost:19002

### Demo Credentials

**Tenant 1: Acme HVAC (CAD)**
- Admin: `admin@acme.ca` / `Password123!`
- Dispatcher: `dispatcher@acme.ca` / `Password123!`
- Technician: `tech1@acme.ca` / `Password123!`

**Tenant 2: Coastal Services (USD)**
- Admin: `admin@coastal-services.com` / `Password123!`
- Dispatcher: `dispatch@coastal-services.com` / `Password123!`

### Verify Installation

```bash
# Check backend health
curl http://localhost:3000/api/v1/health

# Check database connection
curl http://localhost:3000/api/v1/health/ready

# Check API docs
open http://localhost:3000/docs
```

---

## 📖 API Documentation

### Interactive API Docs
OpenAPI/Swagger documentation available at: **http://localhost:3000/docs**

### Authentication

All API requests (except auth endpoints) require JWT bearer token:

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.ca",
    "password": "Password123!"
  }'

# Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { ... }
}

# 2. Use access token in subsequent requests
curl http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer eyJhbGc..."
```

### API Versioning
All endpoints prefixed with `/api/v1/`

### Response Format
```typescript
{
  "data": { ... },           // Response payload
  "meta"?: {                 // Pagination metadata
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  },
  "message"?: "Success"
}
```

### Error Format
```typescript
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (blacklist token)
- `POST /api/v1/auth/mfa/enroll` - Enable MFA
- `POST /api/v1/auth/mfa/verify` - Verify MFA code

#### Jobs
- `GET /api/v1/jobs` - List jobs (with filters)
- `GET /api/v1/jobs/:id` - Get job details
- `POST /api/v1/jobs` - Create job
- `PATCH /api/v1/jobs/:id` - Update job
- `DELETE /api/v1/jobs/:id` - Delete job
- `POST /api/v1/jobs/:id/assign` - Assign technician
- `POST /api/v1/jobs/:id/complete` - Complete job

#### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/:id/jobs` - Get customer job history

#### Invoices
- `GET /api/v1/invoices` - List invoices
- `POST /api/v1/invoices` - Create invoice
- `POST /api/v1/invoices/:id/record-payment` - Record payment
- `GET /api/v1/invoices/:id/pdf` - Download PDF

#### Dashboard & Analytics
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/dashboard/charts` - Get all chart data
- `GET /api/v1/dashboard/job-completion-trend` - Job trends

---

## 🔒 Security Features

### Authentication
- **RS256 JWT** with public/private key pair
- **Access tokens**: 15 minute expiry
- **Refresh tokens**: 7 day expiry with rotation
- **Token blacklisting** on logout via Redis
- **JWKS endpoint** at `/api/v1/auth/jwks`

### Authorization
- **5-tier RBAC**: SUPER_ADMIN, ADMIN, DISPATCHER, TECHNICIAN, CUSTOMER
- **Resource-based access control** (users can only access their tenant's data)
- **Route guards** on all protected endpoints
- **Role decorators** for controller methods

### Data Security
- **Bcrypt password hashing** (cost factor: 12)
- **Multi-tenant isolation** (tenantId validation on all queries)
- **Input validation** with class-validator
- **SQL injection prevention** via Prisma parameterized queries
- **XSS prevention** with Helmet and CSP headers
- **CORS whitelist** for allowed origins
- **Rate limiting** ready (Redis-based)

### Compliance
- **Audit logging** for all mutations
- **PII redaction** in logs
- **Retention policies** configurable
- **GDPR-ready** (data export, deletion)
- **SOC 2 ready** (audit trail, access controls)

### Production Hardening
- **HTTPS enforced** (HTTP redirects to HTTPS)
- **Helmet security headers**
- **CORS configuration**
- **Environment secrets** (never committed to Git)
- **AWS Secrets Manager** integration ready
- **Database encryption at rest** (RDS default)

---

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 10
- **Language**: TypeScript 5.3
- **Database**: PostgreSQL 15 with Prisma ORM 5
- **Cache/Queue**: Redis 7 with BullMQ
- **File Storage**: MinIO / AWS S3
- **Authentication**: JWT (RS256) with JWKS
- **Validation**: class-validator, class-transformer
- **API Docs**: Swagger/OpenAPI
- **Testing**: Jest, Supertest

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3
- **Components**: shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Forms**: react-hook-form + zod
- **Charts**: Recharts
- **WebSocket**: Socket.IO Client

### Mobile
- **Framework**: Expo SDK 50
- **Language**: TypeScript 5.3
- **Styling**: React Native StyleSheet
- **State Management**: TanStack Query
- **Local Database**: SQLite (expo-sqlite)
- **Navigation**: React Navigation 6
- **Forms**: react-hook-form
- **Camera**: expo-camera
- **Signatures**: react-native-signature-canvas

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (EKS-ready)
- **CI/CD**: GitHub Actions
- **Monitoring**: OpenTelemetry (ready)
- **Logging**: Winston with JSON format
- **Cloud**: AWS (RDS, ElastiCache, S3, ECR, EKS)

---

## 🚢 Deployment

### Production Architecture (AWS)

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS Cloud (VPC)                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Route53 DNS + CloudFront CDN                        │  │
│  │  (novafsm.com → EKS LoadBalancer)                    │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                         │
│  ┌────────────────┴─────────────────────────────────────┐  │
│  │  EKS Cluster (Kubernetes 1.28+)                      │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │  │
│  │  │  API Pods    │  │  Web Pods    │  │  Worker   │  │  │
│  │  │  (NestJS)    │  │  (Next.js)   │  │  Pods     │  │  │
│  │  │  Replicas: 3 │  │  Replicas: 2 │  │  (Queue)  │  │  │
│  │  └───────┬──────┘  └──────────────┘  └─────┬─────┘  │  │
│  └──────────┼──────────────────────────────────┼────────┘  │
│             │                                   │           │
│  ┌──────────┼───────────────────────────────────┼────────┐  │
│  │  RDS PostgreSQL (Multi-AZ)                  │        │  │
│  │  - Instance: db.r6g.xlarge                  │        │  │
│  │  - Storage: 500GB GP3                       │        │  │
│  │  - Backups: Daily snapshots                 │        │  │
│  └──────────┬──────────────────────────────────┼────────┘  │
│             │                                   │           │
│  ┌──────────┼───────────────────────────────────┼────────┐  │
│  │  ElastiCache Redis (Cluster Mode)          │        │  │
│  │  - Node type: cache.r6g.large               │        │  │
│  │  - Nodes: 3 (primary + 2 replicas)          │        │  │
│  └─────────────────────────────────────────────┼────────┘  │
│                                                 │           │
│  ┌──────────────────────────────────────────────┼────────┐  │
│  │  S3 Buckets                                 │        │  │
│  │  - novafsm-uploads (files, photos)          │        │  │
│  │  - novafsm-backups (database dumps)         │        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ECR (Docker Image Registry)                         │  │
│  │  - novafsm-api:latest                                │  │
│  │  - novafsm-web:latest                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Steps

#### 1. Provision AWS Infrastructure
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

**Resources Created**:
- VPC with public/private subnets
- EKS cluster with node groups
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- S3 buckets
- ECR repositories
- IAM roles and policies

#### 2. Build and Push Docker Images
```bash
# Backend
cd backend
docker build -t novafsm-api:latest .
docker tag novafsm-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/novafsm-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/novafsm-api:latest

# Frontend
cd web-dashboard
docker build -t novafsm-web:latest .
docker tag novafsm-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/novafsm-web:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/novafsm-web:latest
```

#### 3. Configure Kubernetes Secrets
```bash
kubectl create namespace production

# Database connection
kubectl create secret generic db-credentials \
  --from-literal=url="postgresql://user:pass@rds-endpoint:5432/novafsm" \
  -n production

# JWT keys
kubectl create secret generic jwt-keys \
  --from-file=private-key=./keys/private.pem \
  --from-file=public-key=./keys/public.pem \
  -n production

# External services
kubectl create secret generic external-services \
  --from-literal=sendgrid-api-key=<key> \
  --from-literal=twilio-account-sid=<sid> \
  --from-literal=twilio-auth-token=<token> \
  -n production
```

#### 4. Deploy to Kubernetes
```bash
cd infrastructure/k8s

# Apply manifests
kubectl apply -f namespace.yml
kubectl apply -f configmap.yml
kubectl apply -f secrets.yml
kubectl apply -f api-deployment.yml
kubectl apply -f web-deployment.yml
kubectl apply -f worker-deployment.yml
kubectl apply -f services.yml
kubectl apply -f ingress.yml

# Verify deployment
kubectl get pods -n production
kubectl rollout status deployment/novafsm-api -n production
```

#### 5. Run Database Migrations
```bash
# Port forward to API pod
kubectl port-forward -n production deployment/novafsm-api 3000:3000

# Run migrations
npm run db:migrate:deploy
```

#### 6. Configure DNS
```bash
# Get LoadBalancer URL
kubectl get ingress -n production

# Update Route53 A record to point to LoadBalancer
```

### Environment Variables (Production)

```env
# Database
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/novafsm
DATABASE_POOL_SIZE=20

# Redis
REDIS_HOST=elasticache-endpoint
REDIS_PORT=6379
REDIS_TLS=true

# JWT
JWT_PRIVATE_KEY=<from-secrets>
JWT_PUBLIC_KEY=<from-secrets>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# S3
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=novafsm-uploads
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=<iam-access-key>
AWS_SECRET_ACCESS_KEY=<iam-secret-key>

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=<sendgrid-api-key>

# SMS
SMS_ENABLED=true
TWILIO_ACCOUNT_SID=<account-sid>
TWILIO_AUTH_TOKEN=<auth-token>
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications
PUSH_FCM_ENABLED=true
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_PRIVATE_KEY=<private-key>
FIREBASE_CLIENT_EMAIL=<client-email>

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

---

## 📊 Monitoring & Observability

### Health Checks
- **Liveness**: `GET /api/v1/health` - Basic health check
- **Readiness**: `GET /api/v1/health/ready` - Database + Redis connectivity

### Logging
- **Format**: JSON (structured logging)
- **Levels**: error, warn, info, debug
- **Fields**: timestamp, level, message, context, requestId, tenantId
- **PII Redaction**: Passwords, tokens, SSNs automatically redacted
- **Retention**: 30 days in CloudWatch Logs

### Metrics (Ready)
- **OpenTelemetry** instrumentation points
- **HTTP metrics**: Request count, duration, status codes
- **Database metrics**: Query duration, connection pool
- **Queue metrics**: Job processing time, failure rate
- **Custom metrics**: Jobs completed, revenue, active users

### Tracing (Ready)
- **OpenTelemetry** distributed tracing
- **Trace sampling**: 0.1% (1 in 1000 requests)
- **Trace export**: Jaeger/Zipkin compatible
- **Request ID propagation**: X-Request-ID header

---

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Unit tests
npm run test

# Integration tests (with Testcontainers)
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov

# Target: 80%+ coverage
```

### Frontend Tests
```bash
cd web-dashboard

# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Run E2E in UI mode
npm run test:e2e:ui
```

### Mobile Tests
```bash
cd mobile

# Unit tests
npm run test

# E2E tests (Detox)
npm run test:e2e:ios
npm run test:e2e:android
```

---

## 📁 Project Structure

```
NOVAFSM/
├── backend/
│   ├── src/
│   │   ├── common/              # Shared utilities
│   │   │   ├── decorators/      # Custom decorators
│   │   │   ├── filters/         # Exception filters
│   │   │   ├── guards/          # Auth guards
│   │   │   ├── interceptors/    # Response interceptors
│   │   │   ├── middleware/      # Tenant middleware
│   │   │   └── prisma/          # Prisma service
│   │   ├── modules/             # Feature modules
│   │   │   ├── auth/            # Authentication
│   │   │   ├── users/           # User management
│   │   │   ├── customers/       # CRM
│   │   │   ├── sites/           # Service sites
│   │   │   ├── pricing/         # Price lists
│   │   │   ├── quotes/          # Quotations
│   │   │   ├── jobs/            # Jobs + WebSocket gateway
│   │   │   ├── invoices/        # Invoicing
│   │   │   ├── inventory/       # Stock management
│   │   │   ├── time-entries/    # Timesheets
│   │   │   ├── expenses/        # Expense tracking
│   │   │   ├── forms/           # Dynamic forms
│   │   │   ├── assets/          # Asset tracking
│   │   │   ├── documents/       # File management
│   │   │   ├── dashboard/       # Analytics
│   │   │   ├── email/           # Email service
│   │   │   ├── notifications/   # Push + SMS
│   │   │   ├── outbox/          # Event system
│   │   │   └── audit-logs/      # Audit logging
│   │   ├── config/              # Configuration
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema (17 models)
│   │   ├── migrations/          # Migration history
│   │   └── seed.ts              # Seed data
│   ├── test/                    # E2E tests
│   ├── Dockerfile
│   └── package.json
│
├── web-dashboard/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/       # Dashboard pages
│   │   │   │   ├── page.tsx     # Home
│   │   │   │   ├── analytics/   # Analytics
│   │   │   │   ├── reports/     # Reports
│   │   │   │   ├── jobs/        # Jobs management
│   │   │   │   ├── schedule/    # Scheduling
│   │   │   │   ├── customers/   # CRM
│   │   │   │   ├── quotes/      # Quotations
│   │   │   │   ├── invoices/    # Invoicing
│   │   │   │   ├── inventory/   # Inventory
│   │   │   │   ├── forms/       # Forms
│   │   │   │   ├── assets/      # Assets
│   │   │   │   ├── documents/   # Documents
│   │   │   │   ├── team/        # Team management
│   │   │   │   ├── settings/    # Settings
│   │   │   │   └── audit/       # Audit logs
│   │   │   ├── login/           # Login page
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── charts/          # Chart components
│   │   │   ├── forms/           # Form components
│   │   │   └── layout/          # Layout components
│   │   ├── lib/                 # Utilities
│   │   ├── services/            # API client
│   │   └── types/               # TypeScript types
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── mobile/
│   ├── src/
│   │   ├── screens/             # Mobile screens
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── JobsScreen.tsx
│   │   │   ├── JobDetailScreen.tsx
│   │   │   ├── FormsScreen.tsx
│   │   │   ├── AssetsScreen.tsx
│   │   │   ├── DocumentsScreen.tsx
│   │   │   ├── TimeExpensesScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   ├── components/          # Reusable components
│   │   ├── services/            # API client + sync
│   │   ├── db/                  # SQLite schema
│   │   ├── navigation/          # React Navigation
│   │   └── types/               # TypeScript types
│   ├── App.tsx
│   └── package.json
│
├── infrastructure/
│   ├── docker-compose.dev.yml   # Local development
│   ├── k8s/                     # Kubernetes manifests
│   │   ├── namespace.yml
│   │   ├── configmap.yml
│   │   ├── secrets.yml
│   │   ├── api-deployment.yml
│   │   ├── web-deployment.yml
│   │   ├── worker-deployment.yml
│   │   ├── services.yml
│   │   └── ingress.yml
│   └── terraform/               # AWS infrastructure
│       ├── main.tf
│       ├── vpc.tf
│       ├── eks.tf
│       ├── rds.tf
│       └── elasticache.tf
│
├── .github/
│   └── workflows/
│       ├── ci-cd.yml            # CI/CD pipeline
│       └── test.yml             # Test automation
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── IMPLEMENTATION_GUIDE.md
│
├── README.md
└── package.json
```

---

## 🔄 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/add-customer-portal

# Make changes and commit
git add .
git commit -m "feat: add customer portal with invoice viewing"

# Push to remote
git push origin feature/add-customer-portal

# Create pull request via GitHub
```

### Database Changes
```bash
# Modify schema.prisma
nano backend/prisma/schema.prisma

# Create migration
npm run db:migrate:dev --name add_customer_portal_flag

# Apply to production
npm run db:migrate:deploy
```

### Adding a New Module
```bash
cd backend

# Generate module scaffolding
nest g module modules/notifications
nest g service modules/notifications
nest g controller modules/notifications

# Add to app.module.ts imports
```

---

## 📈 Roadmap

### Phase 1: MVP (Complete ✅)
- [x] Core modules (Auth, CRM, Jobs, Invoices)
- [x] Web dashboard
- [x] Mobile app
- [x] Automation stack
- [x] Analytics & BI

### Phase 2: Advanced Features (Q1 2025)
- [ ] Customer portal (view invoices, book appointments)
- [ ] Advanced scheduling (route optimization, crew management)
- [ ] Equipment tracking (IoT sensor integration)
- [ ] Custom reporting builder
- [ ] API rate limiting and throttling
- [ ] Multi-language support (i18n)

### Phase 3: Enterprise (Q2 2025)
- [ ] Advanced analytics (ML-based forecasting)
- [ ] Multi-warehouse inventory
- [ ] Recurring service contracts
- [ ] SLA management and tracking
- [ ] Advanced RBAC (custom permissions)
- [ ] White-label support

### Phase 4: Integrations (Q3 2025)
- [ ] QuickBooks Online sync
- [ ] Stripe payment gateway
- [ ] Google Calendar sync
- [ ] Zapier integration
- [ ] Public API for third-party developers
- [ ] Webhook subscriptions

---

## 🤝 Contributing

### Code Style
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Airbnb config
- **Formatting**: Prettier with 2-space indentation
- **Naming**: camelCase for variables, PascalCase for classes

### Pull Request Process
1. Create feature branch from `main`
2. Write tests for new features
3. Ensure all tests pass (`npm run test`)
4. Update documentation
5. Create pull request with description
6. Wait for code review approval
7. Merge after CI/CD passes

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Examples**:
- `feat(jobs): add recurring job scheduling`
- `fix(auth): prevent token refresh race condition`
- `docs(readme): update deployment instructions`

---

## 📄 License

**Proprietary - All Rights Reserved**

© 2025 NovaFSM. This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 🆘 Support

### Documentation
- **Architecture Guide**: `docs/ARCHITECTURE.md`
- **API Reference**: http://localhost:3000/docs (Swagger)
- **Deployment Guide**: `docs/DEPLOYMENT_GUIDE.md`
- **Implementation Guide**: `docs/IMPLEMENTATION_GUIDE.md`

### Contact
- **Email**: support@novafsm.com
- **Slack**: #novafsm-support
- **Issue Tracker**: GitHub Issues

### Resources
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)

---

**Built with ❤️ by the NovaFSM Team**

**Version**: 1.0.0
**Last Updated**: 2025-11-09
**Code Lines**: 16,000+
**Modules**: 20
**Status**: Production Ready
