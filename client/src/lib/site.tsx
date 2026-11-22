import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import type { SiteData } from './types';

interface SiteState {
  data: SiteData | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

const SiteContext = createContext<SiteState>({ data: null, error: null, loading: true, reload: () => {} });

export function SiteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api<SiteData>('/api/site')
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return <SiteContext.Provider value={{ data, error, loading, reload: load }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

export function useBusiness() {
  const { data } = useSite();
  return data?.business ?? null;
}

export const brandName = (b: { legalName?: string; companyName?: string } | null) =>
  b?.legalName || `${b?.companyName || 'XYZ'} Plumbing & Engineering`;

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export function whatsappHref(number: string, message: string) {
  let digits = number.replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`; // assume India when no country code
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function formatAddress(b: SiteData['business'] | null) {
  if (!b) return '';
  const a = b.address;
  return [a.line1, a.line2, a.city, a.state, a.postalCode].filter(Boolean).join(', ');
}
