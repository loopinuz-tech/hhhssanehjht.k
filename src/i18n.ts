import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en.json';
import translationUZ from './locales/uz.json';
import translationRU from './locales/ru.json';

const resources = {
  en: { translation: translationEN },
  uz: { translation: translationUZ },
  ru: { translation: translationRU }
};

const savedLang = localStorage.getItem('appLang') || 'uz';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
