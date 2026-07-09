/**
 * i18n Configuration
 * Multi-language support for English, Hindi, and Gujarati
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import appStorage from '../utils/appStorage';
import { STORAGE_KEYS } from '../utils/constants';

import en from '../locales/en.json';
import hi from '../locales/hi.json';
import gu from '../locales/gu.json';

const LANGUAGE_STORAGE_KEY = STORAGE_KEYS.LANGUAGE;

// Initialize i18n immediately without async detection
i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3',
        resources: {
            en: { translation: en },
            hi: { translation: hi },
            gu: { translation: gu },
        },
        lng: 'en', // Always start with English
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    })
    .then(() => {
        return appStorage.getItem(LANGUAGE_STORAGE_KEY);
    })
    .then((savedLanguage) => {
        if (savedLanguage && ['en', 'hi', 'gu'].includes(savedLanguage)) {
            return i18n.changeLanguage(savedLanguage);
        }
    })
    .catch((error) => {
        console.warn('[i18n] Init or language load failed:', error.message);
    });

export default i18n;

import api from '../services/apiClient';

// Helper function to change language
export const changeLanguage = async (languageCode) => {
    try {
        await i18n.changeLanguage(languageCode);
        await appStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
        
        // Silent background synchronization to the backend
        api.put('/user/profile', { preferred_language: languageCode }).catch(() => {});
        
        return true;
    } catch (error) {
        console.error('Error changing language:', error);
        return false;
    }
};

// Helper function to get current language
export const getCurrentLanguage = () => {
    return i18n.language || 'en';
};

// Helper function to get available languages
export const getAvailableLanguages = () => {
    return [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
        { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    ];
};

