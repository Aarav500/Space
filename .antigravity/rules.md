# Antigravity Repository Rules

> These rules govern all AI agent behavior within this repository.

---

## 1. Respect the Folder Layout

- All frontend code lives in `apps/web/`.
- All backend code lives in `apps/api-node/`.
- Infra and deploy configs live in `infra/` and `.github/workflows/`.
- Specs go in `specs/`, plans in `plans/`, prompts in `prompts/`.
- **Do NOT create new top-level folders** without explicit user permission.

## 2. Spec-Driven Development

- Every feature or app must have a spec document in `specs/`.
- Use `spec-template.md` as the starting point for all new specs.
- The spec must be reviewed and approved before implementation begins.

## 3. Plan-First Execution

- Before implementing any substantial change, create a plan in `plans/`.
- Plans should reference the corresponding spec and break work into 10–20 discrete tasks.
- The plan must be reviewed and approved before coding begins.

## 4. Review-Driven Execution

Stop and request user review at these checkpoints:

1. **Spec Draft** – After creating or updating a spec document.
2. **Implementation Plan** – After creating or updating a plan document.
3. **Backend Complete** – After finishing backend implementation for a milestone.
4. **Frontend Complete** – After finishing frontend implementation for a milestone.
5. **CI/CD Changes** – Before modifying any deployment or CI/CD configuration.

## 5. No Unauthorized Changes

- **Never** change deployment targets (EC2 host, SSH keys, PM2 config) without permission.
- **Never** add new environment variables to CI/CD without permission.
- **Never** modify `.antigravity/rules.md` or `CLAUDE.md` without permission.
- **Never** commit secrets, API keys, or credentials to the repository.

## 6. Code Quality

- Prefer TypeScript where reasonable.
- Follow the naming conventions in `CLAUDE.md`.
- All API endpoints must have error handling.
- Frontend must be responsive (mobile + desktop).
- Use environment variables for all configuration — no hardcoded values.
