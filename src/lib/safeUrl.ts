/**
 * Returns the URL only when it is an absolute http(s) link; anything else
 * (javascript:, data:, relative or malformed strings from scraped data) yields undefined.
 */
export function safeExternalUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
