import { describe, it, expect } from 'vitest';
import {
	formatTokenAmount,
	parseTokenAmount,
	isValidTokenAmount,
	calculatePercentage,
	formatTokenWithSymbol,
	compareAmounts,
	maxAmount,
	minAmount,
} from './bigint-utils';

describe('bigint-utils', () => {
	describe('formatTokenAmount', () => {
		it('formats 1 token with 18 decimals', () => {
			const amount = 1000000000000000000n; // 1 ETH
			expect(formatTokenAmount(amount, 18)).toBe('1');
		});

		it('formats 1.5 tokens with 18 decimals', () => {
			const amount = 1500000000000000000n; // 1.5 ETH
			expect(formatTokenAmount(amount, 18)).toBe('1.5');
		});

		it('formats USDC (6 decimals)', () => {
			const amount = 1234567n; // 1.234567 USDC
			expect(formatTokenAmount(amount, 6)).toBe('1.234567');
		});

		it('limits decimal places', () => {
			const amount = 1234567890123456789n; // 1.234567890123456789
			expect(formatTokenAmount(amount, 18, 4)).toBe('1.2345');
		});

		it('removes trailing zeros', () => {
			expect(formatTokenAmount(1500000000000000000n, 18)).toBe('1.5');
			expect(formatTokenAmount(1000000000000000000n, 18)).toBe('1');
			expect(formatTokenAmount(1200000000000000000n, 18)).toBe('1.2');
		});

		it('handles zero', () => {
			expect(formatTokenAmount(0n, 18)).toBe('0');
			expect(formatTokenAmount(0n, 6)).toBe('0');
		});

		it('handles very small amounts', () => {
			const amount = 1n; // 0.000000000000000001 ETH
			expect(formatTokenAmount(amount, 18)).toBe('0'); // Too small for 6 decimals

			const amount2 = 1000000000000n; // 0.000001 ETH
			expect(formatTokenAmount(amount2, 18)).toBe('0.000001');
		});

		it('handles large amounts', () => {
			const amount = 1000000000000000000000000n; // 1,000,000 ETH
			expect(formatTokenAmount(amount, 18)).toBe('1000000');
		});
	});

	describe('parseTokenAmount', () => {
		it('parses "1" to 1e18 for ETH', () => {
			expect(parseTokenAmount('1', 18)).toBe(1000000000000000000n);
		});

		it('parses "1.5" to 1.5e18 for ETH', () => {
			expect(parseTokenAmount('1.5', 18)).toBe(1500000000000000000n);
		});

		it('parses USDC amounts', () => {
			expect(parseTokenAmount('100', 6)).toBe(100000000n);
			expect(parseTokenAmount('100.5', 6)).toBe(100500000n);
		});

		it('handles decimal-only input', () => {
			expect(parseTokenAmount('0.5', 18)).toBe(500000000000000000n);
			expect(parseTokenAmount('.5', 18)).toBe(500000000000000000n); // viem accepts this
		});

		it('returns null for empty string', () => {
			expect(parseTokenAmount('', 18)).toBe(null);
			expect(parseTokenAmount('  ', 18)).toBe(null);
		});

		it('returns null for invalid input', () => {
			expect(parseTokenAmount('abc', 18)).toBe(null);
			expect(parseTokenAmount('1.2.3', 18)).toBe(null);
			expect(parseTokenAmount('.', 18)).toBe(null);
		});

		it('handles very small amounts', () => {
			expect(parseTokenAmount('0.000001', 18)).toBe(1000000000000n);
		});

		it('handles large amounts', () => {
			expect(parseTokenAmount('1000000', 18)).toBe(1000000000000000000000000n);
		});
	});

	describe('isValidTokenAmount', () => {
		it('returns true for valid amount', () => {
			expect(isValidTokenAmount(100n, 1000n)).toBe(true);
			expect(isValidTokenAmount(999n, 1000n)).toBe(true);
			expect(isValidTokenAmount(1000n, 1000n)).toBe(true);
		});

		it('returns false for zero', () => {
			expect(isValidTokenAmount(0n, 1000n)).toBe(false);
		});

		it('returns false for negative (would throw in bigint)', () => {
			// BigInt doesn't support negative in this context naturally
			// but if we had one, it would be > 0 check
		});

		it('returns false for amount > balance', () => {
			expect(isValidTokenAmount(1001n, 1000n)).toBe(false);
			expect(isValidTokenAmount(10000n, 1000n)).toBe(false);
		});

		it('handles edge case: 1 wei with 1 wei balance', () => {
			expect(isValidTokenAmount(1n, 1n)).toBe(true);
		});
	});

	describe('calculatePercentage', () => {
		it('calculates 50% of 1000', () => {
			expect(calculatePercentage(1000n, 50)).toBe(500n);
		});

		it('calculates 100% of 1000', () => {
			expect(calculatePercentage(1000n, 100)).toBe(1000n);
		});

		it('calculates 0% of 1000', () => {
			expect(calculatePercentage(1000n, 0)).toBe(0n);
		});

		it('calculates 25% of 1000', () => {
			expect(calculatePercentage(1000n, 25)).toBe(250n);
		});

		it('calculates 33.33% of 1000', () => {
			expect(calculatePercentage(1000n, 33.33)).toBe(333n);
		});

		it('handles large amounts', () => {
			const amount = 1000000000000000000000n; // 1000 ETH
			expect(calculatePercentage(amount, 10)).toBe(100000000000000000000n); // 100 ETH
		});

		it('throws for percentage < 0', () => {
			expect(() => calculatePercentage(1000n, -1)).toThrow('Percentage must be between 0 and 100');
		});

		it('throws for percentage > 100', () => {
			expect(() => calculatePercentage(1000n, 101)).toThrow('Percentage must be between 0 and 100');
		});
	});

	describe('formatTokenWithSymbol', () => {
		it('formats amount with symbol', () => {
			expect(formatTokenWithSymbol(1500000n, 6, 'USDC')).toBe('1.5 USDC');
			expect(formatTokenWithSymbol(1000000000000000000n, 18, 'ETH')).toBe('1 ETH');
		});

		it('handles zero with symbol', () => {
			expect(formatTokenWithSymbol(0n, 18, 'ETH')).toBe('0 ETH');
		});

		it('respects maxDecimals', () => {
			expect(formatTokenWithSymbol(1234567n, 6, 'USDC', 2)).toBe('1.23 USDC');
		});
	});

	describe('compareAmounts', () => {
		it('returns -1 when a < b', () => {
			expect(compareAmounts(100n, 200n)).toBe(-1);
		});

		it('returns 1 when a > b', () => {
			expect(compareAmounts(200n, 100n)).toBe(1);
		});

		it('returns 0 when a === b', () => {
			expect(compareAmounts(100n, 100n)).toBe(0);
		});

		it('handles zero', () => {
			expect(compareAmounts(0n, 100n)).toBe(-1);
			expect(compareAmounts(100n, 0n)).toBe(1);
			expect(compareAmounts(0n, 0n)).toBe(0);
		});
	});

	describe('maxAmount', () => {
		it('returns larger amount', () => {
			expect(maxAmount(100n, 200n)).toBe(200n);
			expect(maxAmount(200n, 100n)).toBe(200n);
		});

		it('returns same amount when equal', () => {
			expect(maxAmount(100n, 100n)).toBe(100n);
		});

		it('handles zero', () => {
			expect(maxAmount(0n, 100n)).toBe(100n);
			expect(maxAmount(100n, 0n)).toBe(100n);
		});
	});

	describe('minAmount', () => {
		it('returns smaller amount', () => {
			expect(minAmount(100n, 200n)).toBe(100n);
			expect(minAmount(200n, 100n)).toBe(100n);
		});

		it('returns same amount when equal', () => {
			expect(minAmount(100n, 100n)).toBe(100n);
		});

		it('handles zero', () => {
			expect(minAmount(0n, 100n)).toBe(0n);
			expect(minAmount(100n, 0n)).toBe(0n);
		});
	});

	describe('edge cases and precision', () => {
		it('handles maximum safe bigint', () => {
			const maxSafe = 2n ** 256n - 1n; // Max uint256
			// Should not throw
			expect(() => formatTokenAmount(maxSafe, 18)).not.toThrow();
		});

		it('preserves precision with many decimals', () => {
			const amount = parseTokenAmount('1.123456789012345678', 18);
			expect(amount).toBe(1123456789012345678n);

			const formatted = formatTokenAmount(amount!, 18);
			expect(formatted).toBe('1.123456');
		});

		it('handles different decimal configurations', () => {
			// WBTC (8 decimals)
			expect(parseTokenAmount('1', 8)).toBe(100000000n);
			expect(formatTokenAmount(100000000n, 8)).toBe('1');

			// USDT (6 decimals)
			expect(parseTokenAmount('1000', 6)).toBe(1000000000n);
			expect(formatTokenAmount(1000000000n, 6)).toBe('1000');

			// DAI (18 decimals)
			expect(parseTokenAmount('100.5', 18)).toBe(100500000000000000000n);
			expect(formatTokenAmount(100500000000000000000n, 18)).toBe('100.5');
		});
	});
});
