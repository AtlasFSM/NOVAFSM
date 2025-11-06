# Contributing to NoVaFSM

Thank you for your interest in contributing to NoVaFSM! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/NOVAFSM.git`
3. Add upstream remote: `git remote add upstream https://github.com/AtlasFSM/NOVAFSM.git`
4. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install
   
   # Web Dashboard
   cd web-dashboard && npm install
   
   # Mobile
   cd mobile && npm install
   ```

## Development Workflow

1. **Sync with upstream**: 
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes** following our code style guidelines

4. **Run tests**:
   ```bash
   # Backend
   npm run test:unit
   npm run test:integration
   npm run test:cov  # Must maintain ≥80% coverage
   
   # Web
   npm run test
   npm run test:e2e
   ```

5. **Build locally**:
   ```bash
   # Backend
   npm run build
   
   # Web
   npm run build
   
   # Mobile
   npx expo export --platform web
   ```

6. **Commit changes** following commit guidelines

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open Pull Request** to `main` branch

## Branching Strategy

- `main`: Production-ready code
- `feature/*`: New features
- `fix/*`: Bug fixes
- `docs/*`: Documentation updates
- `refactor/*`: Code refactoring
- `test/*`: Test improvements
- `chore/*`: Maintenance tasks

## Commit Guidelines

We follow Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```
feat(jobs): add schedule conflict detection

Implement logic to detect overlapping job schedules for the same technician.

Closes #123
```

```
fix(auth): prevent token refresh race condition

Add mutex lock around token refresh to prevent multiple simultaneous refreshes.

Fixes #456
```

## Testing Requirements

### Backend

- **Unit Tests**: ≥80% coverage required
  ```bash
  npm run test:unit -- --coverage
  ```
- **Integration Tests**: Critical flows must have e2e tests
  - Auth flow
  - Multi-tenant isolation
  - Quote → Job → Invoice
  - Schedule conflicts
  - File uploads

- Test files: `*.spec.ts` (unit), `*.e2e-spec.ts` (integration)
- Use Jest + Supertest
- Mock external dependencies

### Web Dashboard

- **Unit Tests**: Component tests with React Testing Library
  ```bash
  npm run test
  ```
- **E2E Tests**: Playwright for critical user flows
  ```bash
  npm run test:e2e
  ```

### Mobile

- **Type Checking**: Must pass TypeScript checks
  ```bash
  npm run type-check
  ```

## Pull Request Process

1. **PR Title**: Follow commit message format
   ```
   feat(module): brief description
   ```

2. **PR Description**: Include:
   - Summary of changes
   - Related issue numbers
   - Screenshots (for UI changes)
   - Breaking changes (if any)

3. **Checklist**:
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] Code builds without errors
   - [ ] Tests pass locally
   - [ ] Coverage ≥80% maintained
   - [ ] No console errors/warnings
   - [ ] Follows code style guidelines

4. **Review Process**:
   - At least 1 approval required
   - All CI checks must pass
   - No merge conflicts
   - Coverage gates met

5. **Merge**: Squash and merge (maintain clean history)

## Code Style

### TypeScript/JavaScript

- **Linting**: ESLint with project config
  ```bash
  npm run lint
  npm run lint -- --fix
  ```

- **Formatting**: Prettier
  ```bash
  npm run format
  ```

- **Conventions**:
  - Use functional components (React)
  - Prefer `const` over `let`
  - Use async/await over promises
  - Descriptive variable names
  - Single responsibility principle
  - Keep functions small (<50 lines)

### Backend (NestJS)

- **Structure**:
  ```
  src/modules/
    feature/
      dto/
      entities/
      feature.controller.ts
      feature.service.ts
      feature.service.spec.ts
      feature.module.ts
  ```

- **Naming**:
  - Services: `FeatureService`
  - Controllers: `FeatureController`
  - DTOs: `CreateFeatureDto`, `UpdateFeatureDto`
  - Entities: `Feature`

- **Practices**:
  - Use dependency injection
  - Validate DTOs with class-validator
  - Use Prisma for database access
  - Handle errors with NestJS exceptions
  - Add Swagger decorators for API docs

### Frontend (React/Next.js)

- **Structure**:
  ```
  src/
    app/           # Next.js 14 App Router pages
    components/    # Reusable components
      ui/          # Shadcn/UI components
    lib/           # Utilities
    hooks/         # Custom hooks
  ```

- **Naming**:
  - Components: PascalCase (`CustomerCard.tsx`)
  - Hooks: camelCase, prefix with `use` (`useCustomers.ts`)
  - Utils: camelCase (`formatDate.ts`)

- **Practices**:
  - Server Components by default
  - Client Components when needed (`'use client'`)
  - Use TypeScript for all files
  - Use Shadcn/UI components
  - Use Tailwind for styling
  - Use React Query for data fetching

### Mobile (React Native)

- **Practices**:
  - Offline-first with SQLite
  - Use React hooks
  - Type all components with TypeScript
  - Follow React Native best practices
  - Test on both iOS and Android

## Documentation

- Update README.md for major features
- Add JSDoc comments for public APIs
- Update OpenAPI spec for API changes
- Create migration guides for breaking changes
- Update CHANGELOG.md

## Questions?

Open an issue for questions or join our discussions.

Thank you for contributing to NoVaFSM! 🚀
