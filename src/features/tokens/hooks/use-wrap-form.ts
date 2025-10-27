import { useState, useCallback, useMemo } from 'react';
import { parseEther, formatEther } from 'viem';

/**
 * Configuration for WETH wrapper form
 */
const WRAP_CONFIG = {
	GAS_RESERVE_ETH: 0.01, // Reserve ETH for gas fees when wrapping
	MAX_DECIMALS: 4, // Decimal places for max amount display
	MIN_AMOUNT: 0, // Minimum valid amount
} as const;

/**
 * Safely parses amount string to ether bigint
 *
 * @param amount - Amount string to parse
 * @returns Parsed bigint or null if invalid
 */
function safeParseEther(amount: string): bigint | null {
	try {
		return parseEther(amount);
	} catch {
		return null;
	}
}

/**
 * Validates if amount string is a valid positive number
 *
 * @param amount - Amount string to validate
 * @returns true if valid positive number
 *
 * @example
 * isValidAmountString('1.5')   // true
 * isValidAmountString('0')     // false (not positive)
 * isValidAmountString('abc')   // false (not a number)
 * isValidAmountString('')      // false (empty)
 */
function isValidAmountString(amount: string): boolean {
	if (!amount) return false;

	const parsed = parseFloat(amount);
	return !isNaN(parsed) && parsed > WRAP_CONFIG.MIN_AMOUNT;
}

/**
 * Checks if user has sufficient balance for the amount
 *
 * @param amount - Amount string to check
 * @param balance - User's balance in wei
 * @returns true if balance is sufficient
 *
 * @example
 * hasSufficientBalance('1.0', parseEther('2.0'))  // true
 * hasSufficientBalance('3.0', parseEther('2.0'))  // false
 * hasSufficientBalance('abc', parseEther('2.0'))  // false
 */
function hasSufficientBalance(amount: string, balance: bigint | undefined): boolean {
	if (!balance) return false;
	if (!isValidAmountString(amount)) return false;

	const amountWei = safeParseEther(amount);
	if (amountWei === null) return false;

	return amountWei <= balance;
}

/**
 * Calculates maximum wrappable ETH amount (balance minus gas reserve)
 *
 * @param ethBalance - Current ETH balance in wei
 * @returns Formatted max amount string or '0' if insufficient
 *
 * @example
 * calculateMaxEth(parseEther('1.0'))   // '0.9900'
 * calculateMaxEth(parseEther('0.005')) // '0' (less than gas reserve)
 * calculateMaxEth(undefined)           // '0'
 */
function calculateMaxEth(ethBalance: bigint | undefined): string {
	if (!ethBalance) return '0';

	const balanceEth = parseFloat(formatEther(ethBalance));
	const maxAmount = balanceEth - WRAP_CONFIG.GAS_RESERVE_ETH;

	return maxAmount > WRAP_CONFIG.MIN_AMOUNT ? maxAmount.toFixed(WRAP_CONFIG.MAX_DECIMALS) : '0';
}

/**
 * Calculates maximum unwrappable WETH amount
 *
 * @param wethBalance - Current WETH balance in wei
 * @returns Formatted max amount string or '0' if no balance
 *
 * @example
 * calculateMaxWeth(parseEther('1.5'))  // '1.5'
 * calculateMaxWeth(undefined)          // '0'
 */
function calculateMaxWeth(wethBalance: bigint | undefined): string {
	if (!wethBalance) return '0';
	return formatEther(wethBalance);
}

/**
 * Hook for managing WETH wrapper form state
 *
 * Responsibilities:
 * - Manage amount input state
 * - Validate amount format and value
 * - Check if user has sufficient balance (ETH/WETH)
 * - Calculate max wrappable/unwrappable amounts
 * - Provide form state reset
 *
 * Features:
 * - Automatic gas reserve for ETH wrapping (0.01 ETH)
 * - Safe parsing with error handling
 * - Memoized validation for performance
 *
 * @param ethBalance - Current ETH balance in wei
 * @param wethBalance - Current WETH balance in wei
 * @returns Form state and handlers
 *
 * @example
 * const { amount, setAmount, hasEnoughEth, handleMaxEth } = useWrapForm(ethBalance, wethBalance);
 *
 * // User enters amount
 * setAmount('1.5');
 *
 * // Check if valid
 * if (hasEnoughEth) {
 *   // Proceed with wrap
 * }
 *
 * // Set max amount
 * handleMaxEth(); // Sets amount to (balance - 0.01 ETH)
 */
export function useWrapForm(ethBalance: bigint | undefined, wethBalance: bigint | undefined) {
	const [amount, setAmount] = useState('');

	/**
	 * Clears the form input
	 */
	const clearAmount = useCallback(() => {
		setAmount('');
	}, []);

	/**
	 * Validates if amount is a positive number
	 */
	const isValidAmount = useMemo(() => {
		return isValidAmountString(amount);
	}, [amount]);

	/**
	 * Checks if user has enough ETH for wrapping
	 * Considers the entered amount
	 */
	const hasEnoughEth = useMemo(() => {
		return hasSufficientBalance(amount, ethBalance);
	}, [amount, ethBalance]);

	/**
	 * Checks if user has enough WETH for unwrapping
	 * Considers the entered amount
	 */
	const hasEnoughWeth = useMemo(() => {
		return hasSufficientBalance(amount, wethBalance);
	}, [amount, wethBalance]);

	/**
	 * Sets amount to maximum wrappable ETH (balance minus gas reserve)
	 */
	const handleMaxEth = useCallback(() => {
		const maxAmount = calculateMaxEth(ethBalance);
		setAmount(maxAmount);
	}, [ethBalance]);

	/**
	 * Sets amount to maximum unwrappable WETH (full balance)
	 */
	const handleMaxWeth = useCallback(() => {
		const maxAmount = calculateMaxWeth(wethBalance);
		setAmount(maxAmount);
	}, [wethBalance]);

	return {
		// State
		amount,
		setAmount,
		clearAmount,

		// Validation
		isValidAmount,
		hasEnoughEth,
		hasEnoughWeth,

		// Max handlers
		handleMaxEth,
		handleMaxWeth,
	};
}
