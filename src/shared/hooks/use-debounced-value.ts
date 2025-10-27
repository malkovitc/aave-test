import { useEffect, useState } from 'react';

/**
 * Hook for debouncing values
 *
 * Delays updating the returned value until the input value hasn't changed
 * for a specified delay period. Useful for search inputs, amount fields, etc.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const [amount, setAmount] = useState('');
 * const debouncedAmount = useDebouncedValue(amount, 300);
 *
 * // Heavy calculation only runs after user stops typing for 300ms
 * useEffect(() => {
 *   const result = parseUnits(debouncedAmount, 18);
 *   // Do something with result
 * }, [debouncedAmount]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		// Set a timeout to update the debounced value after the delay
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		// Cleanup: cancel the timeout if value changes before delay expires
		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}
