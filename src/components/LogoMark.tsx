/** The brand mark: the same pink map pin used for the favicon and map pins. */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M24 4C15.164 4 8 11.164 8 20c0 11.5 16 24 16 24s16-12.5 16-24c0-8.836-7.164-16-16-16z"
        fill="#FF3C5C"
      />
      <circle cx="24" cy="20" r="6.5" fill="#ffffff" />
    </svg>
  );
}
