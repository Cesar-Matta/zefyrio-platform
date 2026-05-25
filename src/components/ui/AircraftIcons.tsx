import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const DroneIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 10a2 2 0 1 0 0 4 2 2 0 1 0 0-4z"/>
    <path d="m13.41 13.41 2.83 2.83"/>
    <path d="M18.5 14a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5z"/>
    <path d="m10.59 13.41-2.83 2.83"/>
    <path d="M5.5 14a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5z"/>
    <path d="m10.59 10.59-2.83-2.83"/>
    <path d="M5.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5z"/>
    <path d="m13.41 10.59 2.83-2.83"/>
    <path d="M18.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5z"/>
  </svg>
);

export const PlaneIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.5l-1.5 1.5c-.2.2-.2.5 0 .7l7.5 4-2.5 2.5-3.5-.5c-.3 0-.6.1-.8.4l-1.5 1.5c-.2.2-.1.6.2.7l4.5 1.5 1.5 4.5c.1.3.5.4.7.2l1.5-1.5c.3-.2.4-.5.4-.8l-.5-3.5 2.5-2.5 4 7.5c.2.2.5.2.7 0l1.5-1.5c.3-.2.6-.6.5-1.1z"/>
  </svg>
);

export const HelicopterIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 10l1 2h6"/>
    <path d="M12 9a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h7a2 2 0 0 0 2-2c0-3.31-3.13-5-7-5h-2z"/>
    <path d="M13 9V6"/>
    <path d="M5 6h15"/>
    <path d="M15 9.1v3.9h5.5"/>
    <path d="M15 19v-3"/>
    <path d="M19 19H11"/>
  </svg>
);

export const ParagliderIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Paraglider Canopy - Flatter, elliptical wing shape */}
    <path d="M1 8c4-3 9-3 11-3s7 0 11 3" strokeWidth="2" />
    <path d="M1 8c4-1 9-1 11-1s7 0 11 1" />
    {/* Suspension Lines */}
    <path d="M1 8l10 10" />
    <path d="M23 8l-10 10" />
    <path d="M6.5 6.5l4.5 11.5" />
    <path d="M17.5 6.5l-4.5 11.5" />
    <path d="M12 6v12" />
    {/* Seated Pilot / Harness */}
    <path d="M10.5 19h3v2.5h-3z" fill="currentColor" stroke="none" />
  </svg>
);

export const ParachuteIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Classic Round Parachute Dome */}
    <path d="M2 11a10 10 0 0 1 20 0Z" />
    <path d="M2 11h20" />
    {/* Suspension Lines */}
    <path d="M2 11l9 7" />
    <path d="M22 11l-9 7" />
    <path d="M7 11l4 7" />
    <path d="M17 11l-4 7" />
    <path d="M12 11v7" />
    {/* Skydiver Body */}
    <circle cx="12" cy="20" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
