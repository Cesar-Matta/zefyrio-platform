# Zefyrio — Aviation Weather & Drone Safety HUD

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16.2-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet_Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-2D2D2D?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**A real-time aviation weather intelligence platform and heads-up display (HUD) for drone pilots, paragliders, skydivers, helicopter operators, and fixed-wing aviators.**

[Demo](#) · [Live Preview](#) · [Roadmap](./PLAN.md)

</div>

---

## Project Overview

Zefyrio is a **Progressive Web App** that aggregates live meteorological, geomagnetic, and airspace data into a cockpit-style interface. The platform uses GPS or IP triangulation to deliver hyper-local weather intelligence and AI-driven **GO / CAUTION / NO-GO** flight safety decisions — all in real time.

Designed with an "Aero HUD Protocol" philosophy: data-dense, dark-mode native, and built for mobile-first use in the field.

---

## Key Features

### Cockpit Telemetry
- **Multi-Profile Engine** — drone, helicopter, paraglider, parachute, fixed-wing — each with its own safety thresholds.
- **AI GO/NO-GO Status** — rule-based decision engine over wind, gusts, visibility, KP index, NOTAMs, SIGMETs, and TFR.
- **Vertical Wind Profile** — charts wind at 10 m / 80 m / 120 m / 180 m for pre-flight briefings.
- **Surface Wind Compass** with gust amplitude.
- **GPS Satellite Status** + **KP-Index** (NOAA Space Weather).
- **Weather Cards** — temperature, feels-like, rain probability, cloud cover.
- **Flight Window** — sunrise / sunset / civil twilight.

### Maps & Airspace
- **Interactive Leaflet Map** with Google Maps vector / satellite base layers + CartoDB dark mode.
- **ADS-B Live Traffic** — real-time aircraft positions via OpenSky Network (15s refresh).
- **METAR Smart Airport Markers** — VFR / MVFR / IFR / LIFR color-coded with TAF and NOTAM data.
- **Airspace Layers** — Class E/F/G, Restricted, Danger, Prohibited, CTR, TMA, Military, Gliding, Hang Gliding, RC airfields, Parachuting zones — all rendered from OpenAIP GeoJSON with color-coded polygons and hover tooltips.
- **RainViewer radar overlay** — precipitation radar tiles with automatic path discovery.
- **GOES IR Clouds** — Band 13 (Clean Infrared) satellite imagery via Iowa Environmental Mesonet (IEM).
- **GOES Visible Clouds** — Band 02 (Visible) satellite imagery via IEM.
- **Double-click anywhere** on the map to set that point as your "home" location and re-sync telemetry.
- **8-Day Forecast Bar** pinned to the bottom of the map view.
- **HUD Crosshair Overlay** — subtle cockpit-style targeting reticle.

### Alerts
- **NOTAM Alerts** — Notices to Airmen for the pilot's location.
- **SIGMET / AIRMET Alerts** — significant meteorological warnings with severity parsing.
- **No-Fly Zones** — TFR + airspace warnings filtered by pilot profile with distance calculation.
- **Push Notifications** (Web Push, VAPID) for status deterioration (scaffold ready).

### Weather & Forecast
- **METAR Board** — aviation weather reports parsed and human-readable.
- **8-Day Forecast Bar** — daily summary across an extended horizon.
- **24h Drone Outlook** — hourly wind, UV index, humidity, visibility cards. Each card colour-codes the next 24h against drone-safety tiers (ok / warn / crit) with sparkline + peak indicator + plain-language tip.
- **Radar Map** — dedicated radar component with additional overlays.

### Flight Log
- **Session Logger** — start, finish, conditions snapshot per flight.
- **Flight Analytics** — aggregated stats across sessions (donut charts, sparklines, profile usage).
- **Push Subscription Manager** UI.

### App Platform
- **PWA Installable** — iOS & Android home-screen install, offline-ready service worker.
- **Internationalization** — English & Spanish (`LocaleToggle`).
- **Theme Toggle** — light / dark / system.
- **Supabase Auth** — email + OAuth, SSR-aware via `@supabase/ssr`.
- **Dev Bypass Mode** — skip Supabase entirely while iterating (`NEXT_PUBLIC_DEV_BYPASS_AUTH=true`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (App Router, Turbopack) |
| **Runtime** | React 19.2 |
| **Language** | TypeScript 5 |
| **State** | Zustand 5 |
| **Auth / DB** | Supabase (PostgreSQL + Auth + SSR) |
| **Maps** | Leaflet 1.9 + React-Leaflet 5 |
| **Styling** | Tailwind CSS v4 + PostCSS |
| **Icons** | Lucide React |
| **Push** | web-push (VAPID) |
| **Weather APIs** | Open-Meteo, NOAA SWPC, AviationWeather.gov, RainViewer |
| **Satellite Imagery** | Iowa Environmental Mesonet (IEM) — GOES-East Fulldisk Band 13 (IR) & Band 02 (Visible) |
| **Airspace** | OpenAIP (dynamic bbox queries) + custom GeoJSON for Colombia |
| **ADS-B** | OpenSky Network |
| **Deployment** | Vercel-ready |

---

## Project Architecture

```
zefyrio/
├── public/
│   ├── data/co_asp.geojson      # Colombia airspaces (static fallback)
│   ├── sw.js                    # Service worker (PWA)
│   ├── offline.html             # Offline fallback page
│   └── manifest.json            # PWA manifest
├── src/
│   ├── app/
│   │   ├── page.tsx             # Main HUD (5 tabs)
│   │   ├── layout.tsx           # Root layout + PWA metadata
│   │   ├── login/               # Supabase auth UI
│   │   ├── auth/callback/       # OAuth callback
│   │   └── api/
│   │       ├── adsb/            # ADS-B aircraft tracking (OpenSky)
│   │       ├── aero/            # METAR + TAF + NOTAM bundle
│   │       ├── airspaces/       # OpenAIP airspace proxy (bbox)
│   │       ├── auth-test/       # Supabase health check
│   │       ├── forecast/        # 24h hourly drone outlook
│   │       ├── health/          # Service health
│   │       ├── notams/          # NOTAM proxy
│   │       ├── push/            # Web Push (VAPID scaffold)
│   │       ├── sessions/        # Flight log persistence (Supabase)
│   │       └── sigmet/          # SIGMET / AIRMET
│   ├── components/
│   │   ├── map/
│   │   │   ├── InteractiveMapView.tsx  # Full map + layers + ADS-B + GOES
│   │   │   └── SmartAirportMarker.tsx  # METAR/TAF/NOTAM airport markers
│   │   ├── weather/
│   │   │   ├── MetarBoard.tsx          # METAR dashboard
│   │   │   ├── ForecastBar8Day.tsx     # 8-day forecast strip
│   │   │   ├── ForecastCards.tsx       # 24h drone outlook cards
│   │   │   └── RadarMap.tsx            # Standalone radar view
│   │   ├── telemetry/
│   │   │   ├── CopilotStatus.tsx       # GO/NO-GO AI engine display
│   │   │   ├── FlightLog.tsx           # Session logger
│   │   │   ├── FlightAnalytics.tsx     # Aggregated flight stats
│   │   │   ├── NoFlyZones.tsx          # TFR + airspace warnings
│   │   │   ├── NotamAlert.tsx          # NOTAM display
│   │   │   ├── SigmetAlert.tsx         # SIGMET/AIRMET display
│   │   │   ├── VerticalWindProfile.tsx # Wind at altitude chart
│   │   │   ├── GpsSatelliteStatus.tsx  # GPS + KP index
│   │   │   ├── WindCompass.tsx         # Surface wind compass
│   │   │   ├── WeatherCards.tsx        # Temp / rain / cloud cards
│   │   │   └── FlightWindow.tsx        # Sunrise/sunset/twilight
│   │   ├── navigation/          # BottomNav (mobile tab bar)
│   │   ├── providers/           # ThemeProvider
│   │   └── ui/                  # ThemeToggle, LocaleToggle,
│   │                              PushNotificationManager, AircraftIcons
│   ├── lib/
│   │   ├── api/telemetry.ts     # Aggregator + GO/NO-GO engine
│   │   ├── i18n/                # locales/ + useTranslation
│   │   ├── types/api.ts         # MetarData, AircraftPosition, etc.
│   │   └── supabase/            # SSR + client factories
│   ├── store/useStore.ts        # Zustand global state
│   └── proxy.ts                 # Next 16 proxy (formerly middleware)
├── next.config.ts
├── PLAN.md                      # Master roadmap
└── README.md
```

---

## Current Status

### ✅ What Works
- **Production build** passes clean (Next 16.2.1 + Turbopack)
- **TypeScript** — 0 errors
- **5 operational tabs** — Telemetry / Weather / Forecast / Map / Log
- **10 API endpoints** — adsb, aero, airspaces, auth-test, forecast, health, notams, push, sessions, sigmet
- **Supabase Auth** — login + callback + `proxy.ts` (SSR) + dev bypass
- **i18n EN/ES** — full locale system with toggle
- **PWA** — manifest, service worker, offline fallback, push scaffold
- **5 pilot profiles** — drone, plane, helicopter, paraglider, parachute
- **GO/NO-GO Engine** — multi-variable decision logic
- **ADS-B Live Traffic** — real-time aircraft on map with 15s refresh
- **METAR Smart Markers** — VFR/MVFR/IFR/LIFR with TAF + NOTAM
- **Airspace GeoJSON** — 14 layer types, color-coded, toggleable
- **RainViewer Radar** — automatic path discovery + tile overlay
- **GOES IR Clouds (Band 13)** — via IEM, working for Northern Hemisphere
- **GOES Visible Clouds (Band 02)** — via IEM, working for Northern Hemisphere
- **Flight Log** — session tracking with analytics (donut charts, sparklines)
- **SIGMET/AIRMET** — endpoint + alert component
- **No-Fly Zones** — proximity warnings with severity tiers

### ⚠️ Known Issues & In Progress

| Issue | Status | Details |
|---|---|---|
| **GOES satellite imagery only loads for Northern Hemisphere** | 🔴 Active | The IEM `goes_east_fulldisk_ch13` and `goes_east_fulldisk_ch02` tile layers render correctly for North America and northern latitudes, but tiles fail to load or are blank for South America and the Southern Hemisphere. Investigated NASA GIBS (time-sync complexity + Level 6 zoom limit), NOAA mapservices, and IEM South America layers as alternatives. **Goal: split into two tile sections — one for HN and one for HS — or find a single source with full hemisphere coverage.** |
| **OpenAIP rate limiting** | 🟡 Intermittent | API returns 403 Forbidden occasionally; local `co_asp.geojson` fallback covers Colombia |
| **ADS-B 429 throttling** | 🟡 Intermittent | OpenSky returns HTTP 429 under heavy polling; backoff of 60s implemented |
| **Push notifications** | 🟡 Scaffold only | UI + endpoint + DB schema ready; needs VAPID key generation + cron evaluator |
| **ESLint** | 🟡 Cosmetic | 54 errors / 17 warnings (mostly `no-explicit-any`) — does not block build |

### 🎯 What We Like

- **Cockpit HUD aesthetic** — the dark-mode-native design with cyan/green/amber/red HUD color system (`#00F0FF`, `#00FF66`, `#FFB800`, `#FF0055`) feels genuinely aviation-grade.
- **Layer control panel** — grouped by category (Meteorología, Navegación, Tráfico Vivo, Aeródromos, Mapa Base) with individual toggles and neon glow indicators.
- **Multi-profile pilot engine** — switching between drone/helicopter/paraglider/parachute/plane actually changes the GO/NO-GO thresholds meaningfully.
- **Smart Airport Markers** — METAR data parsed into VFR/IFR color categories directly on the map with TAF and NOTAM context.
- **The map experience overall** — satellite/vector base layer switching, ADS-B live traffic, airspace polygons with hover tooltips, radar overlay, and GOES clouds all layered together feels like a real aviation planning tool.
- **24h Drone Outlook cards** — sparklines with color-coded tiers (ok/warn/crit) for wind, UV, humidity, visibility.
- **Double-click location sync** — clicking anywhere on the map re-centers all telemetry to that point.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- (Optional) [OpenAIP](https://www.openaip.net) API key for global airspaces

### Installation
```bash
git clone https://github.com/Nodyt/zefyrio-platform.git
cd zefyrio-platform
npm install
```

### Environment Variables
Create `.env.local` at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Set to "true" to bypass Supabase auth entirely (local dev only)
NEXT_PUBLIC_DEV_BYPASS_AUTH=false

# OpenAIP — global airspaces + NOTAMs
OPENAIP_API_KEY=your_openaip_key

# Web Push (generate with `npx web-push generate-vapid-keys`)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public
VAPID_PRIVATE_KEY=your_vapid_private
VAPID_SUBJECT=mailto:you@example.com
```

### Dev Server
```bash
npm run dev
# → http://localhost:3007
```

### Production Build
```bash
npm run build
npm run start
```

### Lint
```bash
npm run lint
```

---

## PWA Installation

On mobile, open Zefyrio in the browser and tap **"Add to Home Screen"**. The app installs as standalone — perfect for pre-flight checks in the field where you don't want browser chrome eating your screen real estate.

---

## External APIs

| API | Purpose | Key Required |
|---|---|---|
| [Open-Meteo](https://open-meteo.com/) | Wind, temperature, precipitation, cloud cover, forecasts | None |
| [NOAA SWPC](https://www.swpc.noaa.gov/) | Planetary K-index (geomagnetic) | None |
| [AviationWeather.gov](https://aviationweather.gov/) | METAR / TAF / SIGMET / AIRMET / NOTAMs | None |
| [OpenSky Network](https://opensky-network.org/) | ADS-B aircraft positions | Optional |
| [OpenAIP](https://www.openaip.net/) | Global airspaces | Required |
| [RainViewer](https://rainviewer.com/) | Precipitation radar tiles | None |
| [Iowa Environmental Mesonet (IEM)](https://mesonet.agron.iastate.edu/) | GOES-East satellite imagery (IR Band 13 + Visible Band 02) | None |
| [ipapi.co](https://ipapi.co/) | IP geolocation fallback | None |

---

## Roadmap

See the full plan in **[PLAN.md](./PLAN.md)**.

**Done**
- [x] Drone-only HUD (single profile, tuned thresholds)
- [x] GO/NO-GO AI engine (wind, gusts, Kp, rain, visibility)
- [x] Live ADS-B traffic on map (15s refresh + 60s backoff)
- [x] Multi-language EN/ES
- [x] SIGMET / AIRMET integration
- [x] No-Fly Zones with severity tiers + distance
- [x] Flight log persisted in Supabase (`flight_sessions` + RLS)
- [x] Flight Analytics (donut + sparklines + profile usage)
- [x] Forecast tab — 24h cards (wind, UV, humidity, visibility) with drone-tuned tiers
- [x] 8-day daily forecast
- [x] Supabase auth + SSR `proxy.ts`
- [x] PWA + offline mode + service worker
- [x] Full TypeScript coverage + 0 type errors
- [x] GOES satellite imagery (IR + Visible) — Northern Hemisphere via IEM
- [x] Google Maps base layers (vector + satellite)
- [x] Airspace GeoJSON rendering (14 layer types)

**Done**
- [x] Vercel deploy — live at **https://zefyrio.vercel.app** (Next 16.2.1, Turbopack, SSR)

**In Progress**
- [ ] 🔴 **GOES satellite imagery for Southern Hemisphere** — tiles from IEM `goes_east_fulldisk` only render for NH; investigating dual-section approach (HN + HS) or alternative tile sources (NASA GIBS, NOAA mapservices)

**Pending — Phase 3+**
- [ ] **GitHub auto-deploy** — repo moved to `Cesar-Matta/zefyrio-platform`; reconnect in Vercel → Settings → Git to enable auto-deploy on push
- [ ] **Push notifications end-to-end (VAPID)** — UI + endpoint + DB ready; needs `npx web-push generate-vapid-keys` → add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` in Vercel env vars + cron evaluator
- [x] ESLint cleanup — 0 errors, 0 warnings
- [ ] OpenAIP global airspace caching (Phase 5)
- [ ] UI/UX Pro Max audit (Phase 6)
- [ ] Test suite — Vitest + Playwright (Phase 7)
- [ ] Vercel observability — Sentry or Vercel Analytics

---

## Project Status

| | |
|---|---|
| Build | ✅ passing (Next 16.2.1, Turbopack) |
| Typecheck | ✅ 0 errors |
| Lint | ✅ 0 errors, 0 warnings |
| Tests | ⏳ not yet |
| Deploy | ✅ **https://zefyrio.vercel.app** |
| GOES HN | ✅ working (IR + Visible) |
| GOES HS | 🔴 not loading — under investigation |

---

## Author

Built by **Cesar Matta** ([@Nodyt](https://github.com/Nodyt)) — Full-Stack Developer.
Part of the **Nodyt** ecosystem of digital products.

---

*Zefyrio — Aero HUD Protocol. Fly informed, fly safe.*
