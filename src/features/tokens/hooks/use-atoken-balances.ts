import { useMemo, useRef, useEffect } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { type Address } from 'viem';
import { type TokenConfig } from '../config/tokens';
import { useUserTokensContext } from '../context/UserTokensContext';
import { formatTokenAmount } from '@/shared/lib/bigint-utils';
import { ERC20_BALANCE_ABI } from '@/shared/contracts/erc20';
import { BALANCE_REFETCH_INTERVAL_MS } from '@/shared/constants/timing';

interface ATokenBalance {
	token: TokenConfig;
	aTokenAddress: Address;
	raw: bigint;
	formatted: string;
	formattedWithSymbol: string;
}

/**
 * Hook to fetch aToken balances for all supported tokens
 *
 * Uses dynamic tokens from useUserTokens() and useReadContracts
 * for efficient batch fetching of all aToken balances
 */
export function useATokenBalances() {
	const { address } = useAccount();
	const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokensContext();

	// Create contract calls for all aToken balances
	const contracts = useMemo(
		() =>
			userTokens.map((token) => ({
				address: token.aTokenAddress as Address,
				abi: ERC20_BALANCE_ABI,
				functionName: 'balanceOf' as const,
				args: [address!],
			})),
		[userTokens, address]
	);

	// Fetch all balances in a single multicall
	const { data, isLoading, isFetching, error, refetch } = useReadContracts({
		contracts,
		query: {
			enabled: !!address && userTokens.length > 0,
			refetchInterval: BALANCE_REFETCH_INTERVAL_MS,
			staleTime: 0, // Always consider data stale to ensure fresh reads after deposits
		},
	});

	const balances: ATokenBalance[] = useMemo(
		() =>
			userTokens.map((token, index) => {
				const result = data?.[index];
				const rawBalance = (result?.status === 'success' ? result.result : 0n) as bigint;

				// Format the balance using bigint-utils for precision safety
				const formatted = formatTokenAmount(rawBalance, token.decimals, 6);

				return {
					token,
					aTokenAddress: token.aTokenAddress as Address,
					raw: rawBalance,
					formatted,
					formattedWithSymbol: `${formatted} a${token.symbol}`,
				};
			}),
		[userTokens, data]
	);

	// Filter positions with meaningful balance
	// Exclude tokens with dust amounts (raw > 0 but formatted as "0")
	const currentPositions = balances.filter((b) => b.raw > 0n && b.formatted !== '0');

	// Store previous positions to prevent flickering during refetch
	const previousPositionsRef = useRef<ATokenBalance[]>([]);

	// Update previous positions only when we have new valid data and not currently fetching
	useEffect(() => {
		if (currentPositions.length > 0 && !isFetching) {
			previousPositionsRef.current = currentPositions;
		}
	}, [currentPositions, isFetching]);

	// During refetch, show previous positions instead of empty state
	// This prevents the "No positions yet" message from flashing
	const positions = isFetching && currentPositions.length === 0 ? previousPositionsRef.current : currentPositions;

	// Determine loading state to prevent showing empty states prematurely
	// Only show loading skeleton during INITIAL load, not during background refetches
	const hasAddress = !!address;
	const isLoadingInitialTokens = hasAddress && isLoadingUserTokens;
	const isWaitingForBalanceData = hasAddress && userTokens.length > 0 && !data;

	// Use isLoading (initial load) but NOT isFetching (background refetch)
	// This prevents the skeleton from flashing every 30 seconds during refetchInterval
	// Important: Only show loading when wallet is connected (hasAddress)
	const shouldShowLoading = hasAddress && (isLoadingInitialTokens || isWaitingForBalanceData || isLoading);

	return {
		balances,
		positions,
		isLoading: shouldShowLoading,
		error,
		refetch,
	};
}
