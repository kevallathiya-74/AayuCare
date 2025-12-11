/**
 * AayuCare - Error Analytics Tracker
 * 
 * Tracks and stores error metrics for analytics dashboard
 * Can be integrated with Sentry or other error tracking services
 * 
 * NOTE: This module does NOT import errorHandler to avoid circular dependencies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_STORAGE_KEY = '@aayucare_error_analytics';
const MAX_STORED_ERRORS = 100; // Keep last 100 errors

class ErrorAnalytics {
    constructor() {
        this.errors = [];
        this.initialized = false;
        this.listeners = [];
    }

    /**
     * Initialize analytics storage
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const storedData = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
            if (storedData) {
                this.errors = JSON.parse(storedData);
            }
            this.initialized = true;
        } catch (error) {
            // Don't use logError here to avoid circular dependency
            console.error('[ErrorAnalytics.initialize] Failed:', error);
            this.errors = [];
            this.initialized = true;
        }
    }

    /**
     * Track an error
     * @param {Error|string} error 
     * @param {string} context 
     * @param {Object} metadata 
     */
    async trackError(error, context = '', metadata = {}) {
        await this.initialize();

        const errorRecord = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            date: new Date().toISOString(),
            message: error?.message || error || 'Unknown error',
            context,
            errorType: this.categorizeError(error),
            severity: this.determineSeverity(error),
            stack: error?.stack || null,
            metadata: {
                ...metadata,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
                platform: metadata.platform || 'Unknown',
            },
        };

        this.errors.unshift(errorRecord);

        // Keep only last MAX_STORED_ERRORS
        if (this.errors.length > MAX_STORED_ERRORS) {
            this.errors = this.errors.slice(0, MAX_STORED_ERRORS);
        }

        await this.saveAnalytics();
        this.notifyListeners();

        // TODO: Send to remote analytics service (e.g., Sentry)
        if (!__DEV__) {
            // Sentry.captureException(error, { tags: { context }, extra: metadata });
        }
    }

    /**
     * Categorize error by type
     * @param {Error|string} error 
     * @returns {string}
     */
    categorizeError(error) {
        const message = (error?.message || error || '').toLowerCase();

        if (message.includes('network') || message.includes('connection')) return 'NETWORK';
        if (message.includes('auth') || message.includes('unauthorized')) return 'AUTH';
        if (message.includes('validation') || message.includes('invalid')) return 'VALIDATION';
        if (message.includes('not found') || message.includes('404')) return 'NOT_FOUND';
        if (message.includes('server') || message.includes('500')) return 'SERVER';
        if (message.includes('timeout')) return 'TIMEOUT';

        return 'UNKNOWN';
    }

    /**
     * Determine error severity
     * @param {Error|string} error 
     * @returns {string}
     */
    determineSeverity(error) {
        const message = (error?.message || error || '').toLowerCase();

        if (message.includes('critical') || message.includes('fatal')) return 'CRITICAL';
        if (message.includes('server') || message.includes('500')) return 'HIGH';
        if (message.includes('auth') || message.includes('network')) return 'MEDIUM';
        
        return 'LOW';
    }

    /**
     * Save analytics to storage
     */
    async saveAnalytics() {
        try {
            await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.errors));
        } catch (error) {
            // Don't use logError here to avoid circular dependency
            console.error('[ErrorAnalytics.saveAnalytics] Failed:', error);
        }
    }

    /**
     * Get all errors
     * @returns {Array}
     */
    getAllErrors() {
        return this.errors;
    }

    /**
     * Get errors by type
     * @param {string} errorType 
     * @returns {Array}
     */
    getErrorsByType(errorType) {
        return this.errors.filter(err => err.errorType === errorType);
    }

    /**
     * Get errors by date range
     * @param {Date} startDate 
     * @param {Date} endDate 
     * @returns {Array}
     */
    getErrorsByDateRange(startDate, endDate) {
        const start = startDate.getTime();
        const end = endDate.getTime();
        return this.errors.filter(err => err.timestamp >= start && err.timestamp <= end);
    }

    /**
     * Get error statistics
     * @returns {Object}
     */
    getStatistics() {
        const stats = {
            total: this.errors.length,
            byType: {},
            bySeverity: {},
            byContext: {},
            last24Hours: 0,
            last7Days: 0,
            last30Days: 0,
        };

        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        this.errors.forEach(error => {
            // Count by type
            stats.byType[error.errorType] = (stats.byType[error.errorType] || 0) + 1;

            // Count by severity
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

            // Count by context
            stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;

            // Count by time range
            const age = now - error.timestamp;
            if (age <= day) stats.last24Hours++;
            if (age <= 7 * day) stats.last7Days++;
            if (age <= 30 * day) stats.last30Days++;
        });

        return stats;
    }

    /**
     * Get top errors
     * @param {number} limit 
     * @returns {Array}
     */
    getTopErrors(limit = 10) {
        // Group by message
        const grouped = {};
        this.errors.forEach(error => {
            const key = error.message;
            if (!grouped[key]) {
                grouped[key] = {
                    message: error.message,
                    count: 0,
                    lastOccurrence: error.timestamp,
                    errorType: error.errorType,
                    severity: error.severity,
                };
            }
            grouped[key].count++;
            if (error.timestamp > grouped[key].lastOccurrence) {
                grouped[key].lastOccurrence = error.timestamp;
            }
        });

        // Convert to array and sort by count
        const topErrors = Object.values(grouped)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return topErrors;
    }

    /**
     * Clear all analytics data
     */
    async clearAnalytics() {
        this.errors = [];
        await this.saveAnalytics();
        this.notifyListeners();
    }

    /**
     * Export analytics data
     * @returns {Object}
     */
    exportData() {
        return {
            errors: this.errors,
            statistics: this.getStatistics(),
            topErrors: this.getTopErrors(),
            exportDate: new Date().toISOString(),
        };
    }

    /**
     * Add listener for analytics updates
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all listeners
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.getStatistics());
            } catch (error) {
                // Don't use logError here to avoid circular dependency
                console.error('[ErrorAnalytics.notifyListeners] Callback failed:', error);
            }
        });
    }
}

// Export singleton instance
export const errorAnalytics = new ErrorAnalytics();

// React Hook for error analytics
export const useErrorAnalytics = () => {
    const [statistics, setStatistics] = React.useState(null);

    React.useEffect(() => {
        // Initialize and load data
        errorAnalytics.initialize().then(() => {
            setStatistics(errorAnalytics.getStatistics());
        });

        // Subscribe to updates
        const unsubscribe = errorAnalytics.addListener(setStatistics);
        return unsubscribe;
    }, []);

    return {
        statistics,
        getAllErrors: () => errorAnalytics.getAllErrors(),
        getTopErrors: (limit) => errorAnalytics.getTopErrors(limit),
        clearAnalytics: () => errorAnalytics.clearAnalytics(),
        exportData: () => errorAnalytics.exportData(),
    };
};

export default errorAnalytics;
