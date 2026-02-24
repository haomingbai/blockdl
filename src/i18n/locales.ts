// Translation-facing configuration lives here so adding a language is mostly
// a data change (code, aliases, and switcher label) instead of a logic patch.
export const REGISTERED_LOCALES = [
  {
    code: "en",
    aliases: ["en", "en-us", "en-gb", "en-au", "en-ca", "en-nz", "en-ie"],
    switcherLabel: "English",
  },
  {
    code: "zh-CN",
    aliases: ["zh-cn", "zh", "zh-hans", "zh-hans-cn", "zh-sg", "zh-chs"],
    switcherLabel: "简体中文",
  },
] as const;

export type RegisteredLocale = (typeof REGISTERED_LOCALES)[number];
export type Locale = RegisteredLocale["code"];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "blockdl-locale";

export function isRegisteredLocaleCode(value: string): value is Locale {
  // Used by the language switcher to validate Select values at runtime.
  return REGISTERED_LOCALES.some((locale) => locale.code === value);
}
