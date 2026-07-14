# 🛩️ Zefyrio — HUD de Seguridad y Meteorología de Aviación & Drones

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16.2-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet_Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**Plataforma de inteligencia meteorológica aeronáutica en tiempo real y Heads-Up Display (HUD) de seguridad para pilotos de drones, parapentistas, paracaidistas y aviación general.**

[Previsualización en Vivo](https://zefyrio.vercel.app) · [Plan de Trabajo / Hoja de Ruta](./PLAN.md)

</div>

---

## 📌 Descripción del Proyecto

**Zefyrio** es una **Progressive Web App (PWA)** de alto rendimiento que consolida y analiza datos meteorológicos, geomagnéticos y de espacio aéreo en una interfaz de cabina (*HUD*) densa y optimizada para dispositivos móviles.

Mediante triangulación GPS de alta precisión o geolocalización IP en los servidores (*Edge-level*), la plataforma entrega reportes hiperlocales y un motor de toma de decisiones automatizado que categoriza el vuelo como **GO / CAUTION / NO-GO** según el perfil del vehículo configurado.

El diseño está optimizado para su uso en campo: interfaz oscura nativa, controles táctiles ergonómicos, y estética premium de **glassmorphism** (paneles translúcidos y desenfoques Gaussianos).

---

## 🛠️ Arquitectura y Estructura del Código

El proyecto sigue una estructura limpia utilizando **Next.js 16.2 (App Router)** y **Zustand** para la gestión de estado global reactivo:

```
zefyrio/
├── src/
│   ├── app/                      # Enrutamiento, layouts y proxies API
│   │   ├── api/                  # Endpoints de consulta y proxies backend
│   │   ├── auth/                 # Flujos de autenticación de Supabase
│   │   ├── login/                # Página de acceso/registro
│   │   ├── globals.css           # Estilos globales y variables de Tailwind v4
│   │   └── page.tsx              # HUD Principal / Tablero de mandos
│   ├── components/               # Componentes modulares y reutilizables
│   │   ├── map/                  # Leaflet, capas satelitales, espacio aéreo e interactividad
│   │   ├── navigation/           # Menú y barra de navegación inferior móvil
│   │   ├── telemetry/            # Indicadores HUD, perfiles, NOTAMs, gráficos y registros
│   │   ├── ui/                   # Modales, menús de usuario y gestores PWA
│   │   └── weather/              # Tableros METAR, Windy integrado y gráficos sparkline
│   ├── lib/                      # Lógica de negocio y utilidades nucleares
│   │   ├── api/                  # Clientes de llamadas API (telemetría, base de datos)
│   │   ├── i18n/                 # Soporte internacional (Español / Inglés)
│   │   └── supabase/             # Clientes de cliente/servidor y scripts de base de datos
│   └── store/                    # Gestión de estado de Zustand (useStore.ts)
```

---

## 🚀 Características Principales

### 📡 Telemetría HUD e Indicadores de Cabina
* **Motor Multi-Perfil**: Diseñado para soportar múltiples aeronaves (Dron, Helicóptero, Avión, Parapente, Paracaídas) con límites operacionales independientes.
* **Algoritmo GO/NO-GO**: Evaluación instantánea basada en parámetros críticos de seguridad (viento, ráfagas, visibilidad, índice KP geomagnético, NOTAMs y precipitaciones).
* **Búsqueda Universal Avanzada**: Búsqueda integrada que combina códigos de aeropuertos de la OACI (ICAO) y geocodificación global de poblaciones (Open-Meteo).
* **Geolocalización Híbrida**: Localización rápida mediante IP con superposición automática del GPS del navegador para máxima precisión geográfica en el campo.

### 🗺️ Mapas Interactivos y Capas de Espacio Aéreo
* **Visor Leaflet**: Capas seleccionables (Google Vector/Satélite y CartoDB Dark Mode).
* **Marcadores METAR Dinámicos**: Aeropuertos colorizados en tiempo real según categoría de vuelo (**VFR** / **MVFR** / **IFR** / **LIFR**) mostrando TAF y NOTAMs al hacer clic.
* **Espacio Aéreo (Airspaces)**: Capas de restricciones cargadas dinámicamente (Zonas Restringidas, Peligrosas, Prohibidas, CTR, TMA, zonas de planeadores y aeromodelismo). Optimizado para Sudamérica / Colombia mediante respaldo GeoJSON local (`co_asp.geojson`).
* **Radar de Lluvia**: Animación en tiempo real de precipitaciones integrando la API de RainViewer.
* **Tráfico ADS-B**: Módulo listo para renderizar posiciones en tiempo real de aeronaves tripuladas cercanas mediante la red de OpenSky Network.

### 🌦️ Análisis Meteorológico de Precisión
* **Decodificador METAR**: Reportes de aeródromos oficiales parsed a lenguaje humano.
* **Pronóstico de Viento Vertical**: Gráfico dinámico que muestra la velocidad y dirección del viento en diferentes alturas críticas (Superficie, 50m, 80m, 120m y 180m / 400ft AGL) para análisis previo al despegue.
* **Gráficos Sparkline de 24h**: Visualización interactiva hora por hora de viento, temperatura, ráfagas, humedad y visibilidad con colores de alerta integrados.
* **Techo de Nubes Estimado**: Cálculo de la base de nubes en pies AGL basado en la fórmula psicrométrica de Espy (diferencia de temperatura y punto de rocío).
* **Clima Extendido**: Sección de previsión a 8 días con modal detallado estilo *bottom-sheet*.

### 📝 Bitácora de Vuelo (Flight Log)
* **Grabador de Sesión**: Inicio y finalización del vuelo cronometrados, capturando un snapshot JSON del clima en tiempo real.
* **Analíticas Integradas**: Totalizador de horas de vuelo, número de despegues y condiciones promedio.

---

## ⚡ Configuración de Base de Datos (Supabase)

El backend de base de datos corre sobre **Supabase** (PostgreSQL) con políticas de **Row Level Security (RLS)** activadas por defecto para asegurar la confidencialidad de los vuelos de cada piloto.

### Estructura de Tablas principales (`schema.sql`):
1. **`public.profiles`**: Almacena los perfiles de los pilotos (UUID ligado a `auth.users`).
2. **`public.flight_profiles`**: Parámetros meteorológicos de seguridad configurados por el piloto para cada tipo de vehículo (`dron`, `plane`, `helicopter`, `paraglider`, `parachute`).
3. **`public.favorite_locations`**: Waypoints y lugares frecuentes guardados por latitud/longitud.
4. **`public.flight_sessions`**: Historial de vuelos guardados con duración y snapshot JSONB del clima (`conditions`).
5. **`public.push_subscriptions`**: Puntos de enlace Web Push vinculados por dispositivo del usuario para recibir alertas automatizadas.

### Inicialización Automatizada:
El backend cuenta con un Trigger en base de datos (`handle_new_user()`) que genera automáticamente el perfil del piloto y configura un perfil de vuelo tipo **Dron** con límites estándar de seguridad cuando se registra un usuario nuevo por primera vez.

---

## ⚙️ Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto. Este archivo contiene las claves de conexión de Supabase y las API tokens de los proveedores meteorológicos:

```bash
# Supabase Backend
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-jwt

# Bypass de Autenticación para Desarrollo Local (true = salta el login)
NEXT_PUBLIC_DEV_BYPASS_AUTH=true

# API Keys de Proveedores de Datos
OPENAIP_API_KEY=tu-clave-de-open-aip             # Espacios aéreos y NOTAMs globales
AVIATIONSTACK_API_KEY=tu-clave-de-aviation-stack # Cobertura de telemetría de vuelos comerciales

# Configuración de Notificaciones Push (Web Push VAPID)
# Generar claves con: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu-vapid-public-key
VAPID_PRIVATE_KEY=tu-vapid-private-key
VAPID_SUBJECT=mailto:tu-correo@dominio.com
```

---

## 🛠️ Reglas del Motor GO / CAUTION / NO-GO (Drones)

El sistema de alerta del HUD analiza en tiempo real las variables meteorológicas locales y aplica las siguientes reglas restrictivas por defecto para sub-25 kg multirrotores:

| Variable | Umbral GO | Umbral CAUTION | Umbral NO-GO | Razón Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **Lluvia / Precipitación** | 0 mm | — | > 0 mm | Riesgo de cortocircuito y daño eléctrico. |
| **Ráfagas en Superficie** | < 22 km/h | 22 - 30 km/h | > 30 km/h | Desestabilización de actitud y pérdida de control física. |
| **Viento a 120m (400ft)** | < 15 km/h | 15 - 25 km/h | > 25 km/h | Corrientes fuertes en altura, deriva de retorno difícil. |
| **Índice Geomagnético Kp** | < 4.0 | 4.0 - 4.5 | > 4.5 | Interferencia electromagnética solar en GPS (riesgo fly-away). |
| **Visibilidad Horizontal**| > 5 km | 3 - 5 km | < 3 km | Pérdida de línea visual directa (VLOS) requerida por ley. |

---

## 🚀 Instalación y Despliegue Local

### 1. Clonar el Repositorio e Instalar Dependencias
```bash
git clone https://github.com/Cesar-Matta/zefyrio-platform.git
cd zefyrio-platform
npm install
```

### 2. Ejecutar Servidor de Desarrollo
```bash
npm run dev
# El servidor se iniciará por defecto en http://localhost:3007
```

### 3. Compilación y Construcción para Producción
```bash
npm run build
npm run start
```

---

## 📱 Instalación PWA (Progressive Web App)

Zefyrio está construido para ser 100% instalable en smartphones y ordenadores:
* **En iOS (Safari)**: Presiona el botón de compartir y selecciona **"Añadir a la pantalla de inicio"**.
* **En Android (Chrome)**: Haz clic en el banner flotante de instalación o en el menú de opciones de tres puntos y selecciona **"Instalar aplicación"**.
* **Modo Offline**: Gracias al Service Worker incorporado, los paneles principales e interfaces se cargan de forma instantánea incluso si pierdes señal en zonas rurales de vuelo.

---

## ✒️ Autor e Integración

Desarrollado y mantenido por **Cesar Matta** ([@Nodyt](https://github.com/Nodyt)) — Desarrollador Full-Stack.
Parte de la suite de herramientas y productos digitales del ecosistema **Nodyt**.

---

*Zefyrio — Meteorología para Drones. Fly informed, fly safe.*
