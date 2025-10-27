/**
 * Development-only logger utility
 *
 * Provides console logging that only works in development mode.
 * In production, all logs are no-ops for security and performance.
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/shared/lib/logger';
 *
 * logger.debug('User action', { action: 'deposit', amount });
 * logger.info('Transaction sent', { hash });
 * logger.warn('Slow transaction', { duration });
 * logger.error('Transaction failed', { error });
 * ```
 */

const isDev = import.meta.env.DEV;

/**
 * Development-only logger
 * All methods are no-ops in production for security and performance
 */
export const logger = {
	/**
	 * Debug-level logging (most verbose)
	 * Use for detailed debugging information
	 */
	debug: (message: string, ...args: unknown[]): void => {
		if (isDev) {
			console.log(`🔵 ${message}`, ...args);
		}
	},

	/**
	 * Info-level logging
	 * Use for general information
	 */
	info: (message: string, ...args: unknown[]): void => {
		if (isDev) {
			console.log(`ℹ️ ${message}`, ...args);
		}
	},

	/**
	 * Success-level logging
	 * Use for successful operations
	 */
	success: (message: string, ...args: unknown[]): void => {
		if (isDev) {
			console.log(`✅ ${message}`, ...args);
		}
	},

	/**
	 * Warning-level logging
	 * Use for recoverable issues
	 */
	warn: (message: string, ...args: unknown[]): void => {
		if (isDev) {
			console.warn(`⚠️ ${message}`, ...args);
		}
	},

	/**
	 * Error-level logging
	 * Use for errors and failures
	 * Note: These logs are kept in production for error tracking
	 */
	error: (message: string, ...args: unknown[]): void => {
		// Keep error logs in production for debugging
		console.error(`❌ ${message}`, ...args);
	},
};
