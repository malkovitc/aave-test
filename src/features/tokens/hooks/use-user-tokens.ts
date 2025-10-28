/**
 * Hook to dynamically discover user's tokens that can be deposited to Aave
 *
 * Strategy:
 * 1. Get all reserves from Aave Pool
 * 2. For each reserve, check user's balance
 * 3. Filter to show only tokens user has + all major tokens
 * 4. Auto-detect permit support
 *
 * Composition:
 * - discoverTokensFromReserves: Orchestrates token discovery (see token-discovery service)
 * - React Query: Handles caching and refetch logic
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { getChainConfig } from '../config/chains';
import { discoverTokensFromReserves, type DiscoveredToken } from '../services/token-discovery';

/**
 * Options for filtering discovered tokens
 */
interface UseUserTokensOptions {
	onlyWithBalance?: boolean;
}

/**
 * React Query cache configuration
 */
const QUERY_CONFIG = {
	STALE_TIME: 60_000, // Consider data fresh for 60 seconds
	GC_TIME: 5 * 60 * 1000, // Keep in cache for 5 minutes
} as const;

/**
 * Hook to fetch and manage user's available tokens for Aave deposits
 *
 * Features:
 * - Auto-discovers all tokens from Aave reserves
 * - Fetches user balances in parallel batches
 * - Auto-detects EIP-2612 permit support
 * - Optimized caching with stale-while-revalidate
 * - Optional filtering by balance
 *
 * @param options - Configuration options
 * @param options.onlyWithBalance - If true, only return tokens with non-zero balance
 * @returns React Query result with discovered tokens
 *
 * @example
 * // Get all tokens (including zero balance)
 * const { data: allTokens } = useUserTokens();
 *
 * // Get only tokens user owns
 * const { data: ownedTokens } = useUserTokens({ onlyWithBalance: true });
 */
export function useUserTokens(options: UseUserTokensOptions = {}) {
	const { address, chainId } = useAccount();
	const publicClient = usePublicClient();

	return useQuery({
		queryKey: ['user-tokens', address, chainId, options.onlyWithBalance],
		queryFn: async (): Promise<DiscoveredToken[]> => {
			// Early return if prerequisites not met
			if (!address || !publicClient || !chainId) {
				return [];
			}

			// Get chain configuration
			const chainConfig = getChainConfig(chainId);
			const poolAddress = chainConfig.poolAddress;

			// Discover tokens using service layer
			return discoverTokensFromReserves(publicClient, address, poolAddress, options);
		},
		enabled: !!address && !!publicClient && !!chainId,
		// Optimized caching for performance
		staleTime: QUERY_CONFIG.STALE_TIME,
		gcTime: QUERY_CONFIG.GC_TIME,
		refetchOnWindowFocus: false, // Don't refetch on tab focus (reduces unnecessary calls)
		refetchInterval: false, // Disable automatic polling (user can manually refresh)
		// Use placeholderData to show previous data while refetching (stale-while-revalidate pattern)
		placeholderData: (previousData) => previousData,
	});
}

// Re-export types for convenience
export type { DiscoveredToken };
