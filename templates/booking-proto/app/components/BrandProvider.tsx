'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { brands, brandById, defaultBrand, type BrandId, type Brand } from '../../theme/tokens';

const STORAGE_KEY = 'pact-booking-brand';

type BrandContextValue = { brand: Brand; setBrandId: (id: BrandId) => void };

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brandId, setBrandId] = useState<BrandId>(defaultBrand);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setBrandId(brandById(stored).id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-brand', brandId);
    window.localStorage.setItem(STORAGE_KEY, brandId);
  }, [brandId]);

  return (
    <BrandContext.Provider value={{ brand: brandById(brandId), setBrandId }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}

export { brands };
