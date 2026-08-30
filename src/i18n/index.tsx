import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en, type StringKey } from "./en";
import { ja } from "./ja";

export type Lang = "ja" | "en";

/** Default language for now is Japanese (product decision, prototype phase). */
const DEFAULT_LANG: Lang = "ja";
const STORAGE_KEY = "viq.lang";

const DICTS: Record<Lang, Record<StringKey, string>> = { en, ja };

type Params = Record<string, string | number>;

export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in params ? String(params[k]) : `{${k}}`,
  );
}

function readStored(): Lang | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "ja" || v === "en" ? v : null;
  } catch {
    return null;
  }
}

/**
 * For now the app defaults to Japanese for everyone; English is reachable via the
 * toggle and then remembered. Locale auto-detection can be added later by checking
 * `navigator.language` here when no preference is stored.
 */
function detect(): Lang {
  return readStored() ?? DEFAULT_LANG;
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, params?: Params) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable — non-fatal */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback(
    (key: StringKey, params?: Params) =>
      interpolate(DICTS[lang][key] ?? en[key] ?? key, params),
    [lang],
  );

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}

/** Shorthand for components that only need the translate function. */
export function useT(): I18nValue["t"] {
  return useI18n().t;
}
