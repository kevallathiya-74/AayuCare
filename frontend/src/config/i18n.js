import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../locales/en/translation.json';

i18n
  .use(initReactI18next)
  .init({
    debug: __DEV__,
    fallbackLng: 'en',
    supportedLngs: ['en'],
    resources: {
      en: {
        translation: enTranslation,
      },
    },
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;
