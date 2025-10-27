import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@/test/test-utils';
import { renderWithProviders } from '@/test/test-utils';
import { TokenList } from './TokenList';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { useTokenBalances } from '../hooks/use-token-balances';

// Mock the hooks
vi.mock('@/features/wallet/hooks/use-wallet', () => ({
	useWallet: vi.fn(),
}));

vi.mock('../hooks/use-token-balances', () => ({
	useTokenBalances: vi.fn(),
}));

describe('TokenList', () => {
	const mockTokenBalances = [
		{
			token: {
				symbol: 'USDC',
				name: 'USD Coin',
				address: '0x1234' as `0x${string}`,
				decimals: 6,
				supportsPermit: true,
			},
			raw: 1000000n,
			formatted: '1.000000',
			formattedWithSymbol: '1.000000 USDC',
		},
		{
			token: {
				symbol: 'DAI',
				name: 'Dai Stablecoin',
				address: '0x5678' as `0x${string}`,
				decimals: 18,
				supportsPermit: true,
			},
			raw: 2000000000000000000n,
			formatted: '2.000000000000000000',
			formattedWithSymbol: '2.000000000000000000 DAI',
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders wallet not connected state', () => {
		vi.mocked(useWallet).mockReturnValue({
			isConnected: false,
			isWrongNetwork: false,
		} as ReturnType<typeof useWallet>);

		vi.mocked(useTokenBalances).mockReturnValue({
			balances: [],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		renderWithProviders(<TokenList />);

		expect(screen.getByText(/Connect your wallet to view balances/i)).toBeInTheDocument();
	});

	it('renders loading skeletons when data is loading', () => {
		vi.mocked(useWallet).mockReturnValue({
			isConnected: true,
			isWrongNetwork: false,
		} as ReturnType<typeof useWallet>);

		vi.mocked(useTokenBalances).mockReturnValue({
			balances: [],
			isLoading: true,
			error: null,
			refetch: vi.fn(),
		});

		renderWithProviders(<TokenList />);

		// Should render loading skeletons (3 of them)
		const skeletons = document.querySelectorAll('.animate-pulse');
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it('renders token list when connected and data loaded', () => {
		vi.mocked(useWallet).mockReturnValue({
			isConnected: true,
			isWrongNetwork: false,
		} as ReturnType<typeof useWallet>);

		vi.mocked(useTokenBalances).mockReturnValue({
			balances: mockTokenBalances,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		renderWithProviders(<TokenList />);

		// Should render token symbols
		expect(screen.getByText('USDC')).toBeInTheDocument();
		expect(screen.getByText('DAI')).toBeInTheDocument();

		// Should render token names
		expect(screen.getByText('USD Coin')).toBeInTheDocument();
		expect(screen.getByText('Dai Stablecoin')).toBeInTheDocument();

		// Should render balances
		expect(screen.getByText(/1\.000000/)).toBeInTheDocument();
		expect(screen.getByText(/2\.000000000000000000/)).toBeInTheDocument();
	});

	it('renders section heading', () => {
		vi.mocked(useWallet).mockReturnValue({
			isConnected: true,
			isWrongNetwork: false,
		} as ReturnType<typeof useWallet>);

		vi.mocked(useTokenBalances).mockReturnValue({
			balances: mockTokenBalances,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		renderWithProviders(<TokenList />);

		expect(screen.getByText(/Your tokens \(available to deposit\)/i)).toBeInTheDocument();
	});
});
