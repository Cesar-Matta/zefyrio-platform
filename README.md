# Cfyro — Aviation Weather & Drone Safety HUD

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16.2-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet_Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**A real-time aviation weather intelligence platform and heads-up display (HUD) for drone pilots, paragliders, skydivers, helicopter operators, and fixed-wing aviators.**

[Live Preview](https://cfyro.vercel.app) · [Roadmap](./PLAN.md)

</div>

---

## Project Overview

Cfyro is a **Progressive Web App** that aggregates live meteorological, geomagnetic, and airspace data into a cockpit-style interface. The platform uses GPS or IP triangulation to deliver hyper-local weather intelligence and AI-driven **GO / CAUTION / NO-GO** flight safety decisions — all in real time.

Designed for modern operations: data-dense, dark-mode native, and built for mobile-first use in the field with a high-end glassmorphism aesthetic.

---

## Key Features

### Cockpit Telemetry
- **Multi-Profile Engine** — drone, helicopter, paraglider, parachute, fixed-wing — each with its own safety thresholds.
- **AI GO/NO-GO Status** — rule-based decision engine over wind, gusts, visibility, KP index, NOTAMs, SIGMETs, and TFR.
- **Universal Search Engine** — Support for ICAO Airport Codes and Geocoding of any City/Population worldwide.
- **GPS Precision Fallback** — Automatically fetches exact coordinates + nearest population name if no airport is selected.

### Maps & Airspace
- **Interactive Leaflet Map** with Google Maps vector / satellite base layers + CartoDB dark mode.
- **METAR Smart Airport Markers** — VFR / MVFR / IFR / LIFR color-coded with TAF and NOTAM data.
- **Airspace Layers** — Class E/F/G, Restricted, Danger, Prohibited, CTR, TMA, Military, Gliding, Hang Gliding, RC airfields, Parachuting zones.
- **RainViewer radar overlay** — precipitation radar tiles with automatic path discovery.
- **ADS-B Live Traffic** — Real-time aircraft positions via OpenSky Network (can be enabled manually).

### Weather & Forecast
- **METAR Board** — Aviation weather reports parsed and human-readable.
- **8-Day Forecast Bar** — Daily summary across an extended horizon using glassmorphic UI.
- **24h Drone Outlook** — Hourly wind, temperature, UV index, humidity, and visibility cards with Sparkline micro-charts color-coded against drone-safety tiers (ok / warn / crit).
- **Vertical Wind Profile** — charts wind at 10 m / 80 m / 120 m / 180 m for pre-flight briefings.

### Flight Log
- **Session Logger** — start, finish, conditions snapshot per flight.
- **Flight Analytics** — aggregated stats across sessions.

### App Platform
- **PWA Installable** — iOS & Android home-screen install, offline-ready service worker.
- **Theme Toggle** — Light / Dark dynamic theming with independent custom logo scaling.
- **Supabase Auth** — Email + OAuth, SSR-aware.

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
| **Styling** | Tailwind CSS v4 + PostCSS + Glassmorphism UI |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Optional) [OpenAIP](https://www.openaip.net) API key

### Installation
```bash
git clone https://github.com/Cesar-Matta/zefyrio-platform.git
cd zefyrio-platform
npm install
```

### Dev Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

---

## PWA Installation

On mobile, open Cfyro in the browser and tap **"Add to Home Screen"**. The app installs as standalone — perfect for pre-flight checks in the field where you don't want browser chrome eating your screen real estate.

---

## Author

Built by **Cesar Matta** ([@Nodyt](https://github.com/Nodyt)) — Full-Stack Developer.
Part of the **Nodyt** ecosystem of digital products.

---

*Cfyro — Meteorología para Drones. Fly informed, fly safe.*
