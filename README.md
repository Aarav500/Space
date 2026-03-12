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
  platform/
    auth/             # Shared auth module (stub — design notes only)
    ui/               # Shared UI kit (stub — design notes only)
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

### Using Slack with Claude Code

The Claude bot Slack integration acts as the **front door** to this lab. Mention the bot in any Slack channel with your idea or bug report → it creates a GitHub issue in this repo with a structured summary → our workflows (`new-production-app`, `research-director`, `ops-playbook`, etc.) can be launched directly from that issue. No context is lost between the conversation and the code.

---

## Parallel Work with Git Worktrees

[Git worktrees](https://git-scm.com/docs/git-worktree) let you check out multiple branches simultaneously in separate directories — without cloning the repo again. Each worktree has its own working directory and index, so you can run different features or refactors in parallel without stashing or switching branches.

### Creating Worktrees

```bash
# From the main repo directory (fullstack-template/):

# Feature branch — backend work
git worktree add ../fullstack-template-feature-auth feature/auth

# Refactor branch — frontend work
git worktree add ../fullstack-template-refactor-ui refactor/ui-overhaul
```

This creates two sibling directories:

```
New folder/
  fullstack-template/                    ← main branch (original)
  fullstack-template-feature-auth/       ← feature/auth branch
  fullstack-template-refactor-ui/        ← refactor/ui-overhaul branch
```

### Using Worktrees with AI Agents

Each worktree can be opened as a **separate workspace** in Antigravity or Claude Code:

- **Antigravity:** Open each worktree folder as its own workspace. Each session sees only its own branch.
- **Claude Code:** Run `claude` from within the worktree directory. Use a different context mode per worktree (e.g., dev mode for the feature, review mode for the refactor).

### Managing Worktrees

```bash
# List all worktrees
git worktree list

# Remove a worktree after merging its branch
git worktree remove ../fullstack-template-feature-auth

# Prune stale worktree references
git worktree prune
```

### Rules

- **Never** run `git merge`, `git rebase`, or `git reset --hard` from within a worktree unless you fully understand the consequences.
- Each worktree should focus on **one branch** and **one feature/refactor**.
- Merge decisions are always made by a human from the main repo directory.

---

## Lab Modes

This repo operates as an **AI Production & Research Lab** — a structured environment where AI agents and humans collaborate to move from raw ideas to deployed software.

### Production Lab

Turn an approved spec into a tested, deploy-ready app in hours, not weeks. The `new-production-app` workflow (`.agent/workflows/new-production-app.md`) drives a five-phase pipeline — **PLAN → IMPLEMENT → REVIEW → VERIFY → DEPLOY-READY** — with human review gates at every stage. Backend work lands in `apps/api-node/`, frontend in `apps/web/`, and nothing ships until tests pass and security scans are clean.

### Research Lab

Explore frontier ideas before committing to code. The `research-director` workflow (`.agent/workflows/research-director.md`) takes a short topic — like *"NVIDIA 6G space compute fabric"* — and produces structured research: questions, landscape analysis, feasibility assessment, a full product spec, and a 3–6 month roadmap. Outputs land in `research/` and `specs/`, never touching application code.

### AI Orchestration

Three AI systems work together, each with a clear role:

- **Amazon Q Developer** — top-level orchestrator. Manages the AI-DLC lifecycle (Inception → Construction → Operations) following `.amazonq/rules/core-workflow.md`.
- **Antigravity** — multi-agent code editing and workflow execution. Runs production lab, research lab, security scans, and ops playbooks.
- **Claude Code** — focused coding, refactors, and reviews, powered by [everything-claude-code](https://github.com/affaan-m/everything-claude-code) skills (`/tdd`, `/build-fix`, `/code-review`, `/security-scan`).

---

## Scaling to Multiple Apps

This template is designed to be cloned and reused. Two patterns work well as your portfolio grows:

**Clone-per-app** — fork or clone `fullstack-template` for each new product. Each clone gets its own spec, plan, CI/CD pipeline, and deployment target. This keeps repos isolated and CI fast.

```
my-github/
  saas-product-a/       ← cloned from fullstack-template
  saas-product-b/       ← cloned from fullstack-template
  internal-tool-c/      ← cloned from fullstack-template
```

**Portfolio repo** — maintain a lightweight index repo that tracks all apps built from this template: their status, deploy targets, and links to their repos. Useful for teams managing multiple products.

```markdown
# Portfolio

| App | Repo | Status | Deploy Target |
|-----|------|--------|---------------|
| Product A | github.com/me/product-a | Production | ec2-prod-a |
| Product B | github.com/me/product-b | Staging | ec2-staging-b |
| Tool C | github.com/me/tool-c | Development | local |
```

Both patterns preserve the spec-driven, plan-first workflow — every app inherits the quality bars, security checklists, and AI orchestration rules baked into the template.

---

## Full Orchestration: Q + n8n + Antigravity + Claude

Four systems work together to move ideas from Slack conversations to running production code:

- **Amazon Q Developer** — top-level orchestrator. Follows `.amazonq/rules/core-workflow.md` (AI-DLC) to manage stage transitions: **Inception** (research & spec), **Construction** (build & test), **Operations** (security & maintenance).
- **n8n** — automation layer. Listens to GitHub issues and Slack messages, routes them by label into the right lab workflow (`research-director`, `new-production-app`, `security-scan`, `ops-playbook`), and notifies the team when results are ready.
- **Antigravity** — multi-agent coding engine. Executes research, production, security, and ops workflows inside this repo using coordinated agents that follow `.antigravity/rules.md`.
- **Claude Code** — senior engineer and reviewer. Performs focused coding, refactors, TDD, and code reviews using [everything-claude-code](https://github.com/affaan-m/everything-claude-code) skills (`/tdd`, `/build-fix`, `/code-review`, `/security-scan`).

```
┌──────────────┐     ┌──────────────┐
│  Slack Users │     │  Direct GH   │
└──────┬───────┘     └──────┬───────┘
       │                    │
       ▼                    ▼
┌──────────────────────────────────┐
│         GitHub Issues            │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│        n8n (router + AI)         │
└───┬──────────┬───────────┬───────┘
    │          │           │
    ▼          ▼           ▼
┌───────┐ ┌────────┐ ┌─────────┐
│ Q     │ │ Anti-  │ │ Claude  │
│ (DLC) │ │gravity │ │ Code    │
└───┬───┘ └───┬────┘ └────┬────┘
    │         │           │
    ▼         ▼           ▼
┌──────────────────────────────────┐
│     Repo (specs → code → tests) │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   GitHub Actions CI/CD → EC2    │
└──────────────────────────────────┘
```

---

## Platform Mode

This repo can act as a **platform seed** — a shared foundation from which multiple apps are derived.

### Shared Modules

The `platform/` directory holds candidate shared modules:

| Module | Path | Status |
|--------|------|--------|
| Auth | `platform/auth/` | Stub — design notes only |
| UI Kit | `platform/ui/` | Stub — design notes only |

See `platform/README.md` for details on each module's planned scope and integration surface.

> **Note:** No production code exists in `platform/` yet. The notes capture the target design for future extraction.

### Spinning Up a New App

The `platform-new-app` workflow (`.agent/workflows/platform-new-app.md`) guides the creation of a new app repo from this template:

1. **PLAN** — assess which platform modules the new app needs.
2. **IMPLEMENT** (conceptual) — produce a step-by-step markdown plan covering repo setup, module integration, CI/CD, and quality gates.
3. **REVIEW** — output the plan for human review.

The workflow does not clone repos or push code — it generates a human-followable checklist.

---

## Deployment

Push to `main` → GitHub Actions SSHs into EC2 → runs `infra/deploy/deploy.sh` → PM2 restarts services.

See `infra/ec2-setup.md` for server provisioning details.

---

## License

Private – not for redistribution.
