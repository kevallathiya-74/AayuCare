/**
 * i18n Configuration
 * Multi-language support for English, Hindi, and Gujarati
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from '../locales/en.json';
import hi from '../locales/hi.json';
import gu from '../locales/gu.json';

const LANGUAGE_STORAGE_KEY = '@aayucare_language';

// Simplified language detection - remove async detector
const getInitialLanguage = () => {
    // Default to English for initial load
    return 'en';
};

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
    .catch((error) => {
        console.error('[i18n] Initialization error:', error);
    });

// Load saved language after initialization
setTimeout(async () => {
    try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && ['en', 'hi', 'gu'].includes(savedLanguage)) {
            await i18n.changeLanguage(savedLanguage);
        }
    } catch (error) {
        console.log('[i18n] Could not load saved language:', error.message);
    }
}, 100);

export default i18n;

// Helper function to change language
export const changeLanguage = async (languageCode) => {
    try {
        await i18n.changeLanguage(languageCode);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
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
