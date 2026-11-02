import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import te from './locales/te.json';
import hi from './locales/hi.json';

const STORAGE_KEY = 'sarkarisetu_language';

// Retrieve saved language preference or default to English
const savedLanguage =
  (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || 'en';

// Set document lang attribute
if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLanguage;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      te: { translation: te },
      hi: { translation: hi },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // No suspense needed for pre-bundled static JSON
    },
  });

// Synchronize document language and localStorage when language switches
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lng);
    document.documentElement.lang = lng;
  }
});

export default i18n;
