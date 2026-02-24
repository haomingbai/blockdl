export type Messages = Record<string, string>;
export type PartialMessages = Partial<Messages>;
export type TranslateParams = Record<string, string | number>;

// Keep this file as a stable façade so most imports do not change when
// locale config/matching internals are refactored.
export {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  REGISTERED_LOCALES,
  isRegisteredLocaleCode,
  type Locale,
  type RegisteredLocale,
} from "./locales";

export {
  getBrowserLocale,
  matchRegisteredLocale,
  normalizeLocale,
} from "./locale-matcher";

export function formatMessage(
  template: string,
  params: TranslateParams | undefined
): string {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}
