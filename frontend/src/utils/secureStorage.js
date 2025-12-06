/**
 * AayuCare - Secure Storage Wrapper
 * 
 * Handles storage for both native (SecureStore) and web (AsyncStorage)
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

export const setItem = async (key, value) => {
    try {
        if (isWeb) {
            await AsyncStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    } catch (error) {
        console.error('Storage setItem error:', error);
        throw error;
    }
};

export const getItem = async (key) => {
    try {
        if (isWeb) {
            return await AsyncStorage.getItem(key);
        } else {
            return await SecureStore.getItemAsync(key);
        }
    } catch (error) {
        console.error('Storage getItem error:', error);
        return null;
    }
};

export const deleteItem = async (key) => {
    try {
        if (isWeb) {
            await AsyncStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    } catch (error) {
        // Silently handle errors - don't throw or show to user
        console.log('Storage deleteItem handled:', key);
    }
};

export default {
    setItem,
    getItem,
    deleteItem,
};
