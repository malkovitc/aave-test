import { useMemo } from 'react';
import { parseUnits } from 'viem';

/**
 * Shared hook for amount validation across deposit and withdraw flows
 *
 * Validates that:
 * - Amount is not empty
 * - Amount can be parsed as a valid number
 * - Amount is greater than 0
 * - Amount does not exceed available balance
 *
 * @param amount - The amount string to validate
 * @param balance - The available balance string
 * @param decimals - Token decimals for parsing
 * @returns Whether the amount is valid
 */
export function useAmountValidation(amount: string, balance: string, decimals: number): boolean {
	return useMemo(() => {
		if (!amount) return false;

		try {
			const amountBigInt = parseUnits(amount, decimals);
			const balanceBigInt = parseUnits(balance || '0', decimals);
			return amountBigInt > 0n && amountBigInt <= balanceBigInt;
		} catch {
			return false;
		}
	}, [amount, balance, decimals]);
}
