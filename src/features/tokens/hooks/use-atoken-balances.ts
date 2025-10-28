import { useMemo, useRef, useEffect } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { type Address, parseUnits } from 'viem';
import { type TokenConfig } from '../config/tokens';
import { useUserTokensContext } from '../context/UserTokensContext';
import { formatTokenAmount } from '@/shared/lib/bigint-utils';
import { ERC20_BALANCE_ABI } from '@/shared/contracts/erc20';
import { BALANCE_REFETCH_INTERVAL_MS } from '@/shared/constants/timing';
import { useDepositContext } from '@/features/lending/context/DepositContext';

interface ATokenBalance {
	token: TokenConfig;
	aTokenAddress: Address;
	raw: bigint;
	formatted: string;
	formattedWithSymbol: string;
	isOptimistic?: boolean; // Flag for optimistic updates during deposit
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
	const { depositingTokenSymbol, depositingAmount } = useDepositContext();

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
	const { data, isLoading, error, refetch } = useReadContracts({
		contracts,
		query: {
			enabled: !!address && userTokens.length > 0,
			refetchInterval: BALANCE_REFETCH_INTERVAL_MS,
			staleTime: 0, // Always consider data stale to ensure fresh reads after deposits
			placeholderData: (previousData) => previousData, // Keep previous data during refetch to prevent flickering
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

	// Store the last optimistic position to prevent flicker between transaction completion and data refetch
	const lastOptimisticPosition = useRef<ATokenBalance | null>(null);

	// Create or update optimistic position
	const currentOptimisticPosition = useMemo((): ATokenBalance | null => {
		if (!depositingTokenSymbol || !depositingAmount) return null;

		// Find the token being deposited and its index
		const depositingTokenIndex = userTokens.findIndex((t) => t.symbol === depositingTokenSymbol);
		if (depositingTokenIndex === -1) return null;

		const depositingToken = userTokens[depositingTokenIndex];
		if (!depositingToken) return null;

		// Check current balance from data
		const existingResult = data?.[depositingTokenIndex];
		const existingBalance = (existingResult?.status === 'success' ? existingResult.result : 0n) as bigint;

		// If real balance already exists, don't show optimistic
		if (existingBalance > 0n) return null;

		// Parse the depositing amount
		try {
			const rawAmount = parseUnits(depositingAmount, depositingToken.decimals);
			const formatted = formatTokenAmount(rawAmount, depositingToken.decimals, 6);

			return {
				token: depositingToken,
				aTokenAddress: depositingToken.aTokenAddress as Address,
				raw: rawAmount,
				formatted,
				formattedWithSymbol: `${formatted} a${depositingToken.symbol}`,
				isOptimistic: true,
			};
		} catch {
			return null; // Invalid amount
		}
	}, [depositingTokenSymbol, depositingAmount, userTokens, data]);

	// Update lastOptimisticPosition when we have a new optimistic position
	useEffect(() => {
		if (currentOptimisticPosition) {
			lastOptimisticPosition.current = currentOptimisticPosition;
		}
	}, [currentOptimisticPosition]);

	// Clear lastOptimisticPosition when real data arrives for that token
	useEffect(() => {
		if (lastOptimisticPosition.current && data) {
			const tokenIndex = userTokens.findIndex(
				(t) => t.symbol === lastOptimisticPosition.current?.token.symbol
			);
			if (tokenIndex !== -1) {
				const result = data[tokenIndex];
				const balance = (result?.status === 'success' ? result.result : 0n) as bigint;
				// If real balance now exists, clear the optimistic position
				if (balance > 0n) {
					lastOptimisticPosition.current = null;
				}
			}
		}
	}, [data, userTokens]);

	// Use current optimistic or fallback to last optimistic (prevents flicker)
	const optimisticPosition = currentOptimisticPosition || lastOptimisticPosition.current;

	// Filter positions with meaningful balance
	// Exclude tokens with dust amounts (raw > 0 but formatted as "0")
	// Memoized to prevent unnecessary recalculations and table flickering
	const basePositions = useMemo(
		() => balances.filter((b) => b.raw > 0n && b.formatted !== '0'),
		[balances]
	);

	// Add optimistic position without sorting to prevent flickering
	const positions = useMemo(() => {
		if (optimisticPosition) {
			// Remove any existing position for the same token to prevent duplicates
			const filteredBase = basePositions.filter(
				(p) => p.token.symbol !== optimisticPosition.token.symbol
			);
			// Add optimistic position at the end to maintain stable order
			return [...filteredBase, optimisticPosition];
		}
		return basePositions;
	}, [optimisticPosition, basePositions]);

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
		balances: hasAddress ? balances : [],
		positions: hasAddress ? positions : [],
		isLoading: shouldShowLoading,
		error,
		refetch,
	};
}
