import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';

interface LanguageStore {
  language: 'om' | 'en';
  setLanguage: (lang: 'om' | 'en') => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'om',
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
    }),
    {
      name: 'oromo-times-language',
    }
  )
);
