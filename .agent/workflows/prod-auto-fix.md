---
description: Auto-fix production issues detected by prod-diagnostics — proposes or applies safe config/CORS/env/deploy changes via PRs.
---

# Production Auto-Fix

Reads a diagnostics report from `/prod-diagnostics` and applies the appropriate fix based on the classification.

## Inputs

| Variable | Default | Description |
|----------|---------|-------------|
| `diagnostics_report_path` | *(required)* | Path to the diagnostics markdown report |
| `dry_run` | `true` | If `true`, only propose changes. If `false`, create branch + PR. |
| `frontend_url` | `http://54.89.165.112` | Expected frontend URL |
| `api_url` | `http://54.89.165.112/api` | Expected API URL |
| `repo_branch` | `main` | Base branch for PRs |

---

## Step 1 — Parse Diagnostics Report

1. Read the report at `${diagnostics_report_path}`.
2. Extract the **Classification** line (e.g., `CORS_ERROR`, `MISSING_ENV_VARS`).
3. Extract supporting evidence from the **Raw Evidence** sections.
4. If classification is `ALL_GREEN` → print "No issues to fix" and exit.

---

## Step 2 — Branch Based on Classification

### Branch A — CORS_ERROR

**Root cause:** The `CORS_ORIGIN` environment variable does not include the frontend origin, or CORS middleware is misconfigured.

1. **Inspect current config:**
   - Read `apps/api-node/src/app.js` lines 83–99 (CORS setup).
   - Verify it uses `process.env.CORS_ORIGIN.split(",")` pattern (it does).
   - Read `.github/workflows/deploy.yml` the `.env` write step to check `CORS_ORIGIN` value.

2. **Determine fix:**
   - If `CORS_ORIGIN` in deploy.yml is set to `*` → it should already allow all origins. The issue may be in nginx stripping headers. Check `nginx.conf` for missing `proxy_set_header` or header overwrites.
   - If `CORS_ORIGIN` is set to a specific list that doesn't include `${frontend_url}` → add it.
   - If the issue is Express rejecting the origin → ensure the origin matching logic is correct.

3. **Proposed changes:**

   **File: `.github/workflows/deploy.yml`** — update `CORS_ORIGIN` line:
   ```diff
   - CORS_ORIGIN=*
   + CORS_ORIGIN=http://54.89.165.112,http://localhost:3000
   ```
   *(Or keep `*` and investigate nginx.)*

   **File: `apps/api-node/src/app.js`** — optionally add CORS rejection logging:
   ```diff
   -     cb(new Error(`CORS: origin ${origin} not allowed`));
   +     console.warn(`CORS: origin ${origin} rejected. Allowed: ${allowedOrigins.join(", ")}`);
   +     cb(new Error(`CORS: origin ${origin} not allowed`));
   ```

4. **Apply:**
   - If `dry_run=true` → print the diff and suggested PR title.
   - If `dry_run=false` → create branch `fix/cors-origin-[timestamp]`, commit changes, push, open PR with title "fix: update CORS_ORIGIN to include production frontend".

---

### Branch B — FRONTEND_API_URL_MISMATCH

**Root cause:** The Next.js frontend was built with `NEXT_PUBLIC_API_URL` pointing to the wrong host.

1. **Inspect current config:**
   - Read `apps/web/src/lib/api.ts` line 1: `const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"`.
   - This is a **build-time** variable — it's baked into the JS bundle.
   - Read `apps/web/Dockerfile` or `apps/web/next.config.*` for build args.

2. **Determine fix:**
   - The issue is that `NEXT_PUBLIC_API_URL` was not set during the Docker build, so it defaulted to `http://localhost:4000`.
   - Since nginx proxies `/api` to the API container, the frontend should use a **relative URL** like `/api` or the public URL `http://54.89.165.112/api`.

3. **Proposed changes:**

   **File: `apps/web/src/lib/api.ts`**:
   ```diff
   - const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
   + const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
   ```
   Using `""` (empty string) makes `fetch` use relative URLs (e.g., `/api/satellites`), which works with the nginx proxy.

   **File: `.github/workflows/deploy.yml`** (Build step — add build arg):
   ```diff
     - name: Build & push Web image
       uses: docker/build-push-action@v5
       with:
         context: ./apps/web
         push: true
   +     build-args: |
   +       NEXT_PUBLIC_API_URL=
         tags: |
   ```

4. **Apply:**
   - If `dry_run=true` → print the diff.
   - If `dry_run=false` → create branch `fix/frontend-api-url-[timestamp]`, commit, push, open PR.

---

### Branch C — MISSING_ENV_VARS

**Root cause:** One or more required environment variables are not set in the API container.

1. **Identify missing vars:**
   - From diagnostics report, extract `missing_env_vars[]`.
   - Cross-reference with required vars from `docker-compose.yml` environment section.

2. **Proposed changes:**

   **File: `.github/workflows/deploy.yml`** — add missing vars to the `.env` write step:
   ```diff
     ENV_CONTENT=$(cat <<'LOCALEOF'
     ...existing vars...
   + MISSING_VAR_NAME=${{ secrets.MISSING_VAR_NAME }}
     LOCALEOF
     )
   ```

   **File: `docker-compose.yml`** — ensure the var is passed through:
   ```diff
     environment:
       ...existing vars...
   +   - MISSING_VAR_NAME=${MISSING_VAR_NAME}
   ```

3. **Apply:**
   - If `dry_run=true` → print which vars are missing and the proposed additions.
   - If `dry_run=false` → create branch `fix/missing-env-[varname]-[timestamp]`, commit, push, open PR.

---

### Branch D — API_DOWN (Crash)

**Root cause:** The API container is crashing or failing to start.

1. **Inspect crash reason:**
   - From diagnostics report, extract `api_errors[]` from Docker logs.
   - Look for the **first** error after container start (usually the root cause).

2. **Classify crash type:**

   | Error pattern | Likely cause | Fix |
   |---------------|-------------|-----|
   | `ECONNREFUSED` to DB host | Database unreachable | Check `DATABASE_URL`, Railway status |
   | `MODULE_NOT_FOUND` | Missing dependency | Rebuild image |
   | `SyntaxError` | Code error | Rollback to previous tag |
   | `EADDRINUSE` | Port conflict | Check compose port mappings |
   | `Cannot read properties of undefined` | Missing env var | → Branch C |

3. **Proposed changes:**
   - For config issues → propose the specific config fix as a PR.
   - For code issues → propose rolling back to the previous image tag:
     ```bash
     # On EC2 via SSM:
     cd /var/www/app
     TAG=<previous-sha> docker compose up -d api
     ```
   - **Never force-push or directly modify production files.** All changes go through PRs.

4. **Apply:**
   - If `dry_run=true` → print diagnosis and proposed fix.
   - If `dry_run=false` AND fix is config-only → create PR.
   - If fix requires rollback → only print the rollback command (manual step).

---

### Branch E — DB_CONNECTION_ERROR

**Root cause:** The database is unreachable or schema is invalid.

1. **Inspect:**
   - Check if `DATABASE_URL` is set (from Step E env output).
   - Check API logs for specific DB error: `ECONNREFUSED`, `ENOTFOUND`, `relation does not exist`, `authentication failed`.

2. **Actions (report only — no auto-fix):**
   - If `DATABASE_URL` is not set → redirect to Branch C (MISSING_ENV_VARS).
   - If DB host is unreachable → report Railway status, suggest checking Railway dashboard.
   - If schema error → report that migrations may not have run.
   - **No code changes.** Document for manual resolution.

---

### Branch F — EXTERNAL_API_FAILURE

**Root cause:** Space-Track, NOAA SWPC, or CelesTrak is down or unreachable.

1. **Inspect:**
   - From diagnostics, check `noaa_status`, `space_track_status`, `celestrak_status`.

2. **Actions (report only — no auto-fix):**
   - Note which service(s) are down.
   - The circuit breaker in `app.js` should handle this gracefully (check breaker status from health endpoint).
   - Suggest:
     - Wait and retry (external services recover on their own).
     - If persistent, add fallback/cache logic (future enhancement).
   - **No code changes.**

---

### Branch G — UNKNOWN

**Root cause:** Cannot determine a single root cause from the evidence.

1. **Actions (report only):**
   - Include all raw evidence from the diagnostics report.
   - List all failing checks.
   - Suggest manual investigation starting with Docker logs.
   - **No code changes.**

---

## Step 3 — Generate Auto-Fix Report

Generate a timestamped report at `ops/prod-auto-fix-[YYYYMMDD-HHmmss].md`:

```markdown
# OrbitShield Production Auto-Fix Report
**Timestamp:** [ISO 8601]
**Diagnostics Source:** [diagnostics_report_path]
**Dry Run:** [true/false]

## Classification

**Type:** [CLASSIFICATION]
**Branch:** [A/B/C/D/E/F/G]

## Proposed Changes

| File | Change | Reason |
|------|--------|--------|
| [file] | [summary] | [why] |

### Diffs

[Full diff blocks for each file change]

## PR Status

- **Branch:** [branch name or "N/A (dry run)"]
- **PR Title:** [title or "N/A"]
- **PR URL:** [url or "Not created (dry_run=true)"]

## Manual Steps Required

- [Any steps that cannot be automated]
```

Print summary:
```
✅ Auto-fix complete: ops/prod-auto-fix-[timestamp].md
   Classification: [CLASSIFICATION]
   Action: [PR opened / Changes proposed (dry run) / No fix needed / Manual intervention required]
```
