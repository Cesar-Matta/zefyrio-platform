// Shared API response shapes — used across components and routes.
// Kept intentionally loose where upstream sources (OpenAIP, AviationWeather, OpenSky)
// emit fields that we don't all care about.

export interface GeoPolygon {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface AirspaceProperties {
  _id?: string;
  name?: string;
  type?: number;
  icaoClass?: number;
  activity?: number;
  country?: string;
  upperLimit?: { value: number; unit: number; referenceDatum: number };
  lowerLimit?: { value: number; unit: number; referenceDatum: number };
  createdAt?: string;
}

export interface AirspaceFeature {
  type: 'Feature';
  id?: number | string;
  properties: AirspaceProperties;
  geometry: GeoPolygon | null;
}

export interface NotamEvent {
  id: string;
  type: string;
  classification: string;
  location: string;
  effectiveStart: string;
  effectiveEnd: string;
  text: string;
  icaoLocation?: string;
}

export interface NotamItem {
  properties: {
    notamNumber: string;
    airspaceType?: number;
    typeLabel?: string;
    distanceNm?: number | null;
    notamEvent: NotamEvent;
    geometry?: GeoPolygon | null;
    startDate?: string;
  };
}

export interface AircraftPosition {
  icao24: string;
  callsign: string;
  lat: number;
  lon: number;
  baroAltitude: number;
  trueTrack: number;
  velocity?: number;
  verticalRate?: number;
  category?: string | number;
  onGround?: boolean;
  // Enriched fields (available from ADSB.lol)
  registration?: string | null;
  aircraftType?: string | null;
  geoAltitude?: number | null;
  originCountry?: string;
}

export interface MetarData {
  icaoId: string;
  name?: string;
  lat: number;
  lon: number;
  temp?: number;
  dewp?: number;
  wspd?: number;
  wdir?: number;
  visib?: number;
  rawOb: string;
  fltcat?: string;
}

export interface TafData {
  icaoId: string;
  rawTAF?: string;
  forecast?: unknown;
}

export interface SigmetItem {
  airSigmetId: number;
  icaoId: string;
  airSigmetType: string;
  hazard: string;
  severity: string;
  altitudeLo: number;
  altitudeHi: number;
  rawAirSigmet: string;
  validTimeFrom: string;
  validTimeTo: string;
}
