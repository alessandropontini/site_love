'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  detectLocale,
  getMessages,
  localeStorageKey,
  type Locale
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: ReturnType<typeof getMessages>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("it");
  const [detected, setDetected] = useState(false);
  const localizedMessages = useMemo(() => getMessages(locale), [locale]);
  const selectLocale = useCallback((nextLocale: Locale) => {
    setLocale(nextLocale);
    try {
      window.localStorage.setItem(localeStorageKey, nextLocale);
    } catch {
      // The selected language remains active for the current visit.
    }
  }, []);

  useEffect(() => {
    setLocale(detectLocale());
    setDetected(true);
  }, []);

  useEffect(() => {
    if (!detected) return;

    document.documentElement.lang = locale;
    document.title = localizedMessages.meta.title;
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    description?.setAttribute("content", localizedMessages.meta.description);

  }, [detected, locale, localizedMessages]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: selectLocale,
      messages: localizedMessages
    }),
    [locale, localizedMessages, selectLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }
  return context;
}

export function LanguageSelector({ className }: { className?: string }) {
  const { locale, messages: copy, setLocale } = useLocale();

  return (
    <div className={className} role="group" aria-label={copy.language.label}>
      <button
        type="button"
        aria-label={copy.language.italian}
        aria-pressed={locale === "it"}
        onClick={() => setLocale("it")}
      >
        IT
      </button>
      <button
        type="button"
        aria-label={copy.language.english}
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}
