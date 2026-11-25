/** Monochrome geometric atlas emblem (1.5px architectural stroke). */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="4.5" ry="9.25" stroke="currentColor" strokeWidth="1.25" />
      <line x1="2.75" y1="12" x2="21.25" y2="12" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
