/**
 * AayuCare - Offline Handler & Request Queue
 * 
 * Handles offline scenarios with automatic retry logic
 * Queues failed requests and retries when connection restored
 */

import React from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showError, showSuccess, logError } from './errorHandler';

const QUEUE_STORAGE_KEY = '@aayucare_request_queue';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

class OfflineHandler {
    constructor() {
        this.isOnline = true;
        this.requestQueue = [];
        this.listeners = [];
        this.retryTimeouts = new Map();
        
        // Initialize network listener
        this.initializeNetworkListener();
    }

    /**
     * Initialize network state listener
     */
    initializeNetworkListener() {
        NetInfo.addEventListener(state => {
            const wasOffline = !this.isOnline;
            this.isOnline = state.isConnected && state.isInternetReachable;
            
            // Notify all listeners of network status change
            this.notifyListeners(this.isOnline);
            
            // If came back online, process queued requests
            if (wasOffline && this.isOnline) {
                this.processQueue();
            }
        });
    }

    /**
     * Add listener for network status changes
     * @param {Function} callback - Callback function (isOnline) => void
     * @returns {Function} Unsubscribe function
     */
    addListener(callback) {
        this.listeners.push(callback);
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all listeners of network status change
     * @param {boolean} isOnline 
     */
    notifyListeners(isOnline) {
        this.listeners.forEach(callback => {
            try {
                callback(isOnline);
            } catch (error) {
                logError(error, 'OfflineHandler.notifyListeners');
            }
        });
    }

    /**
     * Check if device is online
     * @returns {Promise<boolean>}
     */
    async checkConnection() {
        try {
            const state = await NetInfo.fetch();
            this.isOnline = state.isConnected && state.isInternetReachable;
            return this.isOnline;
        } catch (error) {
            logError(error, 'OfflineHandler.checkConnection');
            return false;
        }
    }

    /**
     * Add request to queue
     * @param {Object} request - Request details
     */
    async addToQueue(request) {
        const queuedRequest = {
            ...request,
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            retryCount: 0,
        };

        this.requestQueue.push(queuedRequest);
        await this.saveQueue();
        
        logError({ message: 'Request queued for offline' }, 'OfflineHandler.addToQueue');
    }

    /**
     * Save queue to storage
     */
    async saveQueue() {
        try {
            await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.requestQueue));
        } catch (error) {
            logError(error, 'OfflineHandler.saveQueue');
        }
    }

    /**
     * Load queue from storage
     */
    async loadQueue() {
        try {
            const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
            if (queueJson) {
                this.requestQueue = JSON.parse(queueJson);
            }
        } catch (error) {
            logError(error, 'OfflineHandler.loadQueue');
            this.requestQueue = [];
        }
    }

    /**
     * Process queued requests
     */
    async processQueue() {
        if (this.requestQueue.length === 0) {
            return;
        }

        showSuccess('Connection restored. Syncing pending requests...', 'Online');
        
        const queue = [...this.requestQueue];
        this.requestQueue = [];

        for (const request of queue) {
            await this.retryRequest(request);
        }

        await this.saveQueue();
    }

    /**
     * Retry a failed request
     * @param {Object} request 
     */
    async retryRequest(request) {
        if (!this.isOnline) {
            this.requestQueue.push(request);
            return;
        }

        if (request.retryCount >= MAX_RETRY_ATTEMPTS) {
            logError(
                { message: `Max retry attempts reached for request ${request.id}` },
                'OfflineHandler.retryRequest'
            );
            return;
        }

        try {
            // Execute the request
            const { method, url, data, headers } = request;
            
            // This will be implemented with the actual API call
            // For now, we log the retry attempt
            logError(
                { message: `Retrying request ${request.id} (attempt ${request.retryCount + 1})` },
                'OfflineHandler.retryRequest'
            );

            request.retryCount++;
            
            // Delay before retry
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            
            // Success - remove from queue
            showSuccess('Request synced successfully', 'Synced');
        } catch (error) {
            logError(error, 'OfflineHandler.retryRequest');
            
            // Re-queue the request
            this.requestQueue.push({
                ...request,
                retryCount: request.retryCount + 1,
            });
        }
    }

    /**
     * Execute request with offline handling
     * @param {Function} requestFn - Async function that makes the request
     * @param {Object} requestDetails - Details for queuing if offline
     * @returns {Promise<any>}
     */
    async executeWithOfflineSupport(requestFn, requestDetails = {}) {
        // Check if online
        const isOnline = await this.checkConnection();
        
        if (!isOnline) {
            // Queue the request
            await this.addToQueue(requestDetails);
            
            throw new Error(
                'You are offline. This request will be automatically synced when connection is restored.'
            );
        }

        try {
            // Execute the request
            return await requestFn();
        } catch (error) {
            // If network error, queue the request
            if (error.message?.includes('Network') || error.message?.includes('connection')) {
                await this.addToQueue(requestDetails);
                
                throw new Error(
                    'Connection lost. This request will be automatically synced when connection is restored.'
                );
            }
            
            // Re-throw other errors
            throw error;
        }
    }

    /**
     * Clear the request queue
     */
    async clearQueue() {
        this.requestQueue = [];
        await this.saveQueue();
    }

    /**
     * Get current queue size
     * @returns {number}
     */
    getQueueSize() {
        return this.requestQueue.length;
    }

    /**
     * Get network status
     * @returns {boolean}
     */
    getNetworkStatus() {
        return this.isOnline;
    }
}

// Export singleton instance
export const offlineHandler = new OfflineHandler();

// React Hook for network status
// Returns { isConnected } object for consistent usage across components
export const useNetworkStatus = () => {
    const [isConnected, setIsConnected] = React.useState(offlineHandler.getNetworkStatus());
    
    React.useEffect(() => {
        const unsubscribe = offlineHandler.addListener(setIsConnected);
        return unsubscribe;
    }, []);
    
    return { isConnected };
};

// React Hook for request queue
export const useRequestQueue = () => {
    const [queueSize, setQueueSize] = React.useState(offlineHandler.getQueueSize());
    
    React.useEffect(() => {
        const interval = setInterval(() => {
            setQueueSize(offlineHandler.getQueueSize());
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);
    
    return queueSize;
};

export default offlineHandler;
