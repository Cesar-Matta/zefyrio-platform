"use client";

// Full Windy wind map embedded in its own tab (same engine aeroccidente uses).
// Keyless iframe embed — colour wind field + animated particles + speed.
interface WindyViewProps {
  lat: number;
  lon: number;
}

export default function WindyView({ lat, lon }: WindyViewProps) {
  const src =
    `https://embed.windy.com/embed2.html` +
    `?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}` +
    `&zoom=7&level=surface&overlay=wind&product=ecmwf&menu=&message=true` +
    `&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=` +
    `&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

  return (
    <iframe
      title="Mapa de Viento — Windy"
      src={src}
      className="w-full h-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
