# 🛩️ Zefyrio — Plan de Trabajo Maestro

**Última actualización:** 2026-06-21
**Estado del repo:** GitHub (`Cesar-Matta/zefyrio-platform`). 
**Backend:** Supabase (Auth + DB) y Vercel (Hosting).

---

## 📊 Auditoría — Estado Actual

### ✅ Lo que ya está completado y en producción
- **Build de producción:** Desplegado exitosamente en Vercel (`zefyrio.vercel.app`).
- **5 tabs operativos:** Telemetry / Weather / Forecast / Map / Log.
- **Search Universal:** Búsqueda combinada de Aeropuertos (ICAO) y Poblaciones (Geocoding de Open-Meteo) para dar cobertura a operaciones de drones en zonas rurales.
- **UI/UX Pro Max:** 
  - Rediseño con Glassmorphism (paneles translúcidos y desenfoques).
  - Modal bottom-sheet responsivo para previsión de 7 días.
  - Soporte de logo dinámico (SVG claro y PNG oscuro escalados de forma independiente para coincidir al milímetro).
- **Forecast Tab Completo:** Gráficas (sparklines), niveles de seguridad para drones, temperatura, precipitación, índice UV, humedad y visibilidad.
- **GO/NO-GO Engine:** Activo y calibrado.
- **ADS-B Traffic:** Módulo configurado pero desactivado por defecto por límites de la API de OpenSky.

### ⚠️ Lo que NO está terminado / Pendiente
1. **FlightLog Persistencia:** Falta guardar el log de vuelos reales en Supabase (ahora solo interfaz local).
2. **Push Notifications:** UI lista, endpoint listo, falta conectar las llaves VAPID en producción y configurar el cron de Vercel.
3. **OpenAIP Airspaces:** Actualmente limitados a Colombia mediante `co_asp.geojson` como respaldo por los rate-limits de la API de OpenAIP.
4. **GOES Sur:** La capa de satélite de IEM solo cubre el hemisferio norte. Pendiente buscar proveedor para el sur.

---

## 🚀 Plan de Trabajo por Fases (Actualizado)

### **FASE 1 — Estabilización & UI (Completado) 🟢**
- [x] ESLint limpios.
- [x] Componentes de UI estandarizados al Glassmorphism.
- [x] Integración de logos customizados (Light & Dark).
- [x] Búsqueda Universal Geocodificada (Ciudades + ICAO).

### **FASE 2 — Despliegue & DevOps (Completado) 🟢**
- [x] Deploy a producción en Vercel.
- [x] PWA configurada y funcional.

### **FASE 3 — Persistencia de Vuelos (Próximo paso) 🟡**
- [ ] Crear schema en Supabase (`flight_sessions`).
- [ ] Configurar RLS (Row Level Security).
- [ ] Conectar el componente `FlightLog` para Guardar/Leer del servidor.

### **FASE 4 — Alertas Automáticas (Push) 🟡**
- [ ] Generar e inyectar VAPID keys en entorno de Vercel.
- [ ] Activar Cron job `/api/cron/weather-alert` cada hora.
- [ ] Evaluar cambios de condición GO/NO-GO y disparar notificaciones web push a móviles.

### **FASE 5 — Expansión Geográfica (Azul) 🔵**
- [ ] Integrar proveedor de mapas satelitales infrarrojos/visibles que cubra Sudamérica (GOES-16).
- [ ] Caché inteligente para OpenAIP que evite bloqueos y permita cargar espacios aéreos globales de forma eficiente.

### **FASE 6 — Features Avanzadas (Azul) 🔵**
- [ ] Importar y pintar tracks GPS de vuelos (`.igc`, `.gpx`).
- [ ] AI Copilot: un pequeño asistente de texto que haga un resumen ejecutivo hablado/escrito antes de volar.
- [ ] Compartir el "Estado de Vuelo" mediante link o captura.

---

## 🔑 Decisiones Técnicas Tomadas
1. **Host:** Vercel (Producción confirmada y estable).
2. **Backend:** Supabase (Se descarta Firebase definitivamente).
3. **Coordenadas por defecto:** Si no hay ICAO, se usan coordenadas GPS precisas y el nombre del pueblo más cercano.
4. **ADS-B:** Desactivado por defecto. Es muy pesado y colapsa rápido los límites gratuitos.
