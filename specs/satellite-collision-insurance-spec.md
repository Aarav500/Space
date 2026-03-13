# App Spec: OrbitShield

> Real-time satellite collision risk analytics and micro-insurance marketplace

---

## 1. Product Summary

**Name:** OrbitShield
**Tagline:** Live collision risk pricing for every satellite, every hour.
**Target Users:** Small LEO constellation operators (10–200 sats), cubesat labs, early-stage space startups needing collision insurance for financing.

**Description:**
OrbitShield aggregates real-time orbital data from CelesTrak, Space-Track, ESA DISCOS, and NOAA space weather APIs to generate per-satellite collision risk scores updated hourly. An ML model (LSTM on historical CDM sequences + NOAA Kp/F10.7 features) produces 72-hour collision probability forecasts. Operators view a live dashboard of their fleet's risk posture, receive threshold-based alerts, and can purchase hourly parametric micro-coverage via Stripe checkout — backed by a licensed insurance partner. Phase 1 launches as a SaaS risk dashboard; Phase 2 adds the Stripe-powered insurance marketplace.

---

## 2. Core User Stories

| # | Role | Action | Outcome |
|---|------|--------|---------|
| 1 | Operator | Register my organization and add my satellite fleet by NORAD IDs | Fleet tracked in the dashboard with live risk scores |
| 2 | Operator | View a real-time risk dashboard showing per-satellite collision probability | Make informed maneuver decisions |
| 3 | Operator | See upcoming conjunction events ranked by severity | Prioritize which threats require action |
| 4 | Operator | Receive email/webhook alerts when Pc exceeds my configured threshold | React to threats before they escalate |
| 5 | Operator | View a 72-hour ML-predicted risk forecast for each satellite | Plan maneuvers proactively |
| 6 | Operator | Purchase hourly collision micro-coverage for a specific satellite via Stripe | Get insured instantly without broker delays |
| 7 | Operator | View a coverage dashboard showing active policies, costs, and payouts | Track insurance spend in real time |
| 8 | Operator | Receive automatic parametric payout when a CDM-confirmed collision event triggers | Get compensated without claims process |
| 9 | Operator | Access a REST API to fetch risk scores for integration into my ops tools | Automate fleet risk assessment |
| 10 | Admin | View platform-wide analytics: total satellites tracked, revenue, active policies | Monitor business health |
| 11 | Admin | Manage ML model versions and retrain on new CDM data | Continuously improve prediction accuracy |
| 12 | Admin | Configure insurance parameters: coverage limits, payout triggers, premium rates | Adjust marketplace pricing |

---

## 3. Data Model (Postgres)

### Table: `organizations`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| name | VARCHAR(255) | NOT NULL | Company name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Primary contact |
| stripe_customer_id | VARCHAR(255) | UNIQUE | Stripe customer reference |
| plan | VARCHAR(50) | DEFAULT 'free' | free / pro / enterprise |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| org_id | UUID | FK → organizations.id, NOT NULL | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt |
| role | VARCHAR(20) | DEFAULT 'member' | admin / member |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `satellites`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| org_id | UUID | FK → organizations.id, NOT NULL | |
| norad_id | INTEGER | UNIQUE, NOT NULL | NORAD Catalog Number |
| name | VARCHAR(255) | NOT NULL | Satellite name (from TLE) |
| orbit_type | VARCHAR(20) | NOT NULL | LEO / MEO / GEO / HEO |
| tle_line1 | TEXT | | Latest TLE line 1 |
| tle_line2 | TEXT | | Latest TLE line 2 |
| tle_epoch | TIMESTAMPTZ | | TLE epoch time |
| current_risk_score | DECIMAL(10,8) | DEFAULT 0 | Latest computed Pc (0–1) |
| risk_level | VARCHAR(20) | DEFAULT 'nominal' | nominal / elevated / warning / critical |
| last_updated | TIMESTAMPTZ | DEFAULT now() | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `conjunction_events`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| primary_sat_id | UUID | FK → satellites.id, NOT NULL | Our tracked satellite |
| secondary_norad_id | INTEGER | NOT NULL | Other object NORAD ID |
| secondary_name | VARCHAR(255) | | Name if known |
| tca | TIMESTAMPTZ | NOT NULL | Time of Closest Approach |
| miss_distance_km | DECIMAL(12,6) | NOT NULL | Predicted miss distance (km) |
| relative_velocity_kms | DECIMAL(10,4) | | Relative velocity (km/s) |
| collision_probability | DECIMAL(10,8) | NOT NULL | Pc from CDM or ML model |
| source | VARCHAR(50) | NOT NULL | space_track_cdm / celestrak_socrates / ml_prediction |
| cdm_id | VARCHAR(100) | | Original CDM message ID |
| raw_cdm | JSONB | | Full CDM payload |
| status | VARCHAR(20) | DEFAULT 'active' | active / passed / maneuver_executed |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `risk_snapshots`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| satellite_id | UUID | FK → satellites.id, NOT NULL | |
| snapshot_time | TIMESTAMPTZ | NOT NULL | Hourly snapshot time |
| risk_score | DECIMAL(10,8) | NOT NULL | Composite risk score |
| ml_prediction_72h | DECIMAL(10,8) | | ML-predicted Pc at +72 hours |
| kp_index | DECIMAL(4,2) | | NOAA Kp index at snapshot |
| f107_flux | DECIMAL(8,2) | | Solar radio flux F10.7 |
| active_conjunctions | INTEGER | DEFAULT 0 | Count of Pc > 1e-5 events |
| pricing_rate_cents | INTEGER | | Computed hourly coverage price (cents) |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `coverage_policies`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| org_id | UUID | FK → organizations.id, NOT NULL | |
| satellite_id | UUID | FK → satellites.id, NOT NULL | |
| stripe_subscription_id | VARCHAR(255) | UNIQUE | Stripe subscription reference |
| coverage_start | TIMESTAMPTZ | NOT NULL | |
| coverage_end | TIMESTAMPTZ | | NULL = ongoing |
| hourly_premium_cents | INTEGER | NOT NULL | Current hourly rate |
| max_payout_cents | BIGINT | NOT NULL | Maximum parametric payout |
| trigger_pc_threshold | DECIMAL(10,8) | DEFAULT 0.001 | Pc threshold for payout |
| status | VARCHAR(20) | DEFAULT 'active' | active / expired / triggered / cancelled |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `space_weather`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| observation_time | TIMESTAMPTZ | NOT NULL, UNIQUE | |
| kp_index | DECIMAL(4,2) | NOT NULL | Planetary K-index (0–9) |
| f107_flux | DECIMAL(8,2) | | 10.7 cm solar radio flux |
| storm_level | VARCHAR(10) | | G1–G5 or null |
| source | VARCHAR(50) | DEFAULT 'noaa_swpc' | |
| raw_data | JSONB | | Full NOAA response |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Relationships

- `users.org_id` → `organizations.id` (many-to-one)
- `satellites.org_id` → `organizations.id` (many-to-one)
- `conjunction_events.primary_sat_id` → `satellites.id` (many-to-one)
- `risk_snapshots.satellite_id` → `satellites.id` (many-to-one)
- `coverage_policies.org_id` → `organizations.id` (many-to-one)
- `coverage_policies.satellite_id` → `satellites.id` (many-to-one)

### Indexes

- `idx_satellites_norad_id` ON `satellites(norad_id)`
- `idx_conjunction_events_tca` ON `conjunction_events(tca)`
- `idx_conjunction_events_primary_sat` ON `conjunction_events(primary_sat_id, tca)`
- `idx_risk_snapshots_satellite_time` ON `risk_snapshots(satellite_id, snapshot_time DESC)`
- `idx_space_weather_time` ON `space_weather(observation_time DESC)`

---

## 4. API Endpoints

| Method | Path | Auth? | Request Body | Response | Notes |
|--------|------|-------|-------------|----------|-------|
| GET | /health | No | — | `{ ok: true }` | Health check |
| POST | /api/auth/register | No | `{ email, password, orgName }` | `{ user, org, token }` | Creates org + first user |
| POST | /api/auth/login | No | `{ email, password }` | `{ user, token }` | JWT token |
| GET | /api/satellites | Yes | — | `Satellite[]` | List org's satellites |
| POST | /api/satellites | Yes | `{ noradId, name? }` | `Satellite` | Add satellite by NORAD ID; auto-fetches TLE |
| DELETE | /api/satellites/:id | Yes | — | `{ ok: true }` | Remove satellite from fleet |
| GET | /api/satellites/:id/risk | Yes | — | `{ riskScore, riskLevel, forecast72h, conjunctions }` | Current risk + 72h ML forecast |
| GET | /api/satellites/:id/conjunctions | Yes | ?days=7 | `ConjunctionEvent[]` | Upcoming conjunctions |
| GET | /api/satellites/:id/risk-history | Yes | ?hours=168 | `RiskSnapshot[]` | Hourly risk time series |
| GET | /api/dashboard/overview | Yes | — | `{ totalSats, avgRisk, criticalCount, recentAlerts }` | Fleet summary |
| GET | /api/space-weather/current | Yes | — | `{ kp, f107, stormLevel }` | Latest NOAA data |
| GET | /api/space-weather/forecast | Yes | — | `SpaceWeatherForecast[]` | 3-day NOAA forecast |
| POST | /api/alerts/configure | Yes | `{ satelliteId?, pcThreshold, channels[] }` | `AlertConfig` | Set alert thresholds |
| GET | /api/alerts | Yes | — | `Alert[]` | Alert history |
| POST | /api/coverage/quote | Yes | `{ satelliteId, hours }` | `{ hourlyCents, totalCents, maxPayout }` | Get dynamic coverage price |
| POST | /api/coverage/checkout | Yes | `{ satelliteId, hours, stripePaymentMethodId }` | `{ policy, stripeSessionUrl }` | Create Stripe checkout for coverage |
| GET | /api/coverage/policies | Yes | — | `CoveragePolicy[]` | Active policies |
| GET | /api/v1/risk-score/:noradId | API Key | — | `{ noradId, riskScore, riskLevel, timestamp }` | Public API (metered billing) |

---

## 5. Screens / Components

### Screen: Landing Page (`/`)
- **Purpose:** Explain the product, show live stats, drive signups.
- **Layout:** Hero with animated orbital debris visualization → Live global risk ticker → Feature cards → Pricing → CTA.
- **Components:** `AnimatedOrbitHero`, `LiveRiskTicker`, `FeatureCard`, `PricingTable`, `CTAButton`.

### Screen: Dashboard (`/dashboard`)
- **Purpose:** Fleet-wide collision risk overview with actionable insights.
- **Layout:** Top stats bar (total sats, avg risk, critical alerts) → Risk grid of satellite cards → Activity feed.
- **Components:** `StatsBar`, `SatelliteRiskCard`, `RiskGauge`, `ActivityFeed`, `AlertBanner`.

### Screen: Satellite Detail (`/satellites/:id`)
- **Purpose:** Deep dive into one satellite's risk profile.
- **Layout:** Risk score hero → 72h forecast chart → Conjunction events table → Coverage status → 3D orbit viewer.
- **Components:** `RiskScoreHero`, `ForecastChart` (recharts), `ConjunctionTable`, `CoverageStatus`, `OrbitViewer` (Three.js).

### Screen: Space Weather (`/space-weather`)
- **Purpose:** Live NOAA space weather data and its impact on fleet risk.
- **Layout:** Current conditions panel → 3-day forecast chart → Storm impact analysis → Historical Kp timeline.
- **Components:** `WeatherConditionsPanel`, `ForecastChart`, `StormImpactCard`, `KpTimeline`.

### Screen: Coverage Marketplace (`/coverage`)
- **Purpose:** Browse, quote, and purchase hourly collision micro-coverage.
- **Layout:** Satellite selector → Dynamic pricing calculator → Coverage terms → Stripe checkout embed → Active policies list.
- **Components:** `SatelliteSelector`, `PricingCalculator`, `CoverageTerms`, `StripeCheckoutEmbed`, `PolicyList`.

### Screen: Settings (`/settings`)
- **Purpose:** Organization, billing, API keys, alert configuration.
- **Layout:** Tabbed: Profile | Billing (Stripe portal) | API Keys | Alerts | Team.
- **Components:** `SettingsTabs`, `StripePortalEmbed`, `APIKeyManager`, `AlertConfigForm`, `TeamManager`.

### Shared Components
- `Navbar` — Logo, nav links, org switcher, notification bell, user avatar dropdown.
- `Footer` — Links, status badge, legal.
- `RiskBadge` — Color-coded pill (green/yellow/orange/red) for risk level.
- `LoadingSpinner` — Orbital-themed loading animation.
- `ErrorBoundary` — Graceful error display with retry.

---

## 6. Non-functional Requirements & Definition of Done

### Non-functional
- [ ] Responsive design (mobile + desktop)
- [ ] Dashboard load < 3s on 3G
- [ ] All API responses < 500ms (except ML inference < 2s)
- [ ] Data pipeline ingestion latency < 5 minutes from source update
- [ ] WebSocket for real-time risk score updates on dashboard
- [ ] Proper error handling and user-friendly error messages
- [ ] Environment variables for all secrets (API keys, Stripe keys, DB credentials)
- [ ] Rate limiting on public API (100 req/min per API key)
- [ ] HTTPS everywhere; JWT auth with 1h expiry + refresh tokens

### Definition of Done
- [ ] All 12 user stories implemented and manually tested
- [ ] API endpoints return correct status codes and error formats
- [ ] Frontend wired to backend with loading/error states
- [ ] Data from CelesTrak, Space-Track, and NOAA SWPC ingesting on schedule
- [ ] ML risk scoring producing scores for all tracked satellites
- [ ] Stripe checkout flow working end-to-end in test mode
- [ ] Stripe metered billing accurately tracking per-satellite-per-hour usage
- [ ] Alert system delivering email notifications within 60s
- [ ] README updated with setup instructions (API keys, DB, Stripe)
- [ ] No console errors or warnings in production build
- [ ] Deployed to staging and smoke-tested
