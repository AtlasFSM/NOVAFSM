# Jobs/Work Orders Module

Complete implementation of the Jobs/Work Orders module for NoVaFSM backend.

## Overview

This module provides comprehensive job management functionality including:
- CRUD operations with pagination and filtering
- Job lifecycle management (draft → scheduled → in progress → completed/cancelled)
- Technician assignment with schedule conflict detection
- Real-time updates via WebSocket
- Optimistic locking for concurrent updates
- Location tracking (check-in/check-out)
- SLA management

## Directory Structure

```
jobs/
├── dto/
│   ├── assign-job.dto.ts       # DTO for assigning technicians
│   ├── complete-job.dto.ts     # DTO for completing jobs
│   ├── create-job.dto.ts       # DTO for creating jobs (with enums)
│   ├── query-jobs.dto.ts       # DTO for querying/filtering jobs
│   ├── start-job.dto.ts        # DTO for starting jobs
│   └── update-job.dto.ts       # DTO for updating jobs
├── index.ts                     # Barrel exports
├── jobs-gateway.ts              # WebSocket gateway
├── jobs.controller.ts           # REST API endpoints
├── jobs.module.ts               # Module configuration
├── jobs.service.ts              # Core business logic
└── schedule.service.ts          # Scheduling & conflict detection
```

## Features Implemented

### 1. Jobs Service (`jobs.service.ts`)

All required methods:
- ✅ `findAll()` - Paginated list with filters (status, techId, customerId, date range)
- ✅ `findOne()` - Get single job with all related data
- ✅ `create()` - Create job with auto-generated number (J-YYYY-######)
- ✅ `update()` - Update with optimistic locking (version check)
- ✅ `delete()` - Soft delete (prevents deletion of completed jobs)
- ✅ `assign()` - Assign technician with conflict detection
- ✅ `start()` - Start job (IN_PROGRESS status) with check-in location
- ✅ `complete()` - Complete job with check-out location
- ✅ `cancel()` - Cancel job with reason
- ✅ `checkScheduleConflict()` - Detect technician scheduling conflicts

### 2. Schedule Service (`schedule.service.ts`)

- ✅ `getSchedule()` - Get technician's calendar with conflict detection
- ✅ `checkConflicts()` - Check for time overlaps
- ✅ `getTechniciansAvailability()` - Get all technicians' schedules

### 3. WebSocket Gateway (`jobs-gateway.ts`)

Real-time events:
- ✅ `job.assigned` - Emitted when job assigned to technician
- ✅ `job.updated` - Emitted on job updates
- ✅ `job.statusChanged` - Emitted on status changes
- ✅ `job.deleted` - Emitted when job deleted

Room-based broadcasting:
- ✅ `tenant:{tenantId}` - All users in organization
- ✅ `tech:{techId}` - Specific technician
- ✅ `job:{jobId}` - Job-specific updates

### 4. REST API Endpoints (`jobs.controller.ts`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/jobs` | List jobs with filters | ADMIN, DISPATCHER, TECHNICIAN |
| GET | `/jobs/:id` | Get job details | ADMIN, DISPATCHER, TECHNICIAN |
| POST | `/jobs` | Create new job | ADMIN, DISPATCHER |
| PATCH | `/jobs/:id` | Update job (with If-Match header) | ADMIN, DISPATCHER, TECHNICIAN |
| DELETE | `/jobs/:id` | Delete job | ADMIN, DISPATCHER |
| POST | `/jobs/:id/assign` | Assign technician | ADMIN, DISPATCHER |
| POST | `/jobs/:id/start` | Start job | TECHNICIAN, ADMIN, DISPATCHER |
| POST | `/jobs/:id/complete` | Complete job | TECHNICIAN, ADMIN, DISPATCHER |
| POST | `/jobs/:id/cancel` | Cancel job | ADMIN, DISPATCHER |
| GET | `/jobs/schedule` | Get technician schedule | ADMIN, DISPATCHER, TECHNICIAN |

### 5. Data Models

Job model includes:
- ✅ Basic info: id, tenantId, number, title, description
- ✅ Status: DRAFT, SCHEDULED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
- ✅ Priority: LOW, MEDIUM, HIGH, URGENT
- ✅ Relations: customerId, siteId, quoteId, assignedTechnicianId
- ✅ Scheduling: scheduledStart, scheduledEnd, actualStart, actualEnd
- ✅ SLA: slaMinutes, slaDueAt
- ✅ Version control: version (optimistic locking)
- ✅ Location: checkInLocation, checkOutLocation (JSON)
- ✅ Notes: notes (public), internalNotes (private)
- ✅ Timestamps: createdAt, updatedAt, completedAt

## Usage Examples

### 1. Import the Module

Add to your `app.module.ts`:

```typescript
import { JobsModule } from './modules/jobs';

@Module({
  imports: [
    // ... other modules
    JobsModule,
  ],
})
export class AppModule {}
```

### 2. Create a Job

```typescript
POST /jobs
Content-Type: application/json
Authorization: Bearer <token>

{
  "customerId": "uuid",
  "siteId": "uuid",
  "title": "HVAC Maintenance",
  "description": "Annual HVAC system maintenance",
  "priority": "MEDIUM",
  "scheduledStart": "2025-01-15T09:00:00Z",
  "scheduledEnd": "2025-01-15T11:00:00Z",
  "slaMinutes": 120
}
```

### 3. Assign Technician

```typescript
POST /jobs/:id/assign
Content-Type: application/json
Authorization: Bearer <token>

{
  "technicianId": "uuid",
  "scheduledStart": "2025-01-15T09:00:00Z",
  "scheduledEnd": "2025-01-15T11:00:00Z"
}
```

### 4. Update Job (with Optimistic Locking)

```typescript
PATCH /jobs/:id
Content-Type: application/json
Authorization: Bearer <token>
If-Match: 1

{
  "status": "IN_PROGRESS",
  "notes": "Started work on-site"
}
```

### 5. Get Schedule

```typescript
GET /jobs/schedule?techId=uuid&from=2025-01-15T00:00:00Z&to=2025-01-22T23:59:59Z
Authorization: Bearer <token>
```

### 6. WebSocket Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000/jobs', {
  auth: {
    token: '<jwt-token>'
  }
});

// Listen for job assignments
socket.on('job.assigned', (data) => {
  console.log('Job assigned:', data.job);
});

// Listen for job updates
socket.on('job.updated', (data) => {
  console.log('Job updated:', data.job);
});

// Subscribe to specific job
socket.emit('job.subscribe', { jobId: 'uuid' });
```

## Security & Authorization

### Role-Based Access Control

- **ADMIN/DISPATCHER**: Full access to all operations
- **TECHNICIAN**: 
  - Can view only assigned jobs
  - Can update only assigned jobs
  - Can start/complete only assigned jobs
  - Cannot assign/delete jobs

### Optimistic Locking

All updates require `If-Match` header with current version number to prevent concurrent update conflicts.

## Key Features

### 1. Conflict Detection

Automatically checks for scheduling conflicts when:
- Creating a job with assigned technician
- Assigning a technician to a job
- Updating scheduled times

### 2. Auto-Generated Job Numbers

Format: `J-YYYY-######`
- Uses `SequenceService` for thread-safe number generation
- Resets annually
- Unique per tenant

### 3. SLA Tracking

- Set `slaMinutes` on job creation
- `slaDueAt` automatically calculated from `scheduledStart + slaMinutes`
- Track on-time completion

### 4. Location Tracking

- `checkInLocation`: Recorded when job starts
- `checkOutLocation`: Recorded when job completes
- Format: `{ lat: number, lng: number, timestamp: string }`

### 5. Quote Integration

- Create jobs from approved quotes
- Set `quoteId` to link job to original quote
- Validates quote status before creation

## Dependencies

- `@nestjs/common`
- `@nestjs/websockets`
- `@nestjs/jwt`
- `socket.io`
- `class-validator`
- `class-transformer`
- `@prisma/client`

## Notes

- All queries automatically filtered by `tenantId` via Prisma middleware
- WebSocket connections authenticated via JWT
- Schedule route positioned to avoid conflicts with `:id` route
- All dates should be in ISO 8601 format

## Testing

To test the module:

1. Ensure database is running with proper schema
2. Generate Prisma client: `npm run db:generate`
3. Run migrations: `npm run db:migrate:dev`
4. Start server: `npm run start:dev`
5. Access Swagger docs: `http://localhost:3000/api`

## Future Enhancements

Potential additions:
- Job templates
- Recurring jobs
- Job dependencies/sequencing
- Photo/file attachments
- Customer signature capture
- Time tracking integration
- Parts/inventory integration (already has InventoryUsage relation)
