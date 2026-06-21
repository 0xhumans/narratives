import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" aria-hidden {...props}>
      {children}
    </svg>
  );
}

export function IconGeneric(props: P) {
  return (
    <Svg {...props}>
      <circle cx="80" cy="80" r="56" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <circle cx="80" cy="80" r="28" fill="currentColor" fillOpacity="0.15" />
      <path d="M80 24v32M80 104v32M24 80h32M104 80h32" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
    </Svg>
  );
}

export function IconAI(props: P) {
  return (
    <Svg {...props}>
      <circle cx="80" cy="50" r="12" fill="currentColor" fillOpacity="0.9" />
      <circle cx="40" cy="100" r="10" fill="currentColor" fillOpacity="0.5" />
      <circle cx="120" cy="100" r="10" fill="currentColor" fillOpacity="0.5" />
      <circle cx="60" cy="130" r="8" fill="currentColor" fillOpacity="0.35" />
      <circle cx="100" cy="130" r="8" fill="currentColor" fillOpacity="0.35" />
      <path d="M80 62v20M68 78l-20 14M92 78l20 14M72 92l-20 30M88 92l20 30" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
    </Svg>
  );
}

export function IconBio(props: P) {
  return (
    <Svg {...props}>
      <path
        d="M80 20c-20 40-20 80 0 120 20-40 20-80 0-120z"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <path
        d="M40 50h80M40 80h80M40 110h80"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.35"
      />
      <circle cx="80" cy="50" r="6" fill="currentColor" fillOpacity="0.8" />
      <circle cx="80" cy="80" r="6" fill="currentColor" fillOpacity="0.6" />
      <circle cx="80" cy="110" r="6" fill="currentColor" fillOpacity="0.4" />
    </Svg>
  );
}

export function IconEnergy(props: P) {
  return (
    <Svg {...props}>
      <rect x="48" y="40" width="64" height="88" rx="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
      <rect x="56" y="48" width="48" height="72" rx="4" fill="currentColor" fillOpacity="0.2" />
      <path d="M88 28v16M72 36h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M80 60l-8 24h16l-8 24 20-32H88l8-16z" fill="currentColor" fillOpacity="0.85" />
    </Svg>
  );
}

export function IconElectrification(props: P) {
  return (
    <Svg {...props}>
      <path
        d="M30 110h100l-20-30H50l-20 30z"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <circle cx="50" cy="115" r="10" stroke="currentColor" strokeWidth="2" />
      <circle cx="110" cy="115" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M80 30v50M65 45h30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="80" cy="30" r="6" fill="currentColor" fillOpacity="0.8" />
    </Svg>
  );
}

export function IconCyber(props: P) {
  return (
    <Svg {...props}>
      <path
        d="M80 24l48 24v40c0 28-48 52-48 52S32 116 32 88V48l48-24z"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M64 82l12 12 24-28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconDefense(props: P) {
  return (
    <Svg {...props}>
      <path d="M80 20L30 45v35c0 35 50 60 50 60s50-25 50-60V45L80 20z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      <path d="M55 90l15-40 15 40-15-8-15 8z" fill="currentColor" fillOpacity="0.7" />
    </Svg>
  );
}

export function IconNuclear(props: P) {
  return (
    <Svg {...props}>
      <circle cx="80" cy="80" r="16" fill="currentColor" fillOpacity="0.9" />
      <ellipse cx="80" cy="80" rx="56" ry="20" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" />
      <ellipse cx="80" cy="80" rx="56" ry="20" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" transform="rotate(60 80 80)" />
      <ellipse cx="80" cy="80" rx="56" ry="20" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" transform="rotate(120 80 80)" />
    </Svg>
  );
}

export function IconRobotics(props: P) {
  return (
    <Svg {...props}>
      <rect x="55" y="35" width="50" height="40" rx="8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
      <circle cx="68" cy="52" r="4" fill="currentColor" />
      <circle cx="92" cy="52" r="4" fill="currentColor" />
      <path d="M80 75v25M55 100h50M45 100v20M115 100v20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconSpace(props: P) {
  return (
    <Svg {...props}>
      <path d="M40 120c40-80 80-80 80-80s40 0 80 80H40z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      <circle cx="120" cy="50" r="14" fill="currentColor" fillOpacity="0.25" />
      <path d="M70 90l30-50 20 10-30 50-20-10z" fill="currentColor" fillOpacity="0.8" />
    </Svg>
  );
}

export function IconClimate(props: P) {
  return (
    <Svg {...props}>
      <path d="M50 100c0-20 15-35 30-35 5-18 25-28 45-20 15 6 22 22 18 38 12 4 20 16 20 32 0 22-18 35-38 35H60c-22 0-40-18-40-40 0-8 4-16 10-20z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" />
      <path d="M45 55l8 12M95 45l-6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconReindustrial(props: P) {
  return (
    <Svg {...props}>
      <rect x="35" y="60" width="90" height="60" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
      <path d="M35 60l20-25h50l20 25" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.08" />
      <rect x="55" y="85" width="20" height="35" fill="currentColor" fillOpacity="0.4" />
      <rect x="85" y="75" width="25" height="20" stroke="currentColor" strokeWidth="2" />
    </Svg>
  );
}

export function IconResources(props: P) {
  return (
    <Svg {...props}>
      <path d="M50 120c0-40 30-70 30-70s30 30 30 70H50z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
      <path d="M80 50v30M65 65h30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="80" cy="45" r="8" fill="currentColor" fillOpacity="0.7" />
    </Svg>
  );
}

export function IconAging(props: P) {
  return (
    <Svg {...props}>
      <circle cx="60" cy="55" r="18" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
      <circle cx="100" cy="65" r="14" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      <path d="M45 95c8 25 22 40 35 40s27-15 35-40" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M88 95c4 18 12 28 20 28" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.5" />
    </Svg>
  );
}
