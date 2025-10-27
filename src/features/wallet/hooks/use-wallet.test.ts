import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@/test/test-utils';
import { useWallet } from './use-wallet';
import * as wagmi from 'wagmi';

// Mock wagmi hooks
vi.mock('wagmi', async (importOriginal) => {
	const actual = await importOriginal<typeof import('wagmi')>();
	return {
		...actual,
		useAccount: vi.fn(),
		useConnect: vi.fn(),
		useDisconnect: vi.fn(),
		useBalance: vi.fn(),
		useSwitchChain: vi.fn(),
	};
});

describe('useWallet', () => {
	it('should return disconnected state by default', () => {
		vi.mocked(wagmi.useAccount).mockReturnValue({
			address: undefined,
			isConnected: false,
			chain: undefined,
			chainId: undefined,
		} as any);

		vi.mocked(wagmi.useConnect).mockReturnValue({
			connect: vi.fn(),
			connectors: [],
			isPending: false,
		} as any);

		vi.mocked(wagmi.useDisconnect).mockReturnValue({
			disconnect: vi.fn(),
		} as any);

		vi.mocked(wagmi.useBalance).mockReturnValue({
			data: undefined,
		} as any);

		vi.mocked(wagmi.useSwitchChain).mockReturnValue({
			switchChain: vi.fn(),
		} as any);

		const { result } = renderHook(() => useWallet());

		expect(result.current.isConnected).toBe(false);
		expect(result.current.address).toBeUndefined();
		expect(result.current.formattedAddress).toBe('');
	});

	it('should format address correctly when connected', () => {
		const mockAddress = '0x1234567890123456789012345678901234567890';

		vi.mocked(wagmi.useAccount).mockReturnValue({
			address: mockAddress,
			isConnected: true,
			chain: { id: 11155111 } as any,
			chainId: 11155111,
		} as any);

		vi.mocked(wagmi.useConnect).mockReturnValue({
			connect: vi.fn(),
			connectors: [],
			isPending: false,
		} as any);

		vi.mocked(wagmi.useDisconnect).mockReturnValue({
			disconnect: vi.fn(),
		} as any);

		vi.mocked(wagmi.useBalance).mockReturnValue({
			data: {
				formatted: '1.5',
				symbol: 'ETH',
			} as any,
		} as any);

		vi.mocked(wagmi.useSwitchChain).mockReturnValue({
			switchChain: vi.fn(),
		} as any);

		const { result } = renderHook(() => useWallet());

		expect(result.current.isConnected).toBe(true);
		expect(result.current.formattedAddress).toBe('0x1234...7890');
	});

	it('should detect wrong network', () => {
		vi.mocked(wagmi.useAccount).mockReturnValue({
			address: '0x1234567890123456789012345678901234567890',
			isConnected: true,
			chain: { id: 1 } as any, // Wrong network (mainnet instead of sepolia)
			chainId: 1,
		} as any);

		vi.mocked(wagmi.useConnect).mockReturnValue({
			connect: vi.fn(),
			connectors: [],
			isPending: false,
		} as any);

		vi.mocked(wagmi.useDisconnect).mockReturnValue({
			disconnect: vi.fn(),
		} as any);

		vi.mocked(wagmi.useBalance).mockReturnValue({
			data: undefined,
		} as any);

		vi.mocked(wagmi.useSwitchChain).mockReturnValue({
			switchChain: vi.fn(),
		} as any);

		const { result } = renderHook(() => useWallet());

		expect(result.current.isWrongNetwork).toBe(true);
	});
});
