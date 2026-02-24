export type { Locale, Messages, PartialMessages, TranslateParams } from "./i18n";
export {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  REGISTERED_LOCALES,
  isRegisteredLocaleCode,
} from "./i18n";
export { I18nProvider } from "./I18nProvider";
export { useI18n, useT } from "./hooks";
export {
  categoryDescriptionKey,
  categoryNameKey,
  layerDescriptionKey,
  layerNameKey,
  layerParamDescriptionKey,
  layerParamLabelKey,
  layerParamOptionDescriptionKey,
  layerParamOptionLabelKey,
  tagKey,
  templateCategoryDescriptionKey,
  templateCategoryNameKey,
  templateDescriptionKey,
  templateNameKey,
} from "./keys";
