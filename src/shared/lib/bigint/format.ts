/**
 * BigInt formatting utilities
 *
 * Functions for converting bigint amounts to human-readable strings
 *
 * @module bigint/format
 */

import { formatUnits } from 'viem';

/**
 * Format token amount from bigint to human-readable string
 *
 * @param amount - Token amount in smallest unit (e.g., wei)
 * @param decimals - Token decimals (e.g., 18 for ETH, 6 for USDC)
 * @param maxDecimals - Maximum decimal places to show (default: 6)
 * @returns Formatted string (e.g., "1.5" for 1.5 USDC)
 *
 * @example
 * ```ts
 * formatTokenAmount(1000000000000000000n, 18) // "1"
 * formatTokenAmount(1500000000000000000n, 18) // "1.5"
 * formatTokenAmount(1234567n, 6) // "1.234567"
 * formatTokenAmount(1234567n, 6, 2) // "1.23"
 * ```
 */
export function formatTokenAmount(amount: bigint, decimals: number, maxDecimals = 6): string {
	if (amount === 0n) return '0';

	const formatted = formatUnits(amount, decimals);
	const [integer = '0', decimal] = formatted.split('.');

	if (!decimal) return integer;

	// Limit decimal places
	const truncated = decimal.slice(0, maxDecimals);
	// Remove trailing zeros
	const cleaned = truncated.replace(/0+$/, '');

	return cleaned ? `${integer}.${cleaned}` : integer;
}

/**
 * Format token amount for display with symbol
 *
 * @param amount - Token amount in smallest unit
 * @param decimals - Token decimals
 * @param symbol - Token symbol
 * @param maxDecimals - Maximum decimal places
 * @returns Formatted string with symbol (e.g., "1.5 USDC")
 *
 * @example
 * ```ts
 * formatTokenWithSymbol(1500000n, 6, "USDC") // "1.5 USDC"
 * formatTokenWithSymbol(1000000000000000000n, 18, "ETH") // "1 ETH"
 * ```
 */
export function formatTokenWithSymbol(amount: bigint, decimals: number, symbol: string, maxDecimals = 6): string {
	const formatted = formatTokenAmount(amount, decimals, maxDecimals);
	return `${formatted} ${symbol}`;
}
