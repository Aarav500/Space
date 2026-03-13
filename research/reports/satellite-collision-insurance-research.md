# Research Report: Real-Time Satellite Collision Insurance Marketplace

> **Topic:** Real-time satellite collision insurance marketplace using NASA, ESA, Copernicus, Celestrak, and NOAA APIs for space startups — live risk pricing per satellite per hour with Stripe checkout and ML collision predictions.
>
> **Date:** 2026-03-12
> **Workflow:** `.agent/workflows/research-director.md`

---

## § Research Questions

*(Full questions saved to `research/notes/satellite-collision-insurance-questions.md`)*

| Category | Key Question |
|----------|-------------|
| Technical | Which public APIs provide near-real-time conjunction / TLE / space-weather data, and at what cadence? |
| Technical | Can a useful collision-probability model be built solely on public CDM + TLE + Kp-index data? |
| Economic | Is there a viable unit-economics model for hourly micro-coverage priced by collision probability? |
| Regulatory | Must direct insurance sales be licensed, or can this be structured as risk-analytics SaaS + licensed partner? |
| Product | Who is the first customer — smallsat operator, cubesat lab, or launch broker? |

---

## § Landscape

### Key Players

| Player | Type | Relevance |
|--------|------|-----------|
| **Space-Track.org** (18th SDS, US Space Force) | Government data provider | Primary source of Conjunction Data Messages (CDMs) with covariance; requires registration; free; ~daily updates |
| **CelesTrak** (Dr. T.S. Kelso) | Non-profit data aggregator | Free GP/TLE data in JSON/XML; SOCRATES conjunction reports; no rate limit auth; near-real-time updates |
| **ESA Space Debris Office / DISCOS** | Agency (EU) | DISCOSweb REST API — 40K+ tracked objects; Conjunction Prediction Service (CPS); free registration |
| **Copernicus Data Space Ecosystem** | Agency data platform (EU) | Sentinel hub APIs for Earth observation; not directly orbital-debris focused but useful for atmospheric density context |
| **NOAA Space Weather Prediction Center (SWPC)** | Government data provider | JSON API for Kp index, solar flux F10.7, geomagnetic storm alerts; critical input for drag-induced collision risk in LEO |
| **NASA CARA (Conjunction Assessment Risk Analysis)** | Agency program | Processes CDMs for NASA missions; researching AI/ML for collision avoidance; public data via Space-Track |
| **LeoLabs** | Commercial SSA ($50M+ revenue 2024) | Global phased-array radar network; covers ~75% of LEO active sats; AI threat analysis; TraCSS contributor |
| **Kayhan Space** | Commercial SSA/STC | Satcat Product Suite (Feb 2025); autonomous safety-of-flight alerts; operator-to-operator coordination |
| **Slingshot Aerospace** | Commercial SSA/AI | Beacon collision-avoidance platform; Global Sensor Network; $27M USAF contract (Jan 2026); Sovereign SSA |
| **ExoAnalytic Solutions** | Commercial SSA | Optical telescope network for GEO/MEO tracking |
| **Relm Insurance** | Specialty insurer (space) | Covers orbital debris collision; designed for new-space startups; adaptable policies |
| **AXA XL / Global Aerospace** | Traditional insurer | Long-standing space underwriter; blanket constellation policies |
| **Munich Re / Allianz AGCS** | Reinsurer / insurer | Capacity providers for space risk; AI underwriting analytics |
| **TATA AIG** | Insurer (India) | Entered satellite in-orbit third-party liability in 2024 |
| **Assure Space** (now defunct) | Former insurer | Exited LEO collision coverage ~2020 due to unquantifiable debris risk — cautionary tale |

### Key Technologies

| Technology | Status | Notes |
|------------|--------|-------|
| **TLE / GP elements** (SGP4 propagation) | Production | Standard orbital data; ~1 km positional accuracy; free via CelesTrak / Space-Track |
| **Conjunction Data Messages (CDMs)** | Production | CCSDS standard; includes covariance, miss distance, Pc; ~daily from Space-Track |
| **SOCRATES** (CelesTrak) | Production | Automated conjunction screening for top-N close approaches; free; updated every 8 hours |
| **NOAA WAM-IPE Model** | Production (2023 upgrade) | Whole Atmosphere neutral density — critical for accurate LEO drag prediction |
| **LSTM / bi-LSTM for CDM sequences** | Research → Prototype | Forecasts Pc evolution over CDM series; validated at Cranfield University; papers 2024 |
| **Physics-Informed Neural Networks (PINNs)** | Research | Embeds Keplerian / J2 physics into neural network loss function; faster + more robust than pure data-driven |
| **Bayesian Deep Learning** | Research | Quantified uncertainty on Pc predictions; critical for insurance pricing |
| **ESA CREAM** | Prototype (ground) | Collision Risk Estimation and Automated Mitigation; planned for in-orbit use |
| **Stripe Meters API** (March 2024) | Production | Usage-based billing entity; meter events → per-unit pricing; up to 1000 RPS ingestion |
| **Stripe Billing Credits** (Nov 2024) | Production | Prepaid usage credits; useful for pre-purchasing coverage hours |

### Open Problems & Constraints

- **TLE accuracy ceiling:** TLEs lack covariance; ~1 km positional error makes standalone Pc unreliable — must fuse with CDMs or augment via ML uncertainty quantification.
- **CDM access limitations:** Detailed CDMs (with covariance) require Space-Track account + mission affiliation; public CDMs may lack critical fields.
- **Untracked objects:** Only ~36K objects tracked; an estimated 1M+ fragments untracked — any model underestimates true risk.
- **Fault attribution impossibility:** Insurers cannot determine if a satellite failure is from collision vs. internal fault — making pure collision policies difficult to settle.
- **Insurance licensing:** Selling "insurance" in the US requires state licensing (MGA, surplus lines); must use a licensed fronting partner or structure as "risk analytics SaaS."
- **Low data density:** Actual collision events are extremely rare (2 known: Iridium-33/Cosmos-2251 in 2009, Yunhai-1 02/Zenit fragment in 2021), making ML training data sparse — must rely on near-miss CDMs as proxy.
- **Space weather unpredictability:** Geomagnetic storms (G4/G5) can rapidly increase atmospheric drag and alter orbits, causing sudden spikes in collision probability that may outpace model update frequency.

### Sources

- [NASA CARA Program](https://www.nasa.gov/cara) — Conjunction assessment operations
- [Space-Track.org](https://www.space-track.org) — CDM & TLE data source
- [CelesTrak](https://celestrak.org) — GP data, SOCRATES conjunction reports
- [ESA Space Debris Office / DISCOSweb](https://discosweb.esoc.esa.int) — European debris database API
- [NOAA SWPC Data Service](https://services.swpc.noaa.gov) — Space weather JSON API
- [Copernicus Data Space](https://dataspace.copernicus.eu) — Sentinel data APIs
- [Congruence Market Insights (2024)](https://www.congruencemarketinsights.com) — Space insurance market report ($551M → $1.14B by 2032, CAGR 9.5%)
- [Spherical Insights (2024)](https://www.sphericalinsights.com) — SSA market $1.78B → $2.54B by 2035
- [Insurance Business Magazine (2024)](https://www.insurancebusinessmag.com) — Space insurance losses, pricing trends
- [Stripe Docs — Metered Billing](https://docs.stripe.com/billing/subscriptions/usage-based) — Meters API, per-unit pricing
- [Cranfield University (2024)](https://dspace.lib.cranfield.ac.uk) — LSTM for CDM collision probability forecasting
- [arXiv:2024 — Diffusion models for orbital uncertainty](https://arxiv.org) — Probabilistic position uncertainty forecasting

---

## § Feasibility

### Current Stack Fit

| Capability | Stack Component | Fit? | Notes |
|------------|----------------|------|-------|
| Web UI / Dashboard | Next.js + Tailwind + Framer Motion | ✅ | Real-time risk dashboard, satellite portfolio view, 3D orbit visualization (Three.js) |
| REST API | Express + Node.js | ✅ | API gateway for data aggregation, risk scoring, Stripe webhooks |
| Data Storage | PostgreSQL | ✅ | Satellite registry, CDM history, pricing snapshots, policy records |
| File / Blob Storage | Amazon S3 | ✅ | CDM archives, ML model artifacts, policy documents (PDFs) |
| Deployment | EC2 + GitHub Actions | ✅ | API server + scheduled data-ingestion workers |
| External Data Ingestion | Cron workers + CelesTrak/Space-Track/NOAA APIs | ⚠️ | Need scheduled polling (every 1–8 hrs); Space-Track requires registration + rate limiting |
| ML Inference | Node.js + ONNX Runtime / Python microservice | ⚠️ | Lightweight ONNX models can run in Node; heavier training requires Python sidecar |
| Metered Billing | Stripe Meters API + Subscriptions | ✅ | Per-satellite-per-hour pricing natively supported via meter events |
| Insurance Compliance | Licensed partner / MGA agreement | ❌ | Cannot sell insurance directly without licensing; must partner or structure as SaaS analytics |

### v1 Product Ideas

#### Idea 1: **OrbitShield — Collision Risk Analytics Dashboard (SaaS)**

- **What:** A real-time dashboard showing per-satellite collision risk scores, fusing CelesTrak TLE, Space-Track CDM, and NOAA space weather data, with ML-enhanced probability forecasts.
- **User:** Small LEO constellation operators (10–200 satellites) who cannot afford LeoLabs-tier SSA contracts.
- **Technical feasibility:** **High** — relies on free public APIs + open-source SGP4 propagator + lightweight LSTM model on historical CDMs.
- **Biggest unknowns:** Accuracy of ML model on TLE-only data without proprietary ephemeris; customer willingness to pay for "another dashboard."

#### Idea 2: **OrbitShield Pro — Dynamic Risk Pricing + Stripe Checkout for Hourly Micro-Coverage**

- **What:** Everything in Idea 1 + live risk pricing that generates a per-satellite, per-hour "coverage quote" backed by a licensed insurance partner, purchasable via Stripe checkout.
- **User:** Cubesat operators, university programs, and early-stage constellation startups who need collision coverage for financing but cannot get traditional policies.
- **Technical feasibility:** **Medium** — all tech in Idea 1 is feasible; the insurance partnership and parametric trigger design are the hard parts.
- **Biggest unknowns:** Finding a willing MGA/surplus-lines insurer to underwrite parametric micro-policies; regulatory approval timeline; actuarial validation of ML-driven pricing.

#### Idea 3: **OrbitShield Data API — Collision Risk Scoring as a Service**

- **What:** A REST API that accepts a NORAD catalog ID and returns a real-time collision risk score, upcoming conjunction events, and recommended maneuver windows.
- **User:** Satellite operations software vendors who want to embed collision risk into their own platforms.
- **Technical feasibility:** **High** — pure API, no UI needed; monetized via Stripe metered billing (per-API-call).
- **Biggest unknowns:** Competing against free data from Space-Track; differentiation requires genuinely superior ML predictions.

### Recommendation

> **Build Idea 1 first (SaaS dashboard), with the architecture designed to support Idea 2 (Stripe-powered micro-coverage) as a Phase 2 upgrade.**

Rationale:
1. Idea 1 validates the core data pipeline and ML model without insurance licensing risk.
2. Revenue starts from SaaS subscriptions (Stripe monthly billing) while insurance partnership is negotiated.
3. The dashboard creates a customer base that can be upsold to Idea 2 once parametric coverage is live.
4. Idea 3 (API) is a natural byproduct of Idea 1's backend and can launch in parallel.

---

## § Spec Summary

The full product spec for **OrbitShield** has been written to:

📄 [`specs/satellite-collision-insurance-spec.md`](file:///c:/New%20folder/fullstack-template/specs/satellite-collision-insurance-spec.md)

It covers:
- Product summary and target users
- 12 core user stories
- PostgreSQL data model (7 tables)
- 18 API endpoints
- 6 screens with component breakdowns
- Non-functional requirements and definition of done

---

## § Roadmap

### Month 1–2: Foundation

| Milestone | Description | Metric |
|-----------|-------------|--------|
| Data pipeline MVP | Ingest TLEs (CelesTrak), CDMs (Space-Track), Kp index (NOAA SWPC) on 1-hour cron | 3 data sources ingesting, <5 min latency |
| Postgres schema | Satellites, conjunction_events, risk_snapshots, space_weather tables | Schema deployed, seeded with 1000+ objects |
| Risk scoring engine v0.1 | Rule-based Pc scoring from CDM fields (miss distance, relative velocity) | Scores generated for 100% of ingested CDMs |
| Auth + Stripe setup | User registration, org management, Stripe subscription (flat monthly) | First paid test subscriber |

### Month 3–4: Core Product

| Milestone | Description | Metric |
|-----------|-------------|--------|
| ML model v1 | LSTM trained on historical CDM sequences → 72-hour Pc forecast | AUROC > 0.85 on held-out conjunction events |
| Real-time dashboard | Per-satellite risk cards, conjunction timeline, space weather overlays | <3s page load, live updates via WebSocket |
| Alerting system | Email + webhook alerts when Pc exceeds configurable threshold | Alert delivery <60s from data ingestion |
| Stripe metered billing | Per-satellite-per-hour usage tracking via Stripe Meters API | Accurate billing for test fleet of 50 satellites |

### Month 5–6: Launch & Iterate

| Milestone | Description | Metric |
|-----------|-------------|--------|
| Insurance partner signed | MGA or surplus-lines agreement for parametric micro-coverage | Signed LOI with 1 underwriter |
| Parametric coverage checkout | Stripe checkout flow for hourly coverage; parametric trigger on CDM Pc > threshold | 10 policies sold |
| 3D orbit visualization | Three.js globe with satellite positions + conjunction event markers | <16ms frame time (60fps) |
| Public API launch | `/api/v1/risk-score/{norad_id}` with metered billing | 5 API consumers integrated |
| Product-market fit survey | NPS survey + usage analytics | NPS > 40; monthly active orgs > 20 |

### Experiments & Validations

| Hypothesis | Experiment | Success Criteria |
|------------|-----------|-----------------|
| Small operators will pay for collision risk analytics | Offer free 30-day trial to 50 cubesat labs | >15% convert to paid ($99/mo plan) |
| ML model outperforms rule-based scoring | A/B test predictions vs. actual CDM warnings | Model reduces false positives by >30% |
| Hourly micro-coverage has demand | Survey 100 small operators on willingness to pay per-satellite-per-hour | >25% express strong interest at <$5/sat/hr |
| Space weather data improves risk accuracy | Add Kp/F10.7 features to ML model vs. CDM-only baseline | AUROC improvement > 0.03 |

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Space-Track rate limits or access changes | Medium | Cache aggressively; diversify to ESA DISCOS + CelesTrak as fallbacks |
| Insurance licensing delays | High | Launch as SaaS-only (Idea 1); defer coverage sales until licensed partner secured |
| ML model insufficient accuracy on public data | Medium | Partner with LeoLabs for higher-fidelity data; explore transfer learning from simulated conjunction datasets |
| Competitor launches similar product | Medium | First-mover advantage in "Stripe for space insurance" niche; focus on developer-friendly API + UX |
| Catastrophic conjunction event causes policy loss spike | Low | Cap per-event exposure; reinsurance agreement with Munich Re or Swiss Re |
| Space-Track data is US-government controlled (ITAR concerns) | Low | Legal review; GP/TLE data is generally uncontrolled; CDM covariance may have restrictions for non-US customers |

---

*Report finalized 2026-03-12. Ready for spec implementation via `.agent/workflows/new-production-app.md`.*
