# Research Questions: Real-Time Satellite Collision Insurance Marketplace

> Phase A – Clarify (Research Director Workflow)

---

## Technical Questions

1. Which public APIs provide real-time or near-real-time conjunction data (CDMs, TLEs, GP elements)?
2. What data formats do Space-Track, CelesTrak SOCRATES, and ESA DISCOS expose — and what are their rate limits / auth requirements?
3. How do NOAA SWPC space weather products (Kp index, solar flux, neutral density) quantitatively affect LEO satellite drag and therefore collision risk?
4. Which ML architectures (LSTM, PINN, Bayesian, Diffusion) have been validated for collision probability forecasting, and on what datasets?
5. Can a useful collision-probability model be built using only publicly available TLE + CDM data, without proprietary ephemeris?
6. What latency is achievable for a "live risk score per satellite per hour" given the update cadence of each data source?

## Economic Questions

1. What is the current size and growth rate of the satellite insurance market? (~$551M–$4.5B in 2024, CAGR 5.8–9.8%)
2. What does a typical LEO satellite in-orbit insurance policy cost? ($500K–$1M/sat for LEO; >$200M for GEO)
3. How many LEO constellation operators self-insure vs. buying coverage, and why?
4. Is there a viable unit-economics model for hourly micro-coverage priced dynamically by collision probability?
5. What would a parametric payout trigger look like — conjunction event CDM above a threshold Pc?

## Regulatory / Policy Questions

1. Is offering "insurance" subject to state-level insurance commissioner licensing (Managing General Agent, surplus lines)?
2. Can this be structured as a "risk analytics SaaS + referral" to avoid becoming a licensed insurer?
3. What data-use restrictions apply to Space-Track, ESA DISCOS, and NOAA data for commercial resale?
4. Do ITU / FCC licensing obligations for satellite operators already require proof of collision insurance?
5. What are the ITAR / EAR implications of combining US government orbital data with commercial pricing for non-US customers?

## Product Questions

1. Who is the first customer: small LEO constellation operator, university cubesat program, or launch broker?
2. What is the minimum viable product — risk dashboard, or full checkout-to-policy flow?
3. Can Stripe metered billing (Meters API, per-unit pricing) model "per satellite per hour" coverage?
4. What is the competitive moat — proprietary ML model accuracy, data aggregation breadth, or speed-to-quote?
5. How do existing SSA providers (LeoLabs, Slingshot, Kayhan) and insurers (Relm, AXA XL, Munich Re) currently interact?
