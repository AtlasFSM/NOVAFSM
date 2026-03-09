# Release Skill

## Purpose
Prepare and execute a NoVaFSM release: version bump, changelog, Docker build, and deployment checklist.

## Workflow

1. **Determine release type** (patch/minor/major) based on changes since last tag
2. **Update version** in root `package.json`, `backend/package.json`, `web-dashboard/package.json`
3. **Generate changelog** from git log since last tag:
   - Group by: Features, Bug Fixes, Breaking Changes
4. **Build and verify Docker images**:
   ```bash
   docker build -t novafsm-backend:VERSION ./backend
   docker build -t novafsm-web:VERSION ./web-dashboard
   ```
5. **Run database migration check**:
   ```bash
   cd backend && npx prisma migrate deploy --dry-run
   ```
6. **Create git tag**: `git tag -a vVERSION -m "Release vVERSION"`
7. **Deployment checklist**:
   - [ ] Environment variables updated in target environment
   - [ ] Database migrations applied
   - [ ] Redis cache flushed if schema changed
   - [ ] Smoke test: `/api/health` returns 200
   - [ ] Smoke test: login flow works end-to-end
