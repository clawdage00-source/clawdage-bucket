/** i18n foundation — content keys for future Hindi, Malayalam, Tamil, Kannada */
export const LOCALES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: LocaleCode = "en";

export const LOCALE_COOKIE = "clawdage_locale";
