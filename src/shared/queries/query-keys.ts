import type { Address } from 'viem';

/**
 * Query Key Factories for TanStack Query (wagmi)
 *
 * Benefits:
 * - Centralized query key management
 * - Type-safe query keys
 * - Easy invalidation patterns
 * - Clear query hierarchy
 *
 * Best Practices (TanStack Query):
 * 1. Use hierarchical keys: ['tokens'] → ['tokens', 'balances'] → ['tokens', 'balances', address]
 * 2. Most general keys at the top
 * 3. Factory functions for consistency
 * 4. as const for literal types
 *
 * Usage:
 * ```ts
 * // In component
 * const { data } = useQuery({
 *   queryKey: tokenKeys.balance(address, tokenAddress),
 *   queryFn: () => fetchBalance(address, tokenAddress)
 * });
 *
 * // Invalidate all token balances
 * queryClient.invalidateQueries({ queryKey: tokenKeys.balances() });
 *
 * // Invalidate specific token balance
 * queryClient.invalidateQueries({ queryKey: tokenKeys.balance(address, tokenAddress) });
 * ```
 */

// Token-related queries
export const tokenKeys = {
	all: ['tokens'] as const,

	// Token balances
	balances: () => [...tokenKeys.all, 'balances'] as const,
	balance: (userAddress: Address, tokenAddress: Address) =>
		[...tokenKeys.balances(), userAddress, tokenAddress] as const,

	// aToken balances
	aTokenBalances: () => [...tokenKeys.all, 'aTokenBalances'] as const,
	aTokenBalance: (userAddress: Address, aTokenAddress: Address) =>
		[...tokenKeys.aTokenBalances(), userAddress, aTokenAddress] as const,

	// Token allowances
	allowances: () => [...tokenKeys.all, 'allowances'] as const,
	allowance: (tokenAddress: Address, spenderAddress: Address) =>
		[...tokenKeys.allowances(), tokenAddress, spenderAddress] as const,

	// Token discovery (user's custom tokens)
	discovery: () => [...tokenKeys.all, 'discovery'] as const,
	userTokens: (userAddress: Address) => [...tokenKeys.discovery(), userAddress] as const,
};

// Lending protocol queries
export const lendingKeys = {
	all: ['lending'] as const,

	// Pool data
	pools: () => [...lendingKeys.all, 'pools'] as const,
	pool: (poolAddress: Address) => [...lendingKeys.pools(), poolAddress] as const,

	// User positions
	positions: () => [...lendingKeys.all, 'positions'] as const,
	userPosition: (userAddress: Address, tokenAddress: Address) =>
		[...lendingKeys.positions(), userAddress, tokenAddress] as const,

	// Reserve data (APY, liquidity, etc.)
	reserves: () => [...lendingKeys.all, 'reserves'] as const,
	reserve: (tokenAddress: Address) => [...lendingKeys.reserves(), tokenAddress] as const,
};

// Price feed queries
export const priceKeys = {
	all: ['prices'] as const,

	// Token prices
	tokens: () => [...priceKeys.all, 'tokens'] as const,
	tokenPrice: (tokenAddress: Address) => [...priceKeys.tokens(), tokenAddress] as const,

	// Batch prices
	batch: (tokenAddresses: Address[]) => [...priceKeys.tokens(), 'batch', tokenAddresses] as const,
};

// Transaction queries
export const transactionKeys = {
	all: ['transactions'] as const,

	// Transaction receipts
	receipts: () => [...transactionKeys.all, 'receipts'] as const,
	receipt: (txHash: string) => [...transactionKeys.receipts(), txHash] as const,

	// Transaction history
	history: () => [...transactionKeys.all, 'history'] as const,
	userHistory: (userAddress: Address) => [...transactionKeys.history(), userAddress] as const,
};

/**
 * Helper to invalidate all queries related to a user
 * Useful after wallet change or successful transaction
 */
export function getUserRelatedKeys(userAddress: Address) {
	return [
		tokenKeys.balances(),
		tokenKeys.aTokenBalances(),
		tokenKeys.userTokens(userAddress),
		lendingKeys.positions(),
		transactionKeys.userHistory(userAddress),
	];
}

/**
 * Helper to invalidate all queries related to a token
 * Useful after deposit/withdraw
 */
export function getTokenRelatedKeys(tokenAddress: Address, userAddress: Address) {
	return [
		tokenKeys.balance(userAddress, tokenAddress),
		tokenKeys.aTokenBalance(userAddress, tokenAddress),
		tokenKeys.allowance(tokenAddress, userAddress),
		lendingKeys.userPosition(userAddress, tokenAddress),
		lendingKeys.reserve(tokenAddress),
	];
}
