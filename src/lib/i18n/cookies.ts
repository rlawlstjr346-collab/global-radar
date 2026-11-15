/** Long-lived: set once the user manually picks a language/region. Wins over everything. */
export const MANUAL_OVERRIDE_COOKIE = "grl_locale_override";

/** Short-lived: the result middleware computed for this request (for server components to read). */
export const RESOLVED_LOCALE_COOKIE = "grl_locale_resolved";

export const MANUAL_OVERRIDE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
