// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO i18n — Spanish locale
// ═══════════════════════════════════════════════════════════════════

const es = {
  // App
  app_name: 'ZEFYRIO',
  app_tagline: 'Protocolo Aero HUD',

  // Profiles
  profile_dron: 'UAV/Dron',
  profile_plane: 'Aviación General',
  profile_helicopter: 'Helicóptero',
  profile_paraglider: 'Vela Ligera',
  profile_parachute: 'Paracaidismo',

  // Status
  status_go: 'GO — DESPEGUE AUTORIZADO',
  status_caution: 'CAUTION — PRECAUCIÓN',
  status_nogo: 'NO-GO — VUELO CANCELADO',
  status_analysis: 'Análisis',

  // GPS
  gps_linking: 'ENLAZANDO GPS:',
  gps_searching: 'Buscando satélites limpios...',
  gps_syncing: 'Sincronizando modelos Doppler (Open-Meteo)',
  gps_failed: 'FALLO GPS:',
  gps_denied_fallback: 'GPS Denegado/Timeout — Triangulando por IP...',
  gps_no_signal: 'Señal Pérdida. Sin Telemetría.',
  gps_no_support: 'GPS No Soportado',
  gps_sync: 'SYNC',
  gps_sat: 'SAT',

  // Telemetry
  telem_copilot: 'Copiloto IA',
  telem_notam: 'Alertas NOTAM',
  telem_sigmet: 'SIGMET / AIRMET',
  telem_active_alerts: 'ALERTAS ACTIVAS',
  telem_active_alert: 'ALERTA ACTIVA',
  telem_wind_profile: 'Perfil de Viento Vertical',
  telem_flight_window: 'Ventana de Vuelo Solar',
  telem_daytime: 'DIURNO',
  telem_nighttime: 'NOCTURNO',
  telem_tap_details: 'TAP PARA DETALLES',

  // Weather Cards
  weather_temp: 'TEMP',
  weather_feels: 'SENS',
  weather_rain: 'LLUVIA',
  weather_clouds: 'NUBES',
  weather_visibility: 'VIS',

  // KP Index
  kp_storm: 'TORMENTA',
  kp_active: 'ACTIVO',
  kp_calm: 'CALMO',

  // Wind
  wind_surface: 'VIENTO SFC',
  wind_gusts: 'RÁFAGAS',

  // Navigation
  nav_hud: 'HUD',
  nav_radar: 'RADAR',
  nav_forecast: 'PREV',
  nav_map: 'MAP',
  nav_log: 'LOG',

  // Map
  map_initializing: 'INICIALIZANDO RADAR...',
  map_my_location: 'MI UBICACIÓN',
  map_layer_satellite: 'Satélite Visual',
  map_layer_clouds: 'Nubes Infrarrojas',
  map_layer_radar: 'Radar Precipit.',
  map_layer_adsb: 'Tráfico ADS-B',
  map_layer_airports: 'Aeropuertos OACI',
  map_layer_notams: 'Zonas WAR (NOTAM)',
  map_layer_nofly: 'Zonas No-Fly',

  // METAR
  metar_title: 'Panel METAR',
  metar_loading: 'Escaneando frecuencias aeronáuticas...',
  metar_no_data: 'Sin reportes METAR en rango',

  // Flight Log
  log_title: 'Bitácora de Vuelo',
  log_empty: 'Sin vuelos registrados.',
  log_save: 'Guardar Sesión',
  log_duration: 'Duración',
  log_conditions: 'Condiciones',

  // Flight Analytics
  analytics_title: 'Analítica de Vuelo',
  analytics_no_data: 'Guarda sesiones de vuelo para ver analítica.',
  analytics_status_breakdown: 'Resultados de Sesión',
  analytics_temp_trend: 'Tendencia de Temperatura',
  analytics_wind_trend: 'Tendencia de Viento',
  analytics_kp_trend: 'Tendencia Geomagnética',
  analytics_profile_usage: 'Uso por Perfil',

  // Push Notifications
  push_enable: 'Activar Alertas Meteo',
  push_enable_sub: 'Toca para permitir notificaciones',
  push_active: 'Alertas Activas',
  push_active_sub: 'Toca para desactivar',
  push_unsupported: 'Notificaciones push no soportadas en este navegador.',
  push_denied: 'Notificaciones bloqueadas. Actívalas en ajustes del navegador.',
  push_not_configured: 'Alertas push no configuradas (se requieren claves VAPID).',

  // MetarBoard
  metar_tactical_radar: 'Radar Táctico',
  metar_adsb_limit: 'ADS-B: Límite OpenSky alcanzado — reintentando...',
  metar_scanning: 'Sintonizando Frecuencias METAR...',
  metar_no_stations: 'Sin terminales aéreas en esta cuadrícula. Desplaza el radar.',
  metar_base_station: 'Estación Base Fix',
  metar_airport: 'AEROPUERTO',
  metar_raw: 'RAW METAR:',
  metar_flight_cat: 'Cat. Vuelo',
  metar_cloud_ceiling: 'Techo Nubes',
  metar_ceiling_clear: 'Despejado',

  // Offline
  offline_title: 'SIN SEÑAL',
  offline_subtitle: 'Enlace de Datos Perdido',
  offline_message: 'No se detecta conexión a la red. La telemetría en tiempo real no está disponible.',
  offline_retry: 'Reconectar',

  // SIGMET hazards
  hazard_turb: 'Turbulencia',
  hazard_ice: 'Engelamiento',
  hazard_ifr: 'Baja Visibilidad',
  hazard_mtn: 'Montaña Obscurecida',
  hazard_ts: 'Tormenta Eléctrica',
  hazard_conv: 'Convección Severa',

  // AI Messages
  ai_go: 'Ventana de vuelo inmejorable. Cielos despejados, vientos nominales y espacio aéreo seguro.',
  ai_rain: 'Precipitación detectada. Riesgo de congelamiento de rotores o alas mojadas.',
  ai_gusts: 'Ráfagas extremas detectadas en superficie. Abortar despegues.',
  ai_kp_drone: 'Tormenta geomagnética (Kp Alto). Probabilidad de pérdida de enlace satelital GPS o Fly-Away.',
  ai_wind_paraglider: 'Vientos marginales a 400ft. Alto riesgo de deriva en vela. Mantenerse debajo de la capa de corte.',
  ai_plane_clear: 'Niveles de crucero despejados. Vuelo comercial e IFR sin restricciones reportadas.',

  // Meteo server
  meteo_no_response: 'Servidor Meteo No Responde',
} as const;

export default es;
