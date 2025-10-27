/**
 * BigInt parsing utilities
 *
 * Functions for converting strings to bigint amounts
 *
 * @module bigint/parse
 */

import { parseUnits } from 'viem';

/**
 * Parse token amount from string to bigint
 *
 * @param amount - Amount as string (e.g., "1.5")
 * @param decimals - Token decimals
 * @returns Parsed bigint amount or null if invalid
 *
 * @example
 * ```ts
 * parseTokenAmount("1", 18) // 1000000000000000000n
 * parseTokenAmount("1.5", 18) // 1500000000000000000n
 * parseTokenAmount("", 18) // null
 * parseTokenAmount("abc", 18) // null
 * ```
 */
export function parseTokenAmount(amount: string, decimals: number): bigint | null {
	try {
		if (!amount || amount === '' || amount === '.') return null;
		return parseUnits(amount, decimals);
	} catch {
		return null;
	}
}

/**
 * Check if amount is valid (> 0 and <= balance)
 *
 * @param amount - Amount to validate
 * @param balance - Available balance
 * @returns true if amount is valid
 *
 * @example
 * ```ts
 * isValidTokenAmount(100n, 1000n) // true
 * isValidTokenAmount(0n, 1000n) // false
 * isValidTokenAmount(1001n, 1000n) // false
 * ```
 */
export function isValidTokenAmount(amount: bigint, balance: bigint): boolean {
	return amount > 0n && amount <= balance;
}
