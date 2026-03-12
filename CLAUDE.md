# CLAUDE.md – Master AI Context

> This file describes the project architecture, conventions, and agent roles.
> AI agents (Claude Code, Antigravity) MUST read this before making changes.

---

## Stack & Architecture

| Layer | Technology | Details |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript | Tailwind CSS for styling, Framer Motion for animations |
| Backend | Node.js + Express | REST API, modular route structure |
| Database | PostgreSQL | Primary data store, connected via `pg` driver |
| File Storage | Amazon S3 | Binary/media file uploads |
| Deployment | GitHub Actions → AWS EC2 | `deploy.sh` + PM2 for process management |

---

## Folder Layout

```
fullstack-template/
  apps/
    web/              → Next.js frontend (App Router, TypeScript, Tailwind, Framer Motion)
    api-node/         → Express REST API (Node.js)
    api-fastapi/      → Reserved for future FastAPI backend
  infra/
    ec2-setup.md      → EC2 provisioning documentation
    deploy/
      deploy.sh       → Bash deploy script (git pull, build, PM2 restart)
  prompts/            → Reusable AI prompts (spec, schema, API, frontend)
  specs/              → Per-app specification documents
  plans/              → Per-app implementation plan documents
  .antigravity/
    rules.md          → Repository-wide Antigravity rules
  .agent/
    workflows/        → Antigravity agent workflows
  .github/
    workflows/        → GitHub Actions CI/CD pipelines
  CLAUDE.md           → This file (master AI context)
  spec-template.md    → Template for creating new app specs
  package.json        → Root monorepo config with concurrently
  README.md           → Project documentation
```

---

## Conventions

1. **TypeScript preferred** – Use TypeScript for all new code where reasonable (frontend always, backend when practical).
2. **REST endpoints** – All API routes live under `/api` prefix.
3. **No secrets committed** – All credentials and secrets read from environment variables (`.env` files are gitignored).
4. **Naming** – Use kebab-case for files/folders, PascalCase for React components, camelCase for JS/TS variables and functions.
5. **Imports** – Prefer absolute imports with `@/` alias in the Next.js frontend.
6. **Error handling** – All API endpoints return consistent error format: `{ error: string, details?: any }`.

---

## AI Working Rules

> These rules MUST be followed by any AI agent working in this repo.

1. **Always read context first** – Before making large changes, read `spec-template.md`, the relevant spec in `specs/`, and the relevant plan in `plans/`.
2. **Explore → Plan → Code → Verify → Document** – Follow this loop for all non-trivial changes.
3. **No new top-level folders** – Do not create folders outside the established layout without explicit permission.
4. **Spec-driven** – Every feature must trace back to a spec document.
5. **Plan-first** – Create or update a plan in `plans/` before implementing substantial changes.
6. **Review-driven** – Stop and request review at major milestones (spec draft, plan, backend complete, frontend complete, CI changes).

---

## Agent Roles

### 1. Planning Agent

**Responsibility:** Research, spec creation, plan creation, and architecture decisions.

- Reads the app idea and expands it into a full spec using `spec-template.md`.
- Creates implementation plans in `plans/`.
- Produces review artifacts at spec and plan stages.

**Constraints:**
- Does NOT write application code.
- Does NOT modify `infra/`, `.github/`, or deployment configs.
- Must stop for review after producing spec and plan drafts.

---

### 2. Backend Agent

**Responsibility:** Implement API endpoints, database models, and server-side logic.

- Works exclusively in `apps/api-node/`.
- Reads the approved spec and plan before coding.
- Implements Express routes, middleware, and database queries.
- Creates and runs tests for implemented endpoints.

**Constraints:**
- Only modifies files in `apps/api-node/`.
- Does NOT touch frontend code, infra, or CI/CD configs.
- Reads `DATABASE_URL` and other config from environment variables only.
- Must stop for review after completing backend implementation.

---

### 3. Frontend Experience Agent

**Responsibility:** Build high-quality UI/UX using Next.js, Tailwind, and Framer Motion.

- Works exclusively in `apps/web/`.
- Reads the approved spec and plan before coding.
- Implements pages, components, layouts, and API integrations.
- Targets top-tier modern SaaS design: strong typography, visual hierarchy, grid discipline, micro-interactions.
- Ensures responsive design (mobile + desktop).

**Constraints:**
- Only modifies files in `apps/web/`.
- Does NOT touch backend code, infra, or CI/CD configs.
- Must wire API calls to the backend endpoints defined in the spec.
- Must stop for review after completing frontend implementation.

---

### 4. Test & CI Agent

**Responsibility:** Verify quality, run tests, and maintain CI/CD pipelines.

- Runs existing tests and reports results.
- Checks `.github/workflows/deploy-ec2.yml` and `infra/deploy/deploy.sh` for correctness.
- Proposes CI/CD changes as review artifacts before modifying.

**Constraints:**
- Does NOT implement new features.
- Must propose CI/CD changes as a plan and wait for approval before editing pipeline files.
- Must run the full test suite after any changes.
