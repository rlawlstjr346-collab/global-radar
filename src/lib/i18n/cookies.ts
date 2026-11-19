/**
 * Long-lived: set when the user manually picks a country (the "use my
 * location" button). Language is no longer stored here — it's determined
 * by the URL's locale segment instead. Wins over geo-IP/Accept-Language
 * when resolving which country's platforms sort first.
 */
export const COUNTRY_OVERRIDE_COOKIE = "grl_country_override";

export const COUNTRY_OVERRIDE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Set when the user manually picks a language from the language switcher.
 * Read by proxy.ts so a later bare "/" visit returns to that choice instead
 * of re-detecting from Accept-Language — "the language I picked last time"
 * outranks "what my browser happens to say" for a returning visitor.
 */
export const LANGUAGE_PREFERENCE_COOKIE = "grl_lang_pref";

export const LANGUAGE_PREFERENCE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
