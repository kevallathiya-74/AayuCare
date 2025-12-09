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

// Language detector
const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (callback) => {
        try {
            // Try to get saved language preference
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLanguage) {
                callback(savedLanguage);
                return;
            }

            // Fall back to device locale
            const deviceLocale = Localization.locale;
            const languageCode = deviceLocale.split('-')[0];
            
            // Map device locale to supported languages
            const supportedLanguages = ['en', 'hi', 'gu'];
            const detectedLanguage = supportedLanguages.includes(languageCode) 
                ? languageCode 
                : 'en';
            
            callback(detectedLanguage);
        } catch (error) {
            console.error('Error detecting language:', error);
            callback('en'); // Default to English
        }
    },
    init: () => {},
    cacheUserLanguage: async (language) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        } catch (error) {
            console.error('Error caching language:', error);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3',
        resources: {
            en: { translation: en },
            hi: { translation: hi },
            gu: { translation: gu },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

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
