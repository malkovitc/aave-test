import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { SUPPORTED_TOKENS } from '../config/tokens';

const WETH_CONFIG = SUPPORTED_TOKENS.WETH;

/**
 * Format balance with protection against Infinity values
 */
function formatBalance(value: bigint | undefined): string {
	if (value === undefined) return '0.0000';

	const formatted = parseFloat(formatEther(value));
	return isFinite(formatted) ? formatted.toFixed(4) : '0.0000';
}

/**
 * Hook for managing ETH and WETH balances
 *
 * Responsibilities:
 * - Fetch ETH balance
 * - Fetch WETH balance
 * - Format balances for display
 * - Provide refetch functions
 *
 * @returns Object with ETH/WETH balances and refetch functions
 */
export function useWethBalances() {
	const { address } = useAccount();

	// Get ETH balance
	const {
		data: ethBalance,
		refetch: refetchEth,
		isLoading: isLoadingEth,
	} = useBalance({
		address: address!,
		query: {
			enabled: !!address,
		},
	});

	// Get WETH balance
	const {
		data: wethBalance,
		refetch: refetchWeth,
		isLoading: isLoadingWeth,
	} = useBalance({
		address: address!,
		token: WETH_CONFIG?.address,
		query: {
			enabled: !!address && !!WETH_CONFIG,
		},
	});

	return {
		// Raw balance data
		ethBalance: ethBalance?.value,
		wethBalance: wethBalance?.value,

		// Formatted for display
		ethBalanceFormatted: formatBalance(ethBalance?.value),
		wethBalanceFormatted: formatBalance(wethBalance?.value),

		// Loading state
		isLoading: isLoadingEth || isLoadingWeth,

		// Refetch functions
		refetchBalances: () => {
			refetchEth();
			refetchWeth();
		},
	};
}
