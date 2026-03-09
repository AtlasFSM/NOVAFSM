# Runbook: Local Development Setup

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

## Steps

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 2. Set Up Backend

```bash
cd backend
cp .env.example .env        # Copy and edit environment variables
npm install
npx prisma migrate dev      # Apply migrations
npm run seed                # Seed test data (2 orgs, 40 customers, etc.)
npm run start:dev           # Start on port 3000
```

API docs available at: http://localhost:3000/api/docs

### 3. Set Up Web Dashboard

```bash
cd web-dashboard
cp .env.example .env.local  # Set NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev                 # Start on port 3001
```

### 4. Verify Setup

- Backend health: `curl http://localhost:3000/api/health`
- Web dashboard: open http://localhost:3001
- Login with seeded credentials (see `backend/prisma/seed.ts` for test accounts)

## Common Issues

**Prisma migration fails**: Ensure PostgreSQL container is running — `docker-compose ps`

**Port conflict**: Change `PORT` in `backend/.env` or use `npm run dev -- -p 3002` for web

**JWT key errors**: Ensure `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` are set in `backend/.env`
