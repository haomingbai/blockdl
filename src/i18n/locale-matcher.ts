import {
  DEFAULT_LOCALE,
  REGISTERED_LOCALES,
  type Locale,
  type RegisteredLocale,
} from "./locales";

// Parsed form of one entry in an Accept-Language header / browser locale list.
type LocalePreference = {
  tag: string;
  q: number;
  order: number;
};

type RegisteredLocaleMatcher = {
  code: Locale;
  normalizedCode: string;
  normalizedAliases: Set<string>;
  primaryLanguage: string;
  order: number;
};

function normalizeLocaleTag(input: string): string {
  // Normalize common locale variants (e.g. "zh_CN" -> "zh-cn") before matching.
  return input
    .trim()
    .replace(/_/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLocalePreferences(
  input: string | null | undefined
): LocalePreference[] {
  if (!input) return [];

  // Supports both plain locale strings ("en-US") and Accept-Language lists
  // ("en-US,en;q=0.9,zh;q=0.8"). Entries are sorted by q then original order.
  return input
    .split(",")
    .map((raw, order) => {
      const [tagPart, ...params] = raw.trim().split(";");
      const tag = normalizeLocaleTag(tagPart ?? "");
      if (!tag) return null;

      let q = 1;
      for (const param of params) {
        const match = param.trim().match(/^q=([0-9]*\.?[0-9]+)$/i);
        if (!match) continue;
        const parsed = Number(match[1]);
        if (!Number.isNaN(parsed)) {
          q = Math.max(0, Math.min(1, parsed));
        }
      }

      return { tag, q, order } satisfies LocalePreference;
    })
    .filter((value): value is LocalePreference => value !== null)
    .sort((a, b) => b.q - a.q || a.order - b.order);
}

function localeTagPrefixes(tag: string): string[] {
  // "zh-hans-cn" -> ["zh-hans-cn", "zh-hans", "zh"]
  const parts = tag.split("-").filter(Boolean);
  const prefixes: string[] = [];
  for (let index = parts.length; index >= 1; index -= 1) {
    prefixes.push(parts.slice(0, index).join("-"));
  }
  return prefixes;
}

function buildRegisteredLocaleMatchers(
  registeredLocales: readonly RegisteredLocale[]
): RegisteredLocaleMatcher[] {
  // Precompute normalized aliases for fast matching and easier reuse.
  return registeredLocales.map((locale, order) => {
    const normalizedCode = normalizeLocaleTag(locale.code);
    const normalizedAliases = new Set<string>([normalizedCode]);
    locale.aliases.forEach((alias) =>
      normalizedAliases.add(normalizeLocaleTag(alias))
    );

    return {
      code: locale.code,
      normalizedCode,
      normalizedAliases,
      primaryLanguage: normalizedCode.split("-")[0] ?? normalizedCode,
      order,
    };
  });
}

const REGISTERED_LOCALE_MATCHERS = buildRegisteredLocaleMatchers(
  REGISTERED_LOCALES
);

function scoreLocaleMatch(
  preference: LocalePreference,
  locale: RegisteredLocaleMatcher
): number | null {
  // Higher score wins. Priority order:
  // 1) exact alias/code match
  // 2) prefix/boundary alias match (e.g. "en-us" -> "en")
  // 3) primary language fallback (e.g. "en-za" -> "en")
  const candidate = preference.tag;
  const prefixes = localeTagPrefixes(candidate);
  const primaryLanguage = prefixes[prefixes.length - 1] ?? candidate;

  if (locale.normalizedAliases.has(candidate)) {
    return 100000 + Math.round(preference.q * 1000) - preference.order;
  }

  const prefixIndex = prefixes.findIndex((prefix) =>
    locale.normalizedAliases.has(prefix)
  );
  if (prefixIndex >= 0) {
    return (
      90000 -
      prefixIndex * 100 +
      Math.round(preference.q * 1000) -
      preference.order
    );
  }

  if (primaryLanguage === locale.primaryLanguage) {
    let score = 80000 + Math.round(preference.q * 1000) - preference.order;
    if (candidate.includes("-hans") && locale.normalizedAliases.has("zh-hans")) {
      score += 10;
    }
    return score;
  }

  return null;
}

export function matchRegisteredLocale(
  input: string | null | undefined,
  registeredLocales: readonly RegisteredLocale[] = REGISTERED_LOCALES
): Locale | null {
  const preferences = parseLocalePreferences(input);
  if (preferences.length === 0) return null;

  // Reuse prebuilt matchers for the default registry so translation additions
  // don't change matching runtime overhead in common code paths.
  const matchers =
    registeredLocales === REGISTERED_LOCALES
      ? REGISTERED_LOCALE_MATCHERS
      : buildRegisteredLocaleMatchers(registeredLocales);

  let best:
    | {
        locale: Locale;
        score: number;
        order: number;
      }
    | null = null;

  for (const preference of preferences) {
    for (const matcher of matchers) {
      const score = scoreLocaleMatch(preference, matcher);
      if (score === null) continue;

      if (
        !best ||
        score > best.score ||
        (score === best.score && matcher.order < best.order)
      ) {
        best = { locale: matcher.code, score, order: matcher.order };
      }
    }
  }

  return best?.locale ?? null;
}

export function normalizeLocale(
  input: string | null | undefined
): Locale | null {
  // Public normalization entrypoint used by storage and browser locale parsing.
  return matchRegisteredLocale(input, REGISTERED_LOCALES);
}

export function getBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;

  // Use navigator.languages first (ordered preference list), then fallback to
  // navigator.language for environments that only expose a single value.
  const candidates = Array.isArray(navigator.languages)
    ? navigator.languages
    : [];
  const joinedCandidates = [...candidates, navigator.language]
    .filter(Boolean)
    .join(",");

  return normalizeLocale(joinedCandidates) ?? DEFAULT_LOCALE;
}
