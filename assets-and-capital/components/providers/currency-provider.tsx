"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CurrencyCode, DEFAULT_CURRENCY, getCurrency, type Currency } from "@/lib/i18n";

type Ctx = {
  currency: Currency;
  code: CurrencyCode;
  setCode: (code: CurrencyCode) => void;
  /** True once the client has read the persisted preference. */
  ready: boolean;
};

const CurrencyContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "ac_currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Start from the default on both server and first client render to avoid a
  // hydration mismatch; adopt the persisted choice after mount.
  const [code, setCodeState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
      if (saved && saved !== code) setCodeState(saved);
    } catch {
      /* ignore */
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCode = useCallback((next: CurrencyCode) => {
    setCodeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency: getCurrency(code), code, setCode, ready }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): Ctx {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Safe fallback so components used outside the provider still render in USD.
    return { currency: getCurrency(DEFAULT_CURRENCY), code: DEFAULT_CURRENCY, setCode: () => {}, ready: true };
  }
  return ctx;
}
