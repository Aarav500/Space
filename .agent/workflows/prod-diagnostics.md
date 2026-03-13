---
description: Run production diagnostics against the live OrbitShield frontend and API — health, endpoints, CORS, synthetic browser test, EC2/Docker logs, external deps — then classify the root cause.
---

# Production Diagnostics

Run this workflow after a deploy (or on-demand) to detect issues with the live OrbitShield stack.

## Inputs

| Variable | Default | Description |
|----------|---------|-------------|
| `env` | `prod` | Environment label |
| `frontend_url` | `http://54.89.165.112` | Frontend URL |
| `api_url` | `http://54.89.165.112/api` | API base URL |
| `ec2_instance_id` | `i-0a2969b26c6b89544` | EC2 instance for SSM commands |
| `s3_bucket` | `spaceinsurance` | S3 bucket name |

---

## Step A — API Health Check

// turbo
1. Run:
```bash
curl -sS -o /tmp/health_response.json -w "\n%{http_code}\n%{time_total}" "${api_url}/health"
```

2. Parse the output:
   - Extract HTTP status code and latency from the `-w` output.
   - Parse the JSON body from `/tmp/health_response.json`.
   - Verify the response contains `ok: true` and the keys: `service`, `version`, `time`, `circuitBreakers`.
   - Check `circuitBreakers.celestrak` and `circuitBreakers.noaa` status values.

3. Classification:
   - If HTTP status is not `200`, or `ok` is not `true`, or JSON is malformed → mark **API_DOWN**.
   - If circuit breakers show `OPEN` → note which external service is tripped.
   - Record: `api_health_status`, `api_latency_ms`, `celestrak_breaker`, `noaa_breaker`.

---

## Step B — Key Endpoint Checks

// turbo
1. Run each check:
```bash
# Space weather (requires auth — but tests API reachability)
curl -sS -o /tmp/space_weather.json -w "\n%{http_code}\n%{time_total}" "${api_url}/space-weather/current"

# Satellites (requires JWT — expect 401 with JSON error, NOT HTML or timeout)
curl -sS -o /tmp/satellites.json -w "\n%{http_code}\n%{time_total}" "${api_url}/satellites"
```

2. For `/api/space-weather/current`:
   - If status is `401` → auth is working, API is reachable (PASS).
   - If status is `200` → endpoint returned data (PASS, check JSON has `kp`, `f107` keys).
   - If status is `5xx` or timeout → mark endpoint as failing.

3. For `/api/satellites`:
   - Expect `401` with JSON body `{ "error": "..." }`.
   - If status is `401` and body is JSON → PASS (auth gate working).
   - If status is anything else, or body is HTML → FAIL.

4. Record: `space_weather_status`, `space_weather_latency`, `satellites_status`, `satellites_latency`.

---

## Step C — CORS Preflight Check

// turbo
1. Run:
```bash
curl -sS -D /tmp/cors_headers.txt -o /dev/null \
  -X OPTIONS \
  -H "Origin: ${frontend_url}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  "${api_url}/satellites"
```

2. Inspect `/tmp/cors_headers.txt`:
   - Check for `Access-Control-Allow-Origin` header.
     - Must be `*` or must include `${frontend_url}`.
   - Check for `Access-Control-Allow-Methods` header.
     - Must include `POST`.
   - Check for `Access-Control-Allow-Headers` header.
     - Must include `Content-Type` and `Authorization`.

3. Classification:
   - If all headers present and correct → **CORS_OK**.
   - If `Access-Control-Allow-Origin` is missing or doesn't match → **CORS_MISCONFIGURED**.
   - If the entire request fails (connection refused) → **API_DOWN** (CORS is moot).

4. Record: `cors_status`, `cors_allow_origin`, `cors_allow_methods`.

---

## Step D — Synthetic Browser Test

> This step uses the browser tool (Playwright/headless) — skip if running in CI.

1. Open `${frontend_url}` in headless browser.

2. Wait for the main page to load (look for the dashboard layout or login page).

3. If a login page appears:
   - Note that auth is required; skip satellite tracking test.
   - Check browser console for `Failed to fetch`, CORS errors, or `net::ERR_*` errors.

4. If the dashboard loads:
   - Look for a satellite search/track input field.
   - Enter NORAD ID `25544` (ISS) and click the "Track" or "Add Satellite" button.
   - Wait up to 10 seconds for a network response.

5. Capture:
   - All browser console errors and warnings (filter out noisy React dev warnings).
   - Network trace: any failed requests (status 0, CORS blocked, 5xx).
   - Screenshot of the final state.

6. Classification:
   - If page loads with no console errors and network calls succeed → **SYNTHETIC_PASS**.
   - If `Failed to fetch` or CORS errors in console → **SYNTHETIC_FAIL** (note which).
   - If page doesn't load at all → **FRONTEND_DOWN**.

7. Record: `synthetic_status`, `console_errors[]`, `failed_network_requests[]`.

---

## Step E — EC2 / Docker Diagnostics (via SSM)

1. Run via SSM (requires AWS CLI configured with appropriate credentials):
```bash
# Check running containers
aws ssm send-command \
  --instance-ids "${ec2_instance_id}" \
  --document-name "AWS-RunShellScript" \
  --comment "OrbitShield diagnostics: docker ps" \
  --timeout-seconds 30 \
  --parameters 'commands=["docker ps --format \"table {{.Names}}\t{{.Status}}\t{{.Ports}}\""]' \
  --output text --query "Command.CommandId"
```

2. Wait for completion, then retrieve output:
```bash
aws ssm get-command-invocation \
  --command-id "<COMMAND_ID>" \
  --instance-id "${ec2_instance_id}" \
  --query "StandardOutputContent" --output text
```

3. Run additional diagnostics via SSM:
```bash
# API container logs (last 200 lines)
aws ssm send-command \
  --instance-ids "${ec2_instance_id}" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker logs orbitshield-api --tail=200 2>&1"]' \
  --output text --query "Command.CommandId"

# Nginx container logs (last 100 lines)
aws ssm send-command \
  --instance-ids "${ec2_instance_id}" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker logs orbitshield-nginx --tail=100 2>&1"]' \
  --output text --query "Command.CommandId"

# Environment variables in API container (redact secrets)
aws ssm send-command \
  --instance-ids "${ec2_instance_id}" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker exec orbitshield-api env | grep -E \"^(DATABASE_URL|JWT_SECRET|SPACE_TRACK|NOAA|CORS_ORIGIN|NODE_ENV|PORT)\" | sed -E \"s/(PASSWORD|SECRET|DATABASE_URL)=.*/\\1=***SET***/\""]' \
  --output text --query "Command.CommandId"
```

4. Analyze:
   - **Container status**: Are `orbitshield-api`, `orbitshield-web`, `orbitshield-nginx` all running?
   - **Crash loops**: Is any container restarting? Check uptime vs restart count.
   - **API logs**: Scan for `Error`, `ECONNREFUSED`, `ENOTFOUND`, stack traces, "ENV VAR missing".
   - **Nginx logs**: Scan for `502 Bad Gateway`, `upstream timed out`.
   - **Env vars**: Are `DATABASE_URL`, `JWT_SECRET`, `SPACE_TRACK_USERNAME`, `SPACE_TRACK_PASSWORD`, `NOAA_SWPC_BASE_URL`, `CORS_ORIGIN` all set (shown as `***SET***`)?

5. Record: `containers_running[]`, `containers_unhealthy[]`, `api_errors[]`, `nginx_errors[]`, `missing_env_vars[]`.

---

## Step F — External Dependency Checks

// turbo
1. Check NOAA SWPC connectivity:
```bash
curl -sS -o /dev/null -w "%{http_code}" "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
```
   - If `200` → **NOAA_OK**.
   - If timeout or non-200 → **NOAA_DOWN**.

2. Check Space-Track connectivity:
```bash
curl -sS -o /dev/null -w "%{http_code}" "https://www.space-track.org/ajaxauth/login"
```
   - If `200` or `401` or `405` (endpoint exists) → **SPACE_TRACK_REACHABLE**.
   - If timeout or connection refused → **SPACE_TRACK_DOWN**.

3. Check CelesTrak connectivity:
```bash
curl -sS -o /dev/null -w "%{http_code}" "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=JSON"
```
   - If `200` → **CELESTRAK_OK**.
   - If timeout or non-200 → **CELESTRAK_DOWN**.

4. Record: `noaa_status`, `space_track_status`, `celestrak_status`.

---

## Step G — Classification

Based on all results from Steps A–F, classify the **primary failure type**:

| Priority | Classification | Trigger condition |
|----------|---------------|-------------------|
| 1 | **API_DOWN** | Step A health check failed (non-200 or containers not running) |
| 2 | **DB_CONNECTION_ERROR** | API logs contain `ECONNREFUSED` to DB or `relation does not exist` |
| 3 | **MISSING_ENV_VARS** | Step E shows env vars not set |
| 4 | **CORS_ERROR** | Step C shows CORS misconfigured AND Step D shows CORS console errors |
| 5 | **FRONTEND_API_URL_MISMATCH** | Step D network trace shows requests going to wrong host (not `${api_url}`) |
| 6 | **EXTERNAL_API_FAILURE** | Step F shows Space-Track or NOAA or CelesTrak unreachable |
| 7 | **ALL_GREEN** | All steps pass |
| — | **UNKNOWN** | Multiple failures that don't match a single pattern |

For each classification, provide a 1–2 sentence root cause summary.

---

## Output

Generate a timestamped markdown report at `ops/prod-diagnostics-[YYYYMMDD-HHmmss].md`:

```markdown
# OrbitShield Production Diagnostics Report
**Timestamp:** [ISO 8601]
**Environment:** [env]
**Frontend:** [frontend_url]
**API:** [api_url]

## Summary

| Check | Status | Latency | Notes |
|-------|--------|---------|-------|
| API Health | ✅/❌ | Xms | ... |
| Space Weather Endpoint | ✅/❌ | Xms | ... |
| Satellites Endpoint | ✅/❌ | Xms | ... |
| CORS Preflight | ✅/❌ | — | ... |
| Synthetic Browser | ✅/❌/⏭️ | — | ... |
| Docker Containers | ✅/❌ | — | ... |
| Env Vars | ✅/❌ | — | ... |
| NOAA | ✅/❌ | — | ... |
| Space-Track | ✅/❌ | — | ... |
| CelesTrak | ✅/❌ | — | ... |

## Classification

**Primary:** [CLASSIFICATION]
**Root Cause:** [1–2 sentence summary]

## Suggested Next Steps

- [What to fix and how]
- [Whether auto-fix can handle it — reference `/prod-auto-fix` workflow]

## Raw Evidence

<details><summary>API Health Response</summary>
[JSON]
</details>

<details><summary>Docker PS Output</summary>
[output]
</details>

<details><summary>API Logs (last errors)</summary>
[filtered log lines]
</details>

<details><summary>Console Errors (Synthetic)</summary>
[errors]
</details>
```

After generating the report, print the file path and classification:
```
✅ Diagnostics complete: ops/prod-diagnostics-[timestamp].md
   Classification: [CLASSIFICATION]
```
