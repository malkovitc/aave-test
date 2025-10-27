import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@/test/test-utils';
import { useTokenBalances } from './use-token-balances';
import * as wagmi from 'wagmi';

// Mock wagmi hooks
vi.mock('wagmi', async (importOriginal) => {
	const actual = await importOriginal<typeof import('wagmi')>();
	return {
		...actual,
		useAccount: vi.fn(),
		useReadContracts: vi.fn(),
	};
});

// Mock tokens config
vi.mock('../config/tokens', () => ({
	getAllTokens: vi.fn(() => [
		{
			symbol: 'USDC',
			name: 'USD Coin',
			decimals: 6,
			address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
			aTokenAddress: '0x16dA4541aD1807f4443d92D26044C1147406EB80',
		},
		{
			symbol: 'DAI',
			name: 'Dai Stablecoin',
			decimals: 18,
			address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
			aTokenAddress: '0x29598b72eb5CeBd806C5dCD549490FdA35B13cD8',
		},
	]),
}));

describe('useTokenBalances', () => {
	it('should return empty balances when no address', () => {
		vi.mocked(wagmi.useAccount).mockReturnValue({
			address: undefined,
		} as any);

		vi.mocked(wagmi.useReadContracts).mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHook(() => useTokenBalances());

		expect(result.current.balances).toHaveLength(2);
		expect(result.current.balances[0].formatted).toBe('0');
		expect(result.current.balances[1].formatted).toBe('0');
	});

	it('should format balances correctly', () => {
		const mockAddress = '0x1234567890123456789012345678901234567890';

		vi.mocked(wagmi.useAccount).mockReturnValue({
			address: mockAddress,
		} as any);

		// Mock useReadContracts to return balances for both tokens
		vi.mocked(wagmi.useReadContracts).mockReturnValue({
			data: [
				{ status: 'success', result: 1000000n }, // 1 USDC (6 decimals)
				{ status: 'success', result: 1000000000000000000n }, // 1 DAI (18 decimals)
			],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHook(() => useTokenBalances());

		expect(result.current.balances[0].formatted).toBe('1');
		expect(result.current.balances[0].formattedWithSymbol).toBe('1 USDC');
		expect(result.current.balances[1].formatted).toBe('1');
		expect(result.current.balances[1].formattedWithSymbol).toBe('1 DAI');
	});

	it('should handle loading state', () => {
		vi.mocked(wagmi.useAccount).mockReturnValue({
			address: '0x1234567890123456789012345678901234567890',
		} as any);

		vi.mocked(wagmi.useReadContracts).mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
			refetch: vi.fn(),
		} as any);

		const { result } = renderHook(() => useTokenBalances());

		expect(result.current.isLoading).toBe(true);
	});
});
