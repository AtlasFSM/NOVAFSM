# API Versioning Strategy

## Overview

NoVaFSM API uses **URI versioning** with a semantic versioning approach for managing API changes.

## Versioning Scheme

### URI Format
```
https://api.novafsm.com/api/v{major}/resource
```

Example:
```
https://api.novafsm.com/api/v1/jobs
https://api.novafsm.com/api/v2/jobs
```

### Semantic Versioning

Version format: `v{MAJOR}.{MINOR}.{PATCH}` (URI only includes MAJOR)

- **MAJOR**: Breaking changes (new URI path)
- **MINOR**: Backwards-compatible new features (same URI)
- **PATCH**: Backwards-compatible bug fixes (same URI)

Example:
- `v1.0.0` → `v1.1.0`: Added new optional fields (backwards compatible)
- `v1.1.0` → `v2.0.0`: Changed response structure (breaking change, new URI)

## Backwards Compatibility Rules

### Compatible Changes (No version bump required)
- Adding new optional fields to requests
- Adding new fields to responses
- Adding new endpoints
- Adding new optional query parameters
- Relaxing validation rules

### Breaking Changes (Require new major version)
- Removing or renaming fields
- Changing field types
- Changing required/optional status of fields
- Changing response structure
- Changing error codes
- Removing endpoints
- Changing authentication mechanism

## Current Version: v1

### Base URL
```
Production:  https://api.novafsm.com/api/v1
Development: http://localhost:3000/api/v1
```

### Supported Endpoints

#### Authentication
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/logout`

#### Organizations
- `GET /organizations`
- `GET /organizations/:id`
- `POST /organizations`
- `PUT /organizations/:id`

#### Users
- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

#### Customers
- `GET /customers`
- `GET /customers/:id`
- `POST /customers`
- `PUT /customers/:id`
- `DELETE /customers/:id`

#### Sites
- `GET /sites`
- `GET /sites/:id`
- `POST /sites`
- `PUT /sites/:id`
- `DELETE /sites/:id`

#### Jobs
- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs`
- `PUT /jobs/:id`
- `DELETE /jobs/:id`
- `POST /jobs/:id/assign`
- `POST /jobs/:id/check-in`
- `POST /jobs/:id/check-out`

#### Quotes
- `GET /quotes`
- `GET /quotes/:id`
- `POST /quotes`
- `PUT /quotes/:id`
- `DELETE /quotes/:id`
- `POST /quotes/:id/approve`
- `POST /quotes/:id/reject`
- `POST /quotes/:id/convert-to-job`

#### Invoices
- `GET /invoices`
- `GET /invoices/:id`
- `POST /invoices`
- `PUT /invoices/:id`
- `POST /invoices/:id/send`
- `POST /invoices/:id/mark-paid`

#### Assets
- `GET /assets`
- `GET /assets/:id`
- `POST /assets`
- `PUT /assets/:id`
- `DELETE /assets/:id`
- `POST /assets/:id/assign`
- `POST /assets/:id/release`

#### Documents
- `GET /documents`
- `GET /documents/:id`
- `POST /documents`
- `POST /documents/upload-url`
- `DELETE /documents/:id`

#### Forms
- `GET /forms`
- `GET /forms/:id`
- `POST /forms`
- `PUT /forms/:id`
- `POST /forms/:id/submit`

#### Pricing
- `GET /pricing/items`
- `GET /pricing/items/:id`
- `POST /pricing/items`
- `PUT /pricing/items/:id`
- `DELETE /pricing/items/:id`

#### Schedule
- `GET /schedule`
- `GET /schedule/conflicts`

#### Time & Expense
- `GET /time-entries`
- `POST /time-entries`
- `POST /time-entries/:id/clock-out`
- `GET /expenses`
- `POST /expenses`

## Version Lifecycle

### Support Timeline
- **Current version (v1)**: Fully supported, receives all updates
- **Previous version (n-1)**: Security fixes only, 12-month deprecation period
- **Older versions**: Unsupported, may be decommissioned

### Deprecation Process

1. **Announcement**: 6 months before deprecation
   - Email to API consumers
   - Deprecation headers in responses:
     ```
     Deprecation: true
     Sunset: Sat, 31 Dec 2025 23:59:59 GMT
     Link: <https://docs.novafsm.com/api/v2>; rel="successor-version"
     ```

2. **Migration Period**: 6-12 months
   - Both old and new versions available
   - Migration guide published
   - Breaking change documentation

3. **Deprecation**: After migration period
   - Old version responds with 410 Gone
   - Redirect to new version documentation

## Request/Response Headers

### Version Header (Optional)
```http
Accept-Version: v1
```

If not provided, defaults to latest stable version.

### Response Headers
```http
API-Version: v1.2.0
Deprecation: false
```

## Error Handling

### Version Not Found
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "API_VERSION_NOT_FOUND",
  "message": "API version v3 does not exist",
  "availableVersions": ["v1", "v2"]
}
```

### Version Deprecated
```http
HTTP/1.1 410 Gone
Content-Type: application/json
Sunset: Sat, 31 Dec 2025 23:59:59 GMT

{
  "error": "API_VERSION_DEPRECATED",
  "message": "API version v1 has been deprecated",
  "migrationGuide": "https://docs.novafsm.com/migration/v1-to-v2",
  "currentVersion": "v2"
}
```

## Changelog Between Versions

### v1.0.0 (2025-01-15) - Initial Release
- Complete Field Service Management API
- Multi-tenant architecture
- RESTful endpoints for all modules
- WebSocket support for real-time updates

## Best Practices for API Consumers

1. **Always specify version** in the URI
2. **Monitor deprecation headers** in responses
3. **Subscribe to API changelog** for updates
4. **Test against new versions** before migration
5. **Use semantic versioning** in your integration
6. **Handle version errors** gracefully

## Future Versions (Planned)

### v2 (TBD)
- GraphQL support
- Batch operations
- Advanced filtering with JSON:API spec
- Webhook subscriptions
