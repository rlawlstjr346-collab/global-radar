/** Precision inline SVG icons (crisp 1.6px–2px stroke, currentColor, 0% Unicode emojis). */

interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function SearchIcon({ className, size = 16, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className, size = 14, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function ArrowLeftIcon({ className, size = 15, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10L12.5 15.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className, size = 15, strokeWidth = 1.85 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 4.5L13 10L7.5 15.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className, size = 14, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M6 14L14 6M8 6H14V12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowDownRightIcon({ className, size = 14, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M6 6L14 14M14 8V14H8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowUpLeftIcon({ className, size = 14, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M14 14L6 6M6 12V6H12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShuffleIcon({ className, size = 14, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M15 4.5A6.5 6.5 0 1 0 16.5 10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M15 2.5V5.5H12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className, size = 15, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5.5 7.5L10 12L14.5 7.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronUpIcon({ className, size = 15, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5.5 12.5L10 8L14.5 12.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BookmarkIcon({ className, size = 16, filled = false, strokeWidth = 1.75 }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} className={className} aria-hidden="true">
      <path
        d="M5.5 3.5H14.5C15.05 3.5 15.5 3.95 15.5 4.5V16.75L10 13.5L4.5 16.75V4.5C4.5 3.95 4.95 3.5 5.5 3.5Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyIcon({ className, size = 14, strokeWidth = 1.65 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M12.5 7.5V5C12.5 4.17 11.83 3.5 11 3.5H5C4.17 3.5 3.5 4.17 3.5 5V11C3.5 11.83 4.17 12.5 5 12.5H7.5" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function CheckIcon({ className, size = 14, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 10.5L8.25 14.25L15.5 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon({ className, size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function MinusIcon({ className, size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10H16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function LocateIcon({ className, size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M10 2.5V5M10 15V17.5M2.5 10H5M15 10H17.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function GlobeResetIcon({ className, size = 20, strokeWidth = 1.9 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={strokeWidth} />
      <ellipse cx="10" cy="10" rx="3.2" ry="7" stroke="currentColor" strokeWidth={strokeWidth - 0.25} />
      <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth={strokeWidth - 0.25} />
    </svg>
  );
}
