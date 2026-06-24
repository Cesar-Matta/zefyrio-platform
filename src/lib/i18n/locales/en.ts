// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO i18n — English locale
// ═══════════════════════════════════════════════════════════════════

const en = {
  // App
  app_name: 'CFYRO',
  app_tagline: 'Aero HUD Protocol',

  // Profiles
  profile_dron: 'UAV/Drone',
  profile_plane: 'General Aviation',
  profile_helicopter: 'Helicopter',
  profile_paraglider: 'Paraglider',
  profile_parachute: 'Skydiving',

  // Status
  status_go: 'GO — TAKEOFF AUTHORIZED',
  status_caution: 'CAUTION — PROCEED WITH CARE',
  status_nogo: 'NO-GO — FLIGHT CANCELLED',
  status_analysis: 'Analysis',

  // GPS
  gps_linking: 'LINKING GPS:',
  gps_searching: 'Searching for clean satellites...',
  gps_syncing: 'Syncing Doppler models (Open-Meteo)',
  gps_failed: 'GPS Failed:',
  gps_denied_fallback: 'GPS Denied/Timeout — Triangulating via IP...',
  gps_no_signal: 'Signal Lost. No Telemetry.',
  gps_no_support: 'GPS Not Supported',
  gps_sync: 'SYNC',
  gps_sat: 'SAT',

  // Telemetry
  telem_copilot: 'AI Copilot',
  telem_notam: 'NOTAM Alerts',
  telem_sigmet: 'SIGMET / AIRMET',
  telem_active_alerts: 'ACTIVE ALERTS',
  telem_active_alert: 'ACTIVE ALERT',
  telem_wind_profile: 'Vertical Wind Profile',
  telem_flight_window: 'Solar Flight Window',
  telem_daytime: 'DAYTIME',
  telem_nighttime: 'NIGHTTIME',
  telem_tap_details: 'TAP FOR DETAILS',

  // Weather Cards
  weather_temp: 'TEMP',
  weather_feels: 'FEELS',
  weather_rain: 'RAIN',
  weather_clouds: 'CLOUDS',
  weather_visibility: 'VIS',

  // KP Index
  kp_storm: 'STORM',
  kp_active: 'ACTIVE',
  kp_calm: 'CALM',

  // Wind
  wind_surface: 'SFC WIND',
  wind_gusts: 'GUSTS',

  // Navigation
  nav_hud: 'HUD',
  nav_radar: 'RADAR',
  nav_wind: 'WIND',
  nav_forecast: 'FCST',
  nav_map: 'MAP',
  nav_log: 'LOG',

  // Map
  map_initializing: 'INITIALIZING RADAR...',
  map_my_location: 'MY LOCATION',
  map_layer_satellite: 'Satellite Visual',
  map_layer_clouds: 'IR Clouds',
  map_layer_radar: 'Precip. Radar',
  map_layer_adsb: 'ADS-B Traffic',
  map_layer_airports: 'ICAO Airports',
  map_layer_notams: 'WAR Zones (NOTAM)',
  map_layer_nofly: 'No-Fly Zones',

  // METAR
  metar_title: 'METAR Board',
  metar_loading: 'Scanning aviation frequencies...',
  metar_no_data: 'No METAR reports found in range',

  // Flight Log
  log_title: 'Flight Log',
  log_empty: 'No flights recorded yet.',
  log_save: 'Save Session',
  log_duration: 'Duration',
  log_conditions: 'Conditions',

  // Flight Analytics
  analytics_title: 'Flight Analytics',
  analytics_no_data: 'Save flight sessions to see analytics.',
  analytics_status_breakdown: 'Session Outcomes',
  analytics_temp_trend: 'Temperature Trend',
  analytics_wind_trend: 'Wind Trend',
  analytics_kp_trend: 'Geomagnetic Trend',
  analytics_profile_usage: 'Profile Usage',

  // Push Notifications
  push_enable: 'Enable Weather Alerts',
  push_enable_sub: 'Tap to allow push notifications',
  push_active: 'Alerts Active',
  push_active_sub: 'Tap to disable',
  push_unsupported: 'Push notifications not supported on this browser.',
  push_denied: 'Notifications blocked. Enable in browser settings.',
  push_not_configured: 'Push alerts not configured (VAPID keys required).',

  // MetarBoard
  metar_tactical_radar: 'Tactical Radar',
  metar_adsb_limit: 'ADS-B: OpenSky limit reached — retrying...',
  metar_scanning: 'Scanning METAR Frequencies...',
  metar_no_stations: 'No air terminals in this grid. Pan the radar to search.',
  metar_base_station: 'Base Fix Station',
  metar_airport: 'AIRPORT',
  metar_raw: 'RAW METAR:',
  metar_flight_cat: 'Flight Cat.',
  metar_cloud_ceiling: 'Cloud Ceiling',
  metar_ceiling_clear: 'Clear',

  // Offline
  offline_title: 'NO SIGNAL',
  offline_subtitle: 'Data Link Lost',
  offline_message: 'No network connection detected. Real-time telemetry unavailable.',
  offline_retry: 'Reconnect',

  // SIGMET hazards
  hazard_turb: 'Turbulence',
  hazard_ice: 'Icing',
  hazard_ifr: 'Low Visibility',
  hazard_mtn: 'Mountain Obscured',
  hazard_ts: 'Thunderstorm',
  hazard_conv: 'Severe Convection',

  // AI Messages
  ai_go: 'Perfect flight window. Clear skies, nominal winds and safe airspace.',
  ai_rain: 'Precipitation detected. Risk of rotor icing or wet wings.',
  ai_gusts: 'Extreme surface gusts detected. Abort takeoffs.',
  ai_kp_drone: 'Geomagnetic storm (High Kp). Probability of GPS satellite link loss or Fly-Away.',
  ai_wind_paraglider: 'Marginal winds at 400ft. High drift risk on canopy. Stay below wind shear layer.',
  ai_plane_clear: 'Cruise levels clear. Commercial and IFR flight unrestricted.',

  // Meteo server
  meteo_no_response: 'Meteo Server Not Responding',
} as const;

export type TranslationKey = keyof typeof en;
export default en;
