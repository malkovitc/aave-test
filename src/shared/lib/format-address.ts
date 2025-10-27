/**
 * Address formatting utilities
 *
 * @module format-address
 */

/**
 * Format Ethereum address for display
 *
 * Truncates address to show first 6 and last 4 characters
 *
 * @param address - Ethereum address to format
 * @returns Formatted address (e.g., "0x1234...abcd")
 *
 * @example
 * ```ts
 * formatAddress("0x1234567890abcdef1234567890abcdef12345678")
 * // Returns: "0x1234...5678"
 * ```
 */
export function formatAddress(address: string | undefined): string {
	if (!address) return '';
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
