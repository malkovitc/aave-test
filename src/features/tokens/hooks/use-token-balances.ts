import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { getAllTokens } from '../config/tokens';

/**
 * Dynamic hook to fetch balances for all supported tokens
 * Uses useReadContracts for efficient batch fetching
 * Automatically scales with SUPPORTED_TOKENS - no hardcoded limits
 */
export function useTokenBalances() {
	const { address } = useAccount();
	const tokens = useMemo(() => getAllTokens(), []);

	// Build contracts array dynamically based on tokens
	const contracts = useMemo(
		() =>
			tokens.map((token) => ({
				address: token.address,
				abi: erc20Abi,
				functionName: 'balanceOf' as const,
				args: [address!],
			})),
		[tokens, address]
	);

	const { data, isLoading, error, refetch } = useReadContracts({
		contracts,
		query: {
			enabled: !!address && contracts.length > 0,
			staleTime: 0, // Always consider data stale to ensure fresh reads after deposits
		},
	});

	const balances = useMemo(
		() =>
			tokens.map((token, index) => {
				const result = data?.[index];
				const rawBalance = (result?.status === 'success' ? result.result : 0n) as bigint;
				const formatted = formatUnits(rawBalance, token.decimals);

				return {
					token,
					raw: rawBalance,
					formatted,
					formattedWithSymbol: `${formatted} ${token.symbol}`,
				};
			}),
		[tokens, data]
	);

	const finalIsLoading = isLoading && !!address; // Only show loading when wallet is connected
	console.log('[useTokenBalances] address:', address, 'isLoading:', isLoading, 'finalIsLoading:', finalIsLoading);

	return {
		balances,
		isLoading: finalIsLoading,
		error,
		refetch,
	};
}
