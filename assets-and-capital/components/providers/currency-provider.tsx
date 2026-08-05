"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { snapshotOf, subscribeTo } from "@/lib/local-store";
import { useMounted } from "@/lib/use-mounted";
import { CURRENCIES, CurrencyCode, DEFAULT_CURRENCY, getCurrency, type Currency } from "@/lib/i18n";

type Ctx = {
  currency: Currency;
  code: CurrencyCode;
  setCode: (code: CurrencyCode) => void;
  /** True once the client has read the persisted preference. */
  ready: boolean;
};

const CurrencyContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "ac_currency";
const CURRENCY_EVT = "ac-currency";

/** Raw string is already the code; validate it against the known set. */
function parseCode(raw: string | null): CurrencyCode {
  return raw && CURRENCIES.some((c) => c.code === raw) ? (raw as CurrencyCode) : DEFAULT_CURRENCY;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // The stored currency is external state, so read it through
  // useSyncExternalStore: the server and the first client render both yield the
  // default (no hydration mismatch), and the persisted choice arrives without a
  // second render scheduled from inside an effect.
  const subscribe = useMemo(() => subscribeTo(STORAGE_KEY, CURRENCY_EVT), []);
  const getSnapshot = useCallback(() => snapshotOf(STORAGE_KEY, parseCode), []);
  const getServerSnapshot = useCallback(() => DEFAULT_CURRENCY, []);
  const code = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // `ready` used to mean "the effect has run". It now means "we are past
  // hydration", which is the same moment without the extra render.
  const ready = useMounted();

  const setCode = useCallback((next: CurrencyCode) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* quota or privacy mode */
    }
    window.dispatchEvent(new Event(CURRENCY_EVT));
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
