/**
 * BigInt math utilities
 *
 * Functions for calculations and comparisons with bigint amounts
 *
 * @module bigint/math
 */

/**
 * Calculate percentage of amount
 *
 * @param amount - Base amount
 * @param percentage - Percentage (0-100)
 * @returns Calculated amount
 * @throws Error if percentage is out of range
 *
 * @example
 * ```ts
 * calculatePercentage(1000n, 50) // 500n (50%)
 * calculatePercentage(1000n, 100) // 1000n (100%)
 * calculatePercentage(1000n, 25) // 250n (25%)
 * ```
 */
export function calculatePercentage(amount: bigint, percentage: number): bigint {
	if (percentage < 0 || percentage > 100) {
		throw new Error('Percentage must be between 0 and 100');
	}
	// Multiply by percentage * 100 to preserve precision, then divide by 10000
	return (amount * BigInt(Math.floor(percentage * 100))) / 10000n;
}

/**
 * Compare two bigint amounts
 *
 * @param a - First amount
 * @param b - Second amount
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareAmounts(a: bigint, b: bigint): -1 | 0 | 1 {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

/**
 * Get the maximum of two amounts
 *
 * @param a - First amount
 * @param b - Second amount
 * @returns Maximum amount
 */
export function maxAmount(a: bigint, b: bigint): bigint {
	return a > b ? a : b;
}

/**
 * Get the minimum of two amounts
 *
 * @param a - First amount
 * @param b - Second amount
 * @returns Minimum amount
 */
export function minAmount(a: bigint, b: bigint): bigint {
	return a < b ? a : b;
}
