import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@/test/test-utils';
import { useWithdrawFlow } from './use-withdraw-flow';
import { MOCK_USDC, MOCK_ATOKEN_BALANCES_DATA } from '@/test/mocks';
import type { Address } from 'viem';

/**
 * Unit Tests for useWithdrawFlow hook
 *
 * Tests critical withdraw flow logic:
 * - Amount validation against aToken balance
 * - Withdraw functionality
 * - Form state management
 * - Edge cases
 */

// Mock dependencies
vi.mock('./use-withdraw', () => ({
	useWithdraw: vi.fn(() => ({
		withdraw: vi.fn(),
		isPending: false,
		isSuccess: false,
		hash: undefined,
	})),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/react-query')>();
	return {
		...actual,
		useQueryClient: vi.fn(() => ({
			invalidateQueries: vi.fn(),
		})),
	};
});

describe('useWithdrawFlow', () => {
	const mockATokenBalance = MOCK_ATOKEN_BALANCES_DATA.USDC; // '100.00'
	const mockATokenAddress: Address = '0x16dA4541aD1807f4443d92D26044C1147406EB80';

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Amount Validation', () => {
		it('should initialize with empty amount', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			expect(result.current.amount).toBe('');
			expect(result.current.isValidAmount).toBe(false);
		});

		it('should validate amount correctly - valid amount', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			act(() => {
				result.current.setAmount('50');
			});

			expect(result.current.amount).toBe('50');
			expect(result.current.isValidAmount).toBe(true);
		});

		it('should validate amount correctly - amount exceeds aToken balance', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			act(() => {
				result.current.setAmount('200'); // More than balance (100)
			});

			expect(result.current.isValidAmount).toBe(false);
		});

		it('should validate amount correctly - zero amount', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			act(() => {
				result.current.setAmount('0');
			});

			expect(result.current.isValidAmount).toBe(false);
		});

		it('should validate amount correctly - exact balance', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			act(() => {
				result.current.setAmount(mockATokenBalance); // Exact balance
			});

			expect(result.current.isValidAmount).toBe(true);
		});

		it('should handle decimal amounts correctly', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			act(() => {
				result.current.setAmount('50.75');
			});

			expect(result.current.amount).toBe('50.75');
			expect(result.current.isValidAmount).toBe(true);
		});
	});

	describe('Withdraw Functionality', () => {
		it('should call withdraw with correct amount', async () => {
			const mockWithdraw = vi.fn();
			const { useWithdraw } = await import('./use-withdraw');

			vi.mocked(useWithdraw).mockReturnValue({
				withdraw: mockWithdraw,
				isPending: false,
				isSuccess: false,
				hash: undefined,
				error: null,
			});

			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			act(() => {
				result.current.setAmount('50');
			});

			await act(async () => {
				await result.current.handleWithdraw();
			});

			expect(mockWithdraw).toHaveBeenCalledWith('50', false);
		});

		it('should not call withdraw when amount is empty', async () => {
			const mockWithdraw = vi.fn();
			const { useWithdraw } = await import('./use-withdraw');

			vi.mocked(useWithdraw).mockReturnValue({
				withdraw: mockWithdraw,
				isPending: false,
				isSuccess: false,
				hash: undefined,
				error: null,
			});

			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			await act(async () => {
				await result.current.handleWithdraw();
			});

			expect(mockWithdraw).not.toHaveBeenCalled();
		});
	});

	describe('Form State Management', () => {
		it('should expose correct loading states', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			expect(result.current.isLoading).toBe(false);
			expect(result.current.isWithdrawing).toBe(false);
		});

		it('should track withdraw success state', async () => {
			const { useWithdraw } = await import('./use-withdraw');

			vi.mocked(useWithdraw).mockReturnValue({
				withdraw: vi.fn(),
				isPending: false,
				isSuccess: true,
				hash: '0xabc',
				error: null,
			});

			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			expect(result.current.isWithdrawSuccess).toBe(true);
		});

		it('should expose aToken address', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			expect(result.current.aTokenAddress).toBe(mockATokenAddress);
		});

		it('should reset form after successful withdrawal', async () => {
			const { useWithdraw } = await import('./use-withdraw');

			// First render with isSuccess = false
			const mockUseWithdraw = vi.fn(() => ({
				withdraw: vi.fn(),
				isPending: false,
				isSuccess: false,
				hash: undefined,
				error: null,
			}));

			vi.mocked(useWithdraw).mockImplementation(mockUseWithdraw);

			const { result, rerender } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			act(() => {
				result.current.setAmount('50');
			});

			expect(result.current.amount).toBe('50');

			// Simulate successful withdrawal
			mockUseWithdraw.mockReturnValue({
				withdraw: vi.fn(),
				isPending: false,
				isSuccess: true,
				hash: '0xabc',
				error: null,
			});

			rerender();

			await waitFor(() => {
				expect(result.current.amount).toBe('');
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle zero balance', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, '0', mockATokenAddress));

			act(() => {
				result.current.setAmount('10');
			});

			expect(result.current.isValidAmount).toBe(false);
		});

		it('should handle invalid decimal input gracefully', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			act(() => {
				result.current.setAmount('invalid');
			});

			expect(result.current.isValidAmount).toBe(false);
		});

		it('should handle negative amounts', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, mockATokenAddress));

			act(() => {
				result.current.setAmount('-10');
			});

			expect(result.current.isValidAmount).toBe(false);
		});

		it('should handle missing aToken address', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, mockATokenBalance, undefined));

			expect(result.current.aTokenAddress).toBeUndefined();
		});
	});

	describe('Balance Comparison', () => {
		it('should reject amount slightly more than balance', () => {
			const { result } = renderHook(() => useWithdrawFlow(MOCK_USDC, '100.00', mockATokenAddress));

			act(() => {
				result.current.setAmount('100.01');
			});

			expect(result.current.isValidAmount).toBe(false);
		});
	});
});
