import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  I18nContext,
  type I18nContextValue,
  type TranslateOptions,
} from "./context";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  formatMessage,
  normalizeLocale,
  type Locale,
  type Messages,
  type PartialMessages,
} from "./i18n";
import { enMessages } from "./messages/en";
import { zhCNMessages } from "./messages/zh-CN";

type Catalog = Record<Locale, PartialMessages>;

function getStoredLocale(): Locale | null {
  if (typeof localStorage === "undefined") return null;
  return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
}

function setStoredLocale(locale: Locale): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

function getInitialLocale(initialLocale: Locale | undefined): Locale {
  // English-first startup: explicit prop > saved user choice > default.
  return initialLocale ?? getStoredLocale() ?? DEFAULT_LOCALE;
}

export interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
  catalog?: Partial<Record<Locale, PartialMessages>>;
}

export function I18nProvider({
  children,
  initialLocale,
  catalog,
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    getInitialLocale(initialLocale)
  );

  const mergedCatalog: Catalog = useMemo(
    () => ({
      en: { ...enMessages, ...(catalog?.en ?? {}) } satisfies Messages,
      "zh-CN": { ...zhCNMessages, ...(catalog?.["zh-CN"] ?? {}) },
    }),
    [catalog]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    setStoredLocale(nextLocale);
  }, []);

  const t = useCallback(
    (key: string, options?: TranslateOptions): string => {
      const template =
        mergedCatalog[locale][key] ??
        mergedCatalog.en[key] ??
        options?.defaultValue ??
        key;
      return formatMessage(template, options?.params);
    },
    [locale, mergedCatalog]
  );

  const value: I18nContextValue = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
