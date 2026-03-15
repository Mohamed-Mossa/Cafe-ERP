import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from './en';
import ar from './ar';

export type Lang = 'en' | 'ar';

const translations = { en, ar };

// Deep get by dot-path e.g. "pos.total"
function get(obj: any, path: string): string {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return path;
    cur = cur[p];
  }
  return cur ?? path;
}

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nCtx>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  isRTL: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('cafe_lang') as Lang) || 'en';
  });

  const isRTL = lang === 'ar';

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('cafe_lang', l);
  };

  // Apply dir + lang to <html> element and load Cairo font for Arabic
  useEffect(() => {
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.body.style.fontFamily = isRTL
      ? '"Cairo", "Segoe UI", sans-serif'
      : '"Inter", "Segoe UI", sans-serif';
  }, [lang, isRTL]);

  const t = (key: string) => get(translations[lang], key);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

// Convenience: format currency always with Western numerals
export function useCurrency() {
  const { lang } = useI18n();
  return (amount: number) => {
    const formatted = amount.toLocaleString('en-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return lang === 'ar' ? `${formatted} جنيه` : `EGP ${formatted}`;
  };
}
