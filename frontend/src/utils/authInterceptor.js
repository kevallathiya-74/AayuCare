/**
 * AayuCare - Auth Interceptor Setup
 * Sets up axios interceptor to handle authentication errors globally
 */

import api from '../services/api';
import appStorage from './appStorage';
import { STORAGE_KEYS } from './constants';

// Runtime guard: Ensure appStorage is properly wired
if (!appStorage || typeof appStorage.getItem !== 'function') {
  console.error('[AuthInterceptor] CRITICAL: appStorage module not properly loaded!');
  console.error('[AuthInterceptor] appStorage:', appStorage);
  throw new Error('appStorage module is not properly initialized in authInterceptor');
}

let store;

/**
 * Initialize auth interceptor with Redux store
 * Call this once during app initialization
 */
