# Fullstack Template

A **spec-driven, plan-first** full-stack application template with integrated AI workflow automation.

## Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion |
| **Backend** | Node.js · Express (REST API) |
| **Database** | PostgreSQL (primary) · Amazon S3 (file storage) |
| **Infra** | GitHub Actions → AWS EC2 via `deploy.sh` + PM2 |
| **AI Workflow** | Claude Code · Antigravity agents · Spec → Plan → Code → Verify loop |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm
- PostgreSQL (local or remote)

### Install

```bash
# Root dependencies (concurrently)
npm install

# Frontend
cd apps/web && npm install

# Backend
cd apps/api-node && npm install
```

### Run Locally

```bash
# Start both frontend and backend concurrently
npm run dev

# Or individually:
npm run dev:web   # Next.js on http://localhost:3000
npm run dev:api   # Express on http://localhost:4000
```

---

## Folder Layout

```
fullstack-template/
  apps/
    web/              # Next.js + React + Tailwind + Framer Motion
    api-node/         # Node/Express REST API
    api-fastapi/      # (placeholder – future FastAPI backend)
  infra/
    ec2-setup.md      # EC2 provisioning notes
    deploy/
      deploy.sh       # Remote deploy script (called by CI)
  prompts/            # Reusable AI prompts for spec/plan/code generation
  specs/              # Per-app spec files
  plans/              # Per-app implementation plans
  .antigravity/       # Antigravity repo rules
  .agent/workflows/   # Antigravity agent workflows
  .github/workflows/  # GitHub Actions CI/CD
```

---

## AI Usage

This template is designed for **AI-assisted development**:

1. **Claude Code** – Explore → Plan → Code → Verify → Document loop.
2. **Antigravity Workflows** – Run the `new-app-from-idea` workflow to go from a short idea to a production-shaped app with review gates.
3. **Prompt Files** – Structured prompts in `prompts/` guide each stage (product definition, schema, API, frontend).

### Quick Start with AI

```bash
# In Antigravity, run the "New App from Idea" workflow:
# Input: your app idea (e.g. "a task manager with team collaboration")
# The workflow will generate spec → plan → backend → frontend with review stops.
```

---

## Deployment

Push to `main` → GitHub Actions SSHs into EC2 → runs `infra/deploy/deploy.sh` → PM2 restarts services.

See `infra/ec2-setup.md` for server provisioning details.

---

## License

Private – not for redistribution.
