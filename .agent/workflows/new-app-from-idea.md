---
description: Generate a full-stack app from a short idea — spec, plan, backend, frontend, deploy-ready
---

# New App from Idea

> **Input:** `idea` — a short description of the app you want to build (1–3 sentences).
>
> **Output:** A production-shaped full-stack app with backend, frontend, CI/CD — ready to push.

---

## Step a) Load Context

Read the following files to understand the project structure and rules:

1. `CLAUDE.md` — stack, conventions, agent roles
2. `spec-template.md` — spec format
3. `.antigravity/rules.md` — repo rules (spec-driven, plan-first, review-driven)
4. `prompts/00-product-definition.md` — how to create a spec

Confirm you understand the stack (Next.js + Express + Postgres + S3 → EC2).

---

## Step b) Create Spec

// turbo

Follow the instructions in `prompts/00-product-definition.md`:

1. Take the `idea` input.
2. Create `specs/<slug>-spec.md` using `spec-template.md` as the format.
3. Fill ALL 6 sections:
   - Product summary
   - Core user stories (5–10)
   - Data model (Postgres tables with columns/types/constraints)
   - API endpoints (method, path, auth, request/response)
   - Screens / components (page layouts and component breakdowns)
   - Non-functional requirements & Definition of Done

**Artifact:** Spec Draft
**⏸️ STOP — Wait for user review before proceeding.**

---

## Step c) Create Plan

// turbo

Follow the instructions in `prompts/01-schema-design.md` and `prompts/02-api-backend.md`:

1. Create `plans/<slug>-plan.md` with 10–20 implementation tasks.
2. Group tasks into phases:
   - **Phase 1: Schema & DB** — migrations, seed data
   - **Phase 2: Backend API** — routes, middleware, auth
   - **Phase 3: Frontend Layout** — shared components, navigation
   - **Phase 4: Frontend Pages** — page implementations, API wiring
   - **Phase 5: Polish** — animations, responsive, error states
   - **Phase 6: Testing** — API tests, build verification
3. Each task should be specific and testable.

**Artifact:** Implementation Plan
**⏸️ STOP — Wait for user review before proceeding.**

---

## Step d) Backend Implementation

Follow `prompts/02-api-backend.md`:

1. Work ONLY in `apps/api-node/`.
2. Create migrations in `apps/api-node/src/migrations/`.
3. Implement Express routes in `apps/api-node/src/routes/`.
4. Register routes in `src/index.js`.
5. Add input validation and error handling.
6. Use `src/db.js` for all database queries.
7. Read all config from environment variables.
8. Write basic tests if time permits.

**Artifact:** Backend Changes & Tests
**⏸️ STOP — Wait for user review before proceeding.**

---

## Step e) Frontend Experience

Follow `prompts/03-frontend-ui.md`:

1. Work ONLY in `apps/web/`.
2. Build shared components in `src/components/`:
   - Navbar, Footer, Button, Card, Input, etc.
3. Implement pages in `src/app/`:
   - Follow the spec screen definitions
   - Handle loading, error, and empty states
4. **Design quality targets:**
   - Modern SaaS aesthetic — dark theme, glassmorphism, gradients
   - Strong typography hierarchy (Inter font)
   - Consistent spacing (Tailwind scale)
   - Framer Motion animations:
     - Page enter: fade + slide up
     - Cards: hover lift
     - Buttons: press scale
     - Lists: staggered reveal
5. Wire all pages to backend API endpoints.
6. Use `NEXT_PUBLIC_API_URL` from env for API base URL.
7. Responsive design (mobile + desktop).

**Artifact:** UI & UX Summary
**⏸️ STOP — Wait for user review before proceeding.**

---

## Step f) CI/CD Sanity Check

1. Review `.github/workflows/deploy-ec2.yml` — confirm it still works with the new app.
2. Review `infra/deploy/deploy.sh` — confirm build commands are correct.
3. If changes are needed:
   - Produce a **CI/CD Update Plan** artifact describing proposed changes.
   - **⏸️ STOP — Wait for approval before editing any CI/CD files.**
4. Run the frontend build (`npm run build` in `apps/web`) to verify no errors.
5. Start the backend (`node apps/api-node/src/index.js`) and hit `/health` to verify.

---

## Step g) Final Summary

Produce a **Ready to Push Summary** artifact containing:

1. **Files Changed** — high-level list of new/modified files
2. **API Endpoints** — table of implemented endpoints
3. **Screens** — list of pages with descriptions
4. **Local Dev Commands:**
   ```bash
   npm install
   cd apps/web && npm install
   cd ../api-node && npm install
   cd ../..
   npm run dev
   ```
5. **Manual Test Checklist** — steps to verify each feature works
6. **Remaining TODOs** — any known gaps or risks

**⏸️ STOP — Final review. After approval, commit and push to deploy.**
