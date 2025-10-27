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
 * - fetchAaveReserves: Get reserves list from Pool contract
 * - fetchTokenData: Get ERC20 metadata + balance + reserve data in parallel
 * - checkPermitSupport: Detect if token supports EIP-2612 permit
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import type { PublicClient, Address } from 'viem';
import { SUPPORTED_TOKENS, type TokenConfig } from '../config/tokens';
import { getChainConfig } from '../config/chains';
import { fetchAaveReserves } from '../services/aave-reserves';
import { fetchTokenData } from '../services/token-data';
import { TOKEN_FETCH_BATCH_SIZE } from '@/shared/constants/batch';
import { ERC20_PERMIT_ABI } from '@/shared/contracts/erc20';

/**
 * Extended token configuration with user balance information
 */
export interface DiscoveredToken extends TokenConfig {
	balance: bigint;
	balanceFormatted: string;
}

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
 * Token comparison for sorting: tokens with balance first, then alphabetically
 */
type TokenComparator = (a: DiscoveredToken, b: DiscoveredToken) => number;

/**
 * Checks if token supports EIP-2612 permit by reading DOMAIN_SEPARATOR
 *
 * @param publicClient - Viem public client
 * @param tokenAddress - Token contract address
 * @returns true if token supports permit, false otherwise
 */
async function checkPermitSupport(publicClient: PublicClient, tokenAddress: Address): Promise<boolean> {
	try {
		await publicClient.readContract({
			address: tokenAddress,
			abi: ERC20_PERMIT_ABI,
			functionName: 'DOMAIN_SEPARATOR',
		});
		return true;
	} catch {
		// Token doesn't implement DOMAIN_SEPARATOR - no permit support
		return false;
	}
}

/**
 * Finds known token configuration by address
 *
 * @param address - Token address to lookup
 * @returns Known token config or undefined
 */
function findKnownToken(address: Address): TokenConfig | undefined {
	return Object.values(SUPPORTED_TOKENS).find((token) => token.address.toLowerCase() === address.toLowerCase());
}

/**
 * Determines permit support for a token
 * Uses known configuration if available, otherwise detects dynamically
 *
 * @param publicClient - Viem public client
 * @param tokenAddress - Token contract address
 * @param knownToken - Pre-configured token (if available)
 * @returns Promise resolving to permit support status
 */
async function determinePermitSupport(
	publicClient: PublicClient,
	tokenAddress: Address,
	knownToken?: TokenConfig
): Promise<boolean> {
	// Use known config if available
	if (knownToken?.supportsPermit !== undefined) {
		return knownToken.supportsPermit;
	}

	// Dynamically detect for unknown tokens
	return checkPermitSupport(publicClient, tokenAddress);
}

/**
 * Builds a DiscoveredToken from fetched data
 *
 * @param reserveAddress - Token address
 * @param tokenData - Fetched token metadata and balance
 * @param supportsPermit - Whether token supports EIP-2612
 * @param knownToken - Known token config (if available)
 * @returns Complete DiscoveredToken object
 */
function buildDiscoveredToken(
	reserveAddress: Address,
	tokenData: Awaited<ReturnType<typeof fetchTokenData>>,
	supportsPermit: boolean,
	knownToken?: TokenConfig
): DiscoveredToken {
	if (!tokenData) {
		throw new Error('Token data is required to build DiscoveredToken');
	}

	return {
		symbol: tokenData.symbol,
		name: tokenData.name,
		decimals: tokenData.decimals,
		address: reserveAddress,
		aTokenAddress: tokenData.aTokenAddress,
		icon: knownToken?.icon,
		supportsPermit,
		balance: tokenData.balance,
		balanceFormatted: tokenData.balanceFormatted,
	};
}

/**
 * Processes a single reserve to create a DiscoveredToken
 *
 * @param publicClient - Viem public client
 * @param reserveAddress - Token address
 * @param userAddress - User wallet address
 * @param poolAddress - Aave Pool address
 * @param options - Filter options
 * @returns DiscoveredToken or null if filtered out
 */
async function processReserve(
	publicClient: PublicClient,
	reserveAddress: Address,
	userAddress: Address,
	poolAddress: Address,
	options: UseUserTokensOptions
): Promise<DiscoveredToken | null> {
	// Fetch token data (ERC20 metadata + balance + reserve data)
	const tokenData = await fetchTokenData(publicClient, reserveAddress, userAddress, poolAddress);

	if (!tokenData) {
		return null;
	}

	// Filter: skip if user has no balance and onlyWithBalance is true
	if (options.onlyWithBalance && tokenData.balance === 0n) {
		return null;
	}

	// Find known token configuration
	const knownToken = findKnownToken(reserveAddress);

	// Determine permit support
	const supportsPermit = await determinePermitSupport(publicClient, reserveAddress, knownToken);

	// Build complete token object
	return buildDiscoveredToken(reserveAddress, tokenData, supportsPermit, knownToken);
}

/**
 * Processes reserves in batches to avoid rate limiting
 *
 * @param publicClient - Viem public client
 * @param reserves - Array of reserve addresses
 * @param userAddress - User wallet address
 * @param poolAddress - Aave Pool address
 * @param options - Filter options
 * @returns Array of discovered tokens
 */
async function processReservesInBatches(
	publicClient: PublicClient,
	reserves: Address[],
	userAddress: Address,
	poolAddress: Address,
	options: UseUserTokensOptions
): Promise<DiscoveredToken[]> {
	const discovered: DiscoveredToken[] = [];

	// Process in batches to avoid rate limiting
	for (let i = 0; i < reserves.length; i += TOKEN_FETCH_BATCH_SIZE) {
		const batch = reserves.slice(i, i + TOKEN_FETCH_BATCH_SIZE);

		const tokenPromises = batch.map((reserveAddress) =>
			processReserve(publicClient, reserveAddress, userAddress, poolAddress, options)
		);

		// Wait for current batch to complete
		const results = await Promise.all(tokenPromises);
		const validTokens = results.filter((token): token is DiscoveredToken => token !== null);

		discovered.push(...validTokens);
	}

	return discovered;
}

/**
 * Sorts tokens: tokens with balance first, then alphabetically by symbol
 */
const sortTokens: TokenComparator = (a, b) => {
	// Tokens with balance come first
	if (a.balance > 0n && b.balance === 0n) return -1;
	if (a.balance === 0n && b.balance > 0n) return 1;

	// Same balance status - sort alphabetically
	return a.symbol.localeCompare(b.symbol);
};

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

			// Fetch all reserves from Aave Pool
			const reserves = await fetchAaveReserves(publicClient, poolAddress);

			// Process reserves in batches
			const discovered = await processReservesInBatches(publicClient, reserves, address, poolAddress, options);

			// Sort: tokens with balance first, then alphabetically
			discovered.sort(sortTokens);

			return discovered;
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
