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

import type {
  EditorialContent,
  EditorialLocale
} from "@/lib/editorialConfig";

const editorialLocaleStorageKey = "site-love-locale-v1";
const italianTimeZones = new Set([
  "Europe/Rome",
  "Europe/San_Marino",
  "Europe/Vatican"
]);

type EditorialLocaleContextValue = {
  locale: EditorialLocale;
  setLocale: (locale: EditorialLocale) => void;
};

const EditorialLocaleContext =
  createContext<EditorialLocaleContextValue | null>(null);

function isEditorialLocale(value: unknown): value is EditorialLocale {
  return value === "it" || value === "en";
}

function detectEditorialLocale(): EditorialLocale {
  try {
    const savedLocale = window.localStorage.getItem(editorialLocaleStorageKey);
    if (isEditorialLocale(savedLocale)) return savedLocale;
  } catch {
    // Continue with browser-level detection when storage is unavailable.
  }

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (italianTimeZones.has(timeZone)) return "it";
  } catch {
    // Continue with language detection when the time zone is unavailable.
  }

  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return languages.some((language) => language.toLowerCase().startsWith("it"))
    ? "it"
    : "en";
}

export function EditorialLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<EditorialLocale>("it");

  useEffect(() => {
    setLocale(detectEditorialLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const selectLocale = useCallback((nextLocale: EditorialLocale) => {
    setLocale(nextLocale);
    try {
      window.localStorage.setItem(editorialLocaleStorageKey, nextLocale);
    } catch {
      // The selection remains active for the current visit.
    }
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale: selectLocale }),
    [locale, selectLocale]
  );

  return (
    <EditorialLocaleContext.Provider value={value}>
      {children}
    </EditorialLocaleContext.Provider>
  );
}

export function useEditorialLocale() {
  const context = useContext(EditorialLocaleContext);
  if (!context) {
    throw new Error(
      "useEditorialLocale must be used inside EditorialLocaleProvider"
    );
  }
  return context;
}

export function EditorialLanguageSelector({
  className,
  labels
}: {
  className?: string;
  labels: EditorialContent["language"];
}) {
  const { locale, setLocale } = useEditorialLocale();

  return (
    <div className={className} role="group" aria-label={labels.label}>
      <button
        type="button"
        aria-label={labels.italian}
        aria-pressed={locale === "it"}
        onClick={() => setLocale("it")}
      >
        IT
      </button>
      <button
        type="button"
        aria-label={labels.english}
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}
