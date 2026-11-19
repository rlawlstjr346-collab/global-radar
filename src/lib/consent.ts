/**
 * Minimal analytics-consent store, scoped to this browser (localStorage).
 * Only consulted for EU visitors — see ConsentManager. Exposed via
 * useSyncExternalStore so reads stay hydration-safe and writes made from a
 * button click (same tab) are picked up immediately, not just the
 * `storage` event, which only fires in *other* tabs.
 */
export type ConsentState = "pending" | "accepted" | "declined";

const CONSENT_KEY = "grl_consent";

const consentEvents = typeof EventTarget !== "undefined" ? new EventTarget() : null;

export function getConsentSnapshot(): ConsentState {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored === "accepted" || stored === "declined" ? stored : "pending";
  } catch {
    return "pending";
  }
}

export function getConsentServerSnapshot(): ConsentState {
  return "pending";
}

export function setConsent(value: "accepted" | "declined") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Private browsing / storage disabled — consent just won't persist
    // across reloads, the banner will simply ask again next time.
  }
  consentEvents?.dispatchEvent(new Event("change"));
}

export function subscribeConsent(callback: () => void): () => void {
  consentEvents?.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  return () => {
    consentEvents?.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
  };
}
