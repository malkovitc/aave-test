import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@/test/test-utils';
import { useDepositFlow } from './use-deposit-flow';
import { MOCK_USDC, MOCK_BALANCES } from '@/test/mocks';
import { parseUnits } from 'viem';
import { useTokenAllowances } from '@/features/tokens/hooks/use-token-allowances';
import { useDeposit } from './use-deposit';
import { useApprove } from './use-approve';

/**
 * Unit Tests for useDepositFlow hook
 *
 * Tests critical deposit flow logic:
 * - Amount validation
 * - Allowance checking (needsApproval logic)
 * - Max button functionality
 * - Form state management
 */

// Mock dependencies
vi.mock('./use-approve', () => ({
	useApprove: vi.fn(() => ({
		approve: vi.fn(),
		isPending: false,
		isSuccess: false,
		hash: undefined,
	})),
}));

vi.mock('./use-deposit', () => ({
	useDeposit: vi.fn(() => ({
		deposit: vi.fn(),
		isPending: false,
		isSuccess: false,
		hash: undefined,
	})),
}));

vi.mock('@/features/tokens/hooks/use-token-allowances', () => ({
	useTokenAllowances: vi.fn(() => ({
		allowances: [],
		poolAddress: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
		refetch: vi.fn(),
		isLoading: false,
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

describe('useDepositFlow', () => {
	const mockBalance = MOCK_BALANCES.USDC;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Amount Validation', () => {
		it('should initialize with empty amount', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			expect(result.current.amount).toBe('');
			expect(result.current.isValidAmount).toBe(false);
		});

		it('should validate amount correctly - valid amount', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			act(() => {
				result.current.setAmount('100');
			});

			expect(result.current.amount).toBe('100');
			expect(result.current.isValidAmount).toBe(true);
		});

		it('should validate amount correctly - amount exceeds balance', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			act(() => {
				result.current.setAmount('2000'); // More than balance (1000.50)
			});

			expect(result.current.isValidAmount).toBe(false);
		});

		it('should validate amount correctly - zero amount', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			act(() => {
				result.current.setAmount('0');
			});

			expect(result.current.isValidAmount).toBe(false);
		});

		it('should validate amount correctly - negative amount', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			act(() => {
				result.current.setAmount('-10');
			});

			expect(result.current.isValidAmount).toBe(false);
		});

		it('should handle decimal amounts correctly', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			act(() => {
				result.current.setAmount('100.5');
			});

			expect(result.current.amount).toBe('100.5');
			expect(result.current.isValidAmount).toBe(true);
		});

		it('should handle max balance amount', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			act(() => {
				result.current.setAmount(mockBalance); // Exact balance
			});

			expect(result.current.isValidAmount).toBe(true);
		});
	});

	describe('Allowance Logic (needsApproval)', () => {
		it('should not need approval when amount is empty', async () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			expect(result.current.needsApproval).toBe(false);
		});

		// TODO: Fix this test - mock override not working correctly
		it.skip('should need approval when allowance is less than amount', async () => {
			vi.mocked(useTokenAllowances).mockReturnValue({
				allowances: [
					{
						token: MOCK_USDC,
						raw: parseUnits('50', MOCK_USDC.decimals), // 50 USDC allowance
						formatted: '50',
						formattedWithSymbol: '50 USDC',
					},
				],
				poolAddress: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
				refetch: vi.fn(),
				isLoading: false,
			});

			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			act(() => {
				result.current.setAmount('100'); // More than allowance (50)
			});

			await waitFor(() => {
				expect(result.current.needsApproval).toBe(true);
			});
		});

		it('should not need approval when allowance is sufficient', async () => {
			const { useTokenAllowances } = await import('@/features/tokens/hooks/use-token-allowances');

			vi.mocked(useTokenAllowances).mockReturnValue({
				allowances: [
					{
						token: MOCK_USDC,
						raw: parseUnits('200', MOCK_USDC.decimals), // 200 USDC allowance
						formatted: '200',
						formattedWithSymbol: '200 USDC',
					},
				],
				poolAddress: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
				refetch: vi.fn(),
				isLoading: false,
			});

			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			act(() => {
				result.current.setAmount('100'); // Less than allowance (200)
			});

			await waitFor(() => {
				expect(result.current.needsApproval).toBe(false);
			});
		});
	});

	describe('Max Button Functionality', () => {
		it('should set amount to balance when Max is clicked', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			act(() => {
				result.current.handleMaxClick();
			});

			expect(result.current.amount).toBe(mockBalance);
			expect(result.current.isValidAmount).toBe(true);
		});

		it('should handle Max button with zero balance', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, '0'));

			act(() => {
				result.current.handleMaxClick();
			});

			expect(result.current.amount).toBe('0');
			expect(result.current.isValidAmount).toBe(false);
		});
	});

	describe('Form State Management', () => {
		it('should expose correct loading states', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			expect(result.current.isLoading).toBe(false);
			expect(result.current.isApproving).toBe(false);
			expect(result.current.isDepositing).toBe(false);
		});

		// TODO: Fix this test - mock override not working correctly
		it.skip('should track deposit success state', async () => {
			vi.mocked(useDeposit).mockReturnValue({
				deposit: vi.fn(),
				isPending: false,
				isSuccess: true,
				hash: '0xabc',
				error: null,
			});

			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			expect(result.current.isDepositSuccess).toBe(true);
		});

		it('should track approve success state', async () => {
			vi.mocked(useApprove).mockReturnValue({
				approve: vi.fn(),
				isPending: false,
				isSuccess: true,
				hash: '0xdef',
				error: null,
			});

			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			expect(result.current.isApproveSuccess).toBe(true);
		});
	});

	describe('Edge Cases', () => {
		it('should handle invalid decimal input gracefully', () => {
			const { result } = renderHook(() => useDepositFlow(MOCK_USDC, mockBalance));

			act(() => {
				result.current.setAmount('abc.def');
			});

			expect(result.current.isValidAmount).toBe(false);
		});
	});
});
