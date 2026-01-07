import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import om from './locales/om.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      om: { translation: om },
    },
    lng: 'om', // Default language is Oromo
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
