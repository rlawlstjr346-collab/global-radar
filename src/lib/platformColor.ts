/**
 * A distinct accent color per platform, used as a thin left-border strip
 * (not a full background) so platforms read as visually distinct without
 * competing with the text. Deterministic — same id → same color always.
 */
export function getPlatformAccent(platformId: string): string {
  let hash = 0;
  for (let i = 0; i < platformId.length; i++) {
    hash = (hash * 31 + platformId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 60%, 55%)`;
}
