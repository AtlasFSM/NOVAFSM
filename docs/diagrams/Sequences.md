# Sequence Diagrams

## 1. Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant Database
    participant JWT

    Client->>API: POST /auth/login (email, password)
    API->>AuthService: validateUser(email, password)
    AuthService->>Database: findByEmail(email)
    Database-->>AuthService: User
    AuthService->>AuthService: bcrypt.compare(password, hash)
    AuthService-->>API: Valid User
    API->>JWT: sign({ userId, tenantId, role })
    JWT-->>API: access_token, refresh_token
    API-->>Client: { access_token, refresh_token, user }
    
    Note over Client,API: Subsequent requests
    
    Client->>API: GET /jobs (Authorization: Bearer token)
    API->>JWT: verify(token)
    JWT-->>API: { userId, tenantId, role }
    API->>API: Extract tenantId from JWT
    API->>Database: findJobs({ tenantId })
    Database-->>API: Jobs[]
    API-->>Client: { data: Jobs[], meta: {...} }
```

## 2. Quote → Job → Invoice Flow

```mermaid
sequenceDiagram
    participant Dispatcher
    participant API
    participant QuotesService
    participant JobsService
    participant InvoicesService
    participant Database

    Note over Dispatcher,Database: Step 1: Create Quote
    Dispatcher->>API: POST /quotes
    API->>QuotesService: create(tenantId, dto)
    QuotesService->>Database: INSERT quote
    Database-->>QuotesService: Quote
    QuotesService-->>API: Quote
    API-->>Dispatcher: 201 Created

    Note over Dispatcher,Database: Step 2: Approve Quote
    Dispatcher->>API: POST /quotes/:id/approve
    API->>QuotesService: approve(tenantId, quoteId)
    QuotesService->>Database: UPDATE quote SET status='APPROVED'
    Database-->>QuotesService: Quote
    QuotesService-->>API: Quote
    API-->>Dispatcher: 200 OK

    Note over Dispatcher,Database: Step 3: Convert to Job
    Dispatcher->>API: POST /quotes/:id/convert-to-job
    API->>QuotesService: convertToJob(tenantId, quoteId)
    QuotesService->>Database: SELECT quote
    Database-->>QuotesService: Quote
    QuotesService->>JobsService: create({ quoteId, ...quoteData })
    JobsService->>Database: INSERT job
    Database-->>JobsService: Job
    JobsService-->>QuotesService: Job
    QuotesService->>Database: UPDATE quote SET convertedToJobId
    Database-->>QuotesService: Quote
    QuotesService-->>API: Job
    API-->>Dispatcher: 201 Created

    Note over Dispatcher,Database: Step 4: Complete Job
    Dispatcher->>API: PATCH /jobs/:id (status: COMPLETED)
    API->>JobsService: update(tenantId, jobId, { status: COMPLETED })
    JobsService->>Database: UPDATE job
    Database-->>JobsService: Job
    JobsService-->>API: Job
    API-->>Dispatcher: 200 OK

    Note over Dispatcher,Database: Step 5: Generate Invoice
    Dispatcher->>API: POST /invoices
    API->>InvoicesService: create(tenantId, { jobId })
    InvoicesService->>Database: SELECT job WITH lineItems
    Database-->>InvoicesService: Job
    InvoicesService->>Database: INSERT invoice WITH lineItems
    Database-->>InvoicesService: Invoice
    InvoicesService-->>API: Invoice
    API-->>Dispatcher: 201 Created
```

## 3. Asset Assignment Flow

```mermaid
sequenceDiagram
    participant Dispatcher
    participant API
    participant AssetsService
    participant JobsService
    participant Database

    Dispatcher->>API: POST /assets/:id/assign
    API->>AssetsService: assign(tenantId, assetId, dto)
    AssetsService->>Database: SELECT asset
    Database-->>AssetsService: Asset
    
    alt Asset not available
        AssetsService-->>API: 400 Asset not available
        API-->>Dispatcher: 400 Bad Request
    else Asset available
        AssetsService->>Database: SELECT job/site/user (validate target)
        Database-->>AssetsService: Target Entity
        AssetsService->>Database: BEGIN TRANSACTION
        AssetsService->>Database: UPDATE asset SET assignedTo, status=IN_USE
        AssetsService->>Database: INSERT asset_usage_history
        Database-->>AssetsService: Asset
        AssetsService->>Database: COMMIT
        AssetsService-->>API: Asset
        API-->>Dispatcher: 200 OK
    end
```

## 4. Form Submission Flow

```mermaid
sequenceDiagram
    participant Technician
    participant Mobile
    participant API
    participant FormsService
    participant Database

    Note over Technician,Database: Offline: Fill Form
    Technician->>Mobile: Fill form fields
    Mobile->>Mobile: Validate required fields
    Mobile->>Mobile: Save to SQLite
    
    Note over Technician,Database: Online: Submit Form
    Mobile->>API: POST /forms/:id/submit (Idempotency-Key)
    API->>FormsService: submit(tenantId, formId, fields)
    FormsService->>Database: SELECT form
    Database-->>FormsService: Form
    
    alt Form already submitted (idempotency check)
        FormsService-->>API: 200 OK (existing result)
        API-->>Mobile: 200 OK
    else First submission
        FormsService->>FormsService: Validate fields
        FormsService->>Database: UPDATE form SET status=SUBMITTED, fields
        Database-->>FormsService: Form
        FormsService->>Database: INSERT audit_log
        Database-->>FormsService: AuditLog
        FormsService-->>API: Form
        API-->>Mobile: 200 OK
        Mobile->>Mobile: Update SQLite syncStatus
    end
```

## 5. Document Upload Flow (Presigned URLs)

```mermaid
sequenceDiagram
    participant Mobile
    participant API
    participant FilesService
    participant S3
    participant Database

    Note over Mobile,Database: Step 1: Request Upload URL
    Mobile->>API: POST /documents/upload-url
    API->>FilesService: generatePresignedUrl(fileName, mimeType)
    FilesService->>S3: getSignedUrl(putObject)
    S3-->>FilesService: Presigned URL (expires in 15 min)
    FilesService-->>API: { uploadUrl, key }
    API-->>Mobile: { uploadUrl, key }

    Note over Mobile,Database: Step 2: Upload to S3
    Mobile->>S3: PUT uploadUrl (file binary)
    S3-->>Mobile: 200 OK

    Note over Mobile,Database: Step 3: Confirm Upload
    Mobile->>API: POST /documents (Idempotency-Key)
    API->>FilesService: confirm(key, metadata)
    FilesService->>Database: INSERT document
    Database-->>FilesService: Document
    FilesService-->>API: Document
    API-->>Mobile: 201 Created
    Mobile->>Mobile: Update SQLite uploaded=true
```

## 6. Schedule Conflict Detection

```mermaid
sequenceDiagram
    participant Dispatcher
    participant API
    participant ScheduleService
    participant JobsService
    participant Database

    Dispatcher->>API: POST /jobs (scheduledStart, scheduledEnd, technicianId)
    API->>JobsService: create(tenantId, dto)
    JobsService->>ScheduleService: checkConflict(technicianId, start, end)
    ScheduleService->>Database: SELECT jobs WHERE tech=? AND time overlaps
    Database-->>ScheduleService: Conflicting Jobs[]
    
    alt Conflict detected
        ScheduleService-->>JobsService: Conflict Error
        JobsService-->>API: 409 Conflict
        API-->>Dispatcher: 409 Conflict (list of conflicts)
    else No conflict
        ScheduleService-->>JobsService: OK
        JobsService->>Database: INSERT job
        Database-->>JobsService: Job
        JobsService-->>API: Job
        API-->>Dispatcher: 201 Created
    end
```

## 7. Optimistic Locking (Concurrent Updates)

```mermaid
sequenceDiagram
    participant User1
    participant User2
    participant API
    participant JobsService
    participant Database

    Note over User1,Database: Both users fetch same job
    User1->>API: GET /jobs/123
    API->>Database: SELECT job WHERE id=123
    Database-->>API: { id: 123, version: 5, status: SCHEDULED }
    API-->>User1: Job (version: 5)

    User2->>API: GET /jobs/123
    API->>Database: SELECT job WHERE id=123
    Database-->>API: { id: 123, version: 5, status: SCHEDULED }
    API-->>User2: Job (version: 5)

    Note over User1,Database: User1 updates first
    User1->>API: PUT /jobs/123 (status: IN_PROGRESS, version: 5)
    API->>JobsService: update(tenantId, 123, dto, version: 5)
    JobsService->>Database: UPDATE job SET status=?, version=6 WHERE id=? AND version=5
    Database-->>JobsService: { affected: 1, job: {..., version: 6} }
    JobsService-->>API: Job (version: 6)
    API-->>User1: 200 OK (version: 6)

    Note over User2,Database: User2 update fails (stale version)
    User2->>API: PUT /jobs/123 (status: COMPLETED, version: 5)
    API->>JobsService: update(tenantId, 123, dto, version: 5)
    JobsService->>Database: UPDATE job SET status=?, version=6 WHERE id=? AND version=5
    Database-->>JobsService: { affected: 0 }
    JobsService-->>API: 409 Conflict (version mismatch)
    API-->>User2: 409 Conflict { serverVersion: 6, clientVersion: 5 }
    User2->>API: GET /jobs/123 (re-fetch latest)
    API-->>User2: Job (version: 6)
```

## Notes

- All sequences include **tenant isolation** via `tenantId` from JWT
- **Idempotency keys** prevent duplicate operations from retries
- **Optimistic locking** prevents lost updates in concurrent scenarios
- **Presigned URLs** eliminate backend load for file uploads
- **Offline-first** mobile syncs queued operations when online
