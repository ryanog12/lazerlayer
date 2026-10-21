import { cn } from "@/lib/utils";

/** Vector recreation of the LazerLayer hexagon mark (kept in sync with src/app/icon.svg). */
export function LogoMark({ className, laser = true }: { className?: string; laser?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="ll-slate" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#6b7380" />
          <stop offset="0.55" stopColor="#3d434c" />
          <stop offset="1" stopColor="#272a30" />
        </linearGradient>
        <linearGradient id="ll-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
        <filter id="ll-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <mask id="ll-cut">
          <rect width="64" height="64" fill="#fff" />
          <line x1="2" y1="51.4" x2="62" y2="12.6" stroke="#000" strokeWidth="3.6" />
        </mask>
      </defs>
      <g mask="url(#ll-cut)">
        <path
          fillRule="evenodd"
          fill="url(#ll-slate)"
          stroke="url(#ll-edge)"
          strokeWidth="0.6"
          d="M32 4 56.25 18v28L32 60 7.75 46V18ZM32 12.5 14.7 22.5v19L32 51.5l17.3-10v-19Z"
        />
        <path fill="url(#ll-slate)" stroke="url(#ll-edge)" strokeWidth="0.6" d="M32 21 41.5 26.5v11L32 43l-9.5-5.5v-11Z" />
      </g>
      {laser && (
        <g strokeLinecap="round">
          <line x1="4" y1="50.1" x2="55" y2="17.1" stroke="#E01E2B" strokeWidth="3.2" filter="url(#ll-glow)" />
          <line x1="4" y1="50.1" x2="55" y2="17.1" stroke="#ff3b47" strokeWidth="1.4" />
          <line x1="14" y1="43.6" x2="54" y2="17.7" stroke="#ffd6d9" strokeWidth="0.5" />
          <circle cx="55" cy="17.1" r="3.2" fill="#ff5a64" filter="url(#ll-glow)" />
          <path d="M55 11.5v11.2M49.4 17.1h11.2" stroke="#fff" strokeWidth="0.7" />
          <circle cx="55" cy="17.1" r="1.1" fill="#fff" />
        </g>
      )}
    </svg>
  );
}
