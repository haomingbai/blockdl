import { createContext } from "react";

import type { Locale, TranslateParams } from "./i18n";

export interface TranslateOptions {
  defaultValue?: string;
  params?: TranslateParams;
}

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: TranslateOptions) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

