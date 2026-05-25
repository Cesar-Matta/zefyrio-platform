# 🛩️ Zefyrio — Plan de Trabajo Maestro

**Última actualización:** 2026-05-24
**Estado del repo:** GitHub (`Nodyt/zefyrio-platform`) → 1 commit. Local → 1 commit + **22 modificados + 8 nuevos sin trackear**. **El local está muy por delante de GitHub.**
**Backend:** Supabase (NO Firebase). Hay `.env.local` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `OPENAIP_API_KEY`.

---

## 📊 Auditoría — Estado Actual

### ✅ Lo que funciona
- **Build de producción:** pasa limpio (Next 16.2.1 + Turbopack)
- **Typecheck:** 0 errores (después de los fixes de hoy)
- **5 tabs operativos:** telemetry / weather / forecast / map / log
- **8 endpoints API:** `adsb`, `aero`, `airspaces`, `auth-test`, `health`, `notams`, `push`, `sigmet`
- **Auth Supabase:** flow `/login` + `/auth/callback` + `proxy.ts` (ex-middleware) + bypass de dev (`NEXT_PUBLIC_DEV_BYPASS_AUTH=true`)
- **i18n EN/ES:** `src/lib/i18n/locales/` + `useTranslation` + `LocaleToggle`
- **PWA:** `manifest.json`, `sw.js`, `offline.html`, push notifications con `web-push`
- **5 perfiles de piloto:** drone, plane, helicopter, paraglider, parachute (con iconos custom)
- **GO/NO-GO Engine:** lógica en `src/lib/api/telemetry.ts`
- **Componentes nuevos sin trackear:** `FlightLog`, `FlightAnalytics`, `NoFlyZones`, `SigmetAlert`, `PushNotificationManager`, `AircraftIcons`, `LocaleToggle`

### 🔧 Lo que se ajustó hoy
| Problema | Archivo | Fix |
|---|---|---|
| `Target` icon no importado | `InteractiveMapView.tsx:34` | Añadido a imports de lucide-react |
| Prop `onSyncLocation` faltante en el tipo | `InteractiveMapView.tsx:93` | Declarada en `InteractiveMapViewProps` y cableada a `dblclick` |
| `notam` vs `notams` en SmartAirportMarker | `InteractiveMapView.tsx:225` | Renombrado a `notams` |
| Deprecación `middleware` → `proxy` | `src/middleware.ts` → `src/proxy.ts` | Renombrado archivo + función `middleware()` → `proxy()` |

### ⚠️ Lo que NO está terminado / falla
1. **FlightLog persistencia:** sólo localStorage. Falta migrar a Supabase (`flight_sessions` table).
2. **FlightAnalytics:** componente existe pero conviene revisar fuentes de datos.
3. **Forecast tab:** 4 cards "próximamente" sin contenido (Viento por Horas, UV, Humedad, Visibilidad).
4. **PushNotificationManager:** UI existe; falta probar suscripción VAPID end-to-end.
5. **OpenAIP airspaces:** key está en `.env.local`, pero conviene validar cuotas + caché.
6. **ESLint:** 54 errores + 17 warnings (mayoría `no-explicit-any` y unused vars). No bloquean build pero afean el código.
7. **NoFlyZones:** lee de `co_asp.geojson` estático — sólo cubre Colombia. Internacionalizar con OpenAIP.
8. **README:** referencia repo `your-username/zefyrio` en vez de `Nodyt/zefyrio-platform`.
9. **Tests:** no hay suite de tests.

### ❌ Lo que falta del Roadmap original
- [ ] Push notifications para deterioro climático
- [ ] Flight log persistido en Supabase
- [ ] SIGMET / AIRMET (parcial — endpoint existe, falta integración fina)
- [ ] ADS-B live traffic (parcial — funciona en mapa)

---

## 🚀 Plan de Trabajo por Fases

### **FASE 1 — Estabilización (1–2 días)** 🔴 Prioridad alta
- [ ] Commit + push de los 30 archivos sin sincronizar a GitHub
- [ ] Resolver los 54 errores de ESLint (`any` → tipos reales, eliminar vars no usados)
- [ ] Subir tipos a `useStore` (`telemetryData: any` → `TelemetryData` interface)
- [ ] Smoke test manual de cada tab en dev (`npm run dev` → localhost:3007)
- [ ] Verificar que `NEXT_PUBLIC_DEV_BYPASS_AUTH=false` con Supabase activa no rompe el flow

### **FASE 2 — Persistencia (2–3 días)** 🟡
- [ ] Crear schema Supabase:
  - `flight_sessions` (id, user_id, date, duration, profile, status, location, conditions)
  - `user_profiles` (preferred_units, default_profile, home_location)
  - `push_subscriptions` (user_id, endpoint, keys)
- [ ] RLS policies (cada usuario ve sólo lo suyo)
- [ ] Migrar `FlightLog` de localStorage → Supabase
- [ ] Endpoint `/api/sessions` (GET/POST/DELETE)

### **FASE 3 — Push Notifications end-to-end (2 días)** 🟡
- [ ] Generar VAPID keys (variables `VAPID_PUBLIC`, `VAPID_PRIVATE`)
- [ ] Probar `/api/push` con suscripción real
- [ ] Cron en Vercel/Supabase Edge Function que evalúe condiciones cada 15 min y dispare push si hay cambio de estado (GO → CAUTION → NO-GO)

### **FASE 4 — Completar Forecast Tab (1 día)** 🟢
- [ ] **Wind by Hours:** consumir Open-Meteo hourly (`wind_speed_10m`)
- [ ] **UV Index:** Open-Meteo (`uv_index`)
- [ ] **Humidity:** Open-Meteo (`relative_humidity_2m`)
- [ ] **Visibility:** Open-Meteo (`visibility`)
- [ ] Reusar el sistema de cards con micro-charts (sparklines)

### **FASE 5 — Airspaces globales + caché (2 días)** 🟡
- [ ] Sustituir `co_asp.geojson` por consulta dinámica a OpenAIP por bbox
- [ ] Caché en Supabase Storage o en `public/data/` con CDN
- [ ] Rate-limit del endpoint `/api/airspaces`

### **FASE 6 — UX Pro Max (2 días)** 🟢
- [ ] Aplicar reglas de `ui-ux-pro-max.md` (accesibilidad → touch → perf → estilo)
- [ ] Auditar contraste WCAG AA en ambos temas
- [ ] Loading skeletons en lugar de spinners
- [ ] Haptic feedback al cambiar de perfil (mobile)
- [ ] Animar transición entre tabs con `view-transitions-api`

### **FASE 7 — Testing + CI (2 días)** 🟢
- [ ] Vitest + Testing Library para componentes telemetry
- [ ] Playwright e2e: login → telemetry → map → log
- [ ] GitHub Actions: lint + typecheck + build + tests en PR

### **FASE 8 — Deploy + Observabilidad (1 día)** 🟢
- [ ] Deploy a Vercel (conectar repo `Nodyt/zefyrio-platform`)
- [ ] Configurar env vars en Vercel
- [ ] Sentry o Vercel Analytics para errores cliente
- [ ] PageSpeed > 90 en mobile

### **FASE 9 — Features avanzadas (a futuro)** 🔵
- [ ] AI Copilot con LLM (resumen ejecutivo de condiciones)
- [ ] Tracks GPS de vuelos reales (importar IGC/GPX/KML)
- [ ] Compartir vuelos por link público
- [ ] Wearables: app companion para Apple Watch / Wear OS
- [ ] Modo "Pilot Briefing" pre-vuelo en PDF

---

## ⏱️ Estimación Total
- **Fase 1–4:** 6–9 días → MVP comercial sólido
- **Fase 5–8:** 7 días → producción
- **Fase 9:** indefinido (R&D)

---

## 🔑 Decisiones técnicas pendientes
1. **¿Mantener Supabase o migrar a Firebase?** → Respuesta: **mantener Supabase**. Está cableado, funciona con SSR, y RLS es más simple que reglas Firestore.
2. **¿Vercel o self-hosted?** → Vercel para empezar (free tier alcanza), revisar si la cuota de Edge Functions aprieta.
3. **¿Mapas: Leaflet o MapLibre?** → Leaflet está OK, pero MapLibre permite 3D y mejor perf en mobile. Decidir en Fase 6.
